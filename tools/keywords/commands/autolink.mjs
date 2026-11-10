/**
 * commands/autolink.mjs
 * Add [[ ]] links for keywords found in article text. Dry run unless --write.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, extname, basename, relative } from 'path';
import { fileURLToPath } from 'url';
import { loadNotes, isThai } from '../lib/notes.mjs';
import { computeZones } from '../lib/zones.mjs';
import { findAllMatches } from '../lib/match.mjs';
import { parseLinks, stripLinks } from '../lib/links.mjs';
import { writeReport, timestamp } from '../lib/report.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Collect all .md files recursively */
function collectMd(dir) {
  const results = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) results.push(...collectMd(full));
    else if (e.isFile() && extname(e.name) === '.md') results.push(full);
  }
  return results;
}

function articleId(filepath) {
  const name = basename(filepath, '.md');
  const m = name.match(/^(\d+)/);
  return m ? m[1] : name;
}

function detectLineEnding(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

/** Check if a text span is inside emphasis (* ** _ __) or inline code (`) */
function buildExcludedSpans(lineText, linkInEmphasis) {
  const spans = [];
  if (!linkInEmphasis) {
    // Bold: **...** or __...__
    const boldRe = /\*\*(.+?)\*\*|__(.+?)__/g;
    let m;
    while ((m = boldRe.exec(lineText)) !== null) {
      spans.push([m.index, m.index + m[0].length]);
    }
    // Italic: *...* or _..._ (not already bold)
    const italicRe = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g;
    while ((m = italicRe.exec(lineText)) !== null) {
      spans.push([m.index, m.index + m[0].length]);
    }
  }
  // Inline code
  const codeRe = /`[^`]+`/g;
  let m;
  while ((m = codeRe.exec(lineText)) !== null) {
    spans.push([m.index, m.index + m[0].length]);
  }
  // Markdown links [text](url)
  const mdLinkRe = /\[[^\]]+\]\([^)]+\)/g;
  while ((m = mdLinkRe.exec(lineText)) !== null) {
    spans.push([m.index, m.index + m[0].length]);
  }
  // URLs
  const urlRe = /https?:\/\/\S+/g;
  while ((m = urlRe.exec(lineText)) !== null) {
    spans.push([m.index, m.index + m[0].length]);
  }
  // Existing [[...]] links
  const wikiRe = /\[\[[^\]]+\]\]/g;
  while ((m = wikiRe.exec(lineText)) !== null) {
    spans.push([m.index, m.index + m[0].length]);
  }
  return spans;
}

function isInSpan(start, end, spans) {
  for (const [s, e] of spans) {
    if (start >= s && end <= e) return true;
    if (start < e && end > s) return true; // partial overlap
  }
  return false;
}

/** Determine link priority score for density cap */
function linkPriority(canonical) {
  // Multi-word or has any uppercase letter (people, works, movements, proper nouns)
  const isMultiWordOrCaps = canonical.includes(' ') || /[A-Z]/.test(canonical);
  return isMultiWordOrCaps ? 1 : 0;
}

export default async function autolink(config, flags) {
  const { notesDir, articlesDir, stoplist = [] } = config;
  const {
    write,
    file: fileFilter,
    density = config.density ?? 1500,
    allOccurrences = false,
    includeGeneric = false,
    linkInEmphasis = config.linkInsideEmphasis ?? false,
  } = flags;

  const { notes, termIndex, ambiguous, stopSet } = loadNotes(notesDir, config);

  // Build term entries: { canonical, term, termLower }
  // All stoplisted terms are excluded by default (notes.mjs already removed them).
  // With --include-generic, Thai aliases of stoplisted notes are re-added.
  const termEntries = [];
  for (const [lower, canonical] of termIndex) {
    if (ambiguous.has(lower)) continue;
    // Find the actual term (may differ in case from lower)
    const note = notes.get(canonical);
    // Find matching term from note.terms
    const actualTerm = note.terms.find(t => t.toLowerCase() === lower) || canonical;
    termEntries.push({ canonical, term: actualTerm, termLower: lower });
  }

  // With --include-generic: also add Thai aliases of stoplisted notes
  if (includeGeneric) {
    for (const [canonical, note] of notes) {
      if (!stopSet.has(canonical.toLowerCase())) continue;
      for (const alias of note.aliases) {
        if (!isThai(alias)) continue;
        const lower = alias.toLowerCase();
        if (ambiguous.has(lower)) continue;
        if (termEntries.some(te => te.termLower === lower)) continue;
        termEntries.push({ canonical, term: alias, termLower: lower });
      }
    }
  }

  // Collect article files
  let articleFiles = collectMd(articlesDir);
  if (fileFilter) {
    articleFiles = articleFiles.filter(f => {
      const name = basename(f, '.md');
      return name.startsWith(fileFilter) || name === fileFilter;
    });
    if (articleFiles.length === 0) {
      console.error(`No article found matching: ${fileFilter}`);
      process.exit(1);
    }
  }

  const ts = timestamp();
  const reportLines = [];
  reportLines.push('# autolink Report');
  reportLines.push(`Mode: **${write ? 'WRITE' : 'DRY RUN'}**`);
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push(`Density: ${density === 0 ? 'disabled' : density}`);
  reportLines.push('');

  let totalScanned = 0;
  let totalChanged = 0;
  let totalLinksAdded = 0;

  const globalSkippedAmbiguous = new Set();
  const globalSkippedAlreadyLinked = new Map(); // article -> Set<canonical>
  const globalDroppedByDensity = [];
  const globalErrors = [];

  for (const artFile of articleFiles) {
    const id = articleId(artFile);
    totalScanned++;

    let content;
    try { content = readFileSync(artFile, 'utf8'); } catch { continue; }

    const lineEnding = detectLineEnding(content);
    const lines = content.split(/\r?\n/);
    const { linkableLines, openingMatterSkipped } = computeZones(lines);

    // Find notes already linked in the article (anywhere)
    const alreadyLinked = new Set();
    const allLinks = parseLinks(content);
    for (const { target } of allLinks) {
      if (target.includes('#') || target.includes('^')) continue;
      // Find canonical
      if (notes.has(target)) alreadyLinked.add(target);
      else {
        for (const [canonical, note] of notes) {
          if (canonical.toLowerCase() === target.toLowerCase()) {
            alreadyLinked.add(canonical);
            break;
          }
        }
      }
    }

    // Count linkable chars and existing links in linkable lines
    let linkableChars = 0;
    let existingLinksInLinkable = 0;
    for (const lineIdx of linkableLines) {
      const line = lines[lineIdx];
      linkableChars += line.length;
      const lineLinks = parseLinks(line);
      existingLinksInLinkable += lineLinks.length;
    }

    // Density cap
    const cap = density === 0 ? Infinity : Math.ceil(linkableChars / density);
    let newLinksAllowed = density === 0 ? Infinity : Math.max(0, cap - existingLinksInLinkable);

    // Find all candidate links across linkable paragraphs
    // Group linkable lines into paragraphs
    const paragraphs = [];
    let currentPara = null;
    const sortedLinkable = [...linkableLines].sort((a, b) => a - b);

    for (const lineIdx of sortedLinkable) {
      if (currentPara === null) {
        currentPara = { lineStart: lineIdx, lineEnd: lineIdx, text: lines[lineIdx] };
      } else if (lineIdx === currentPara.lineEnd + 1) {
        currentPara.lineEnd = lineIdx;
        currentPara.text += '\n' + lines[lineIdx];
      } else {
        paragraphs.push(currentPara);
        currentPara = { lineStart: lineIdx, lineEnd: lineIdx, text: lines[lineIdx] };
      }
    }
    if (currentPara) paragraphs.push(currentPara);

    // Collect all candidates
    const candidates = []; // { canonical, term, matched, lineIdx, charOffset, paraStart }
    const linkedInThisArticle = new Set(alreadyLinked); // tracks notes linked (existing + new)
    const noteLinkedInPara = new Map(); // paraIndex -> Set<canonical>

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx];
      const paraText = para.text;

      // Filter terms: skip already-linked (firstOccurrenceOnly)
      const activeTerm = termEntries.filter(te => {
        if (config.firstOccurrenceOnly && linkedInThisArticle.has(te.canonical)) return false;
        return true;
      });

      const matches = findAllMatches(paraText, activeTerm);

      for (const match of matches) {
        // Check excluded spans (emphasis, code, markdown links, existing links, URLs)
        // We need to check per-line exclusions
        // Find which line this match falls on
        let charCount = 0;
        let matchLineIdx = para.lineStart;
        const paraLines = paraText.split('\n');
        for (let pl = 0; pl < paraLines.length; pl++) {
          const lineLen = paraLines[pl].length + 1; // +1 for \n
          if (match.start < charCount + lineLen) {
            matchLineIdx = para.lineStart + pl;
            const lineLocalStart = match.start - charCount;
            const lineLocalEnd = match.end - charCount;
            const excludedSpans = buildExcludedSpans(paraLines[pl], linkInEmphasis);
            if (isInSpan(lineLocalStart, lineLocalEnd, excludedSpans)) break; // skip this match
            candidates.push({
              canonical: match.canonical,
              term: match.term,
              matched: match.matched,
              lineIdx: matchLineIdx,
              charOffset: match.start,
              paraIdx: pIdx,
            });
            break;
          }
          charCount += lineLen;
        }
      }
    }

    // Apply density cap: prioritize candidates
    // Sort: (1) multi-word/caps, (2) longer term, (3) earlier position
    const sortedCandidates = [...candidates].sort((a, b) => {
      const pa = linkPriority(a.canonical), pb = linkPriority(b.canonical);
      if (pa !== pb) return pb - pa;
      const la = a.term.length, lb = b.term.length;
      if (la !== lb) return lb - la;
      return a.charOffset - b.charOffset;
    });

    // De-dup: each note at most once per article (unless --all-occurrences)
    const selectedCandidates = [];
    const selectedNotes = new Set();
    const droppedDensity = [];

    for (const cand of sortedCandidates) {
      if (!allOccurrences && selectedNotes.has(cand.canonical)) continue;
      if (selectedCandidates.length >= newLinksAllowed) {
        droppedDensity.push(cand);
        continue;
      }
      selectedCandidates.push(cand);
      selectedNotes.add(cand.canonical);
    }

    if (droppedDensity.length > 0) {
      globalDroppedByDensity.push({ id, dropped: droppedDensity });
    }

    if (selectedCandidates.length === 0) continue;

    // Apply links: rebuild lines
    // Group by line
    const byLine = new Map();
    for (const cand of selectedCandidates) {
      if (!byLine.has(cand.lineIdx)) byLine.set(cand.lineIdx, []);
      byLine.get(cand.lineIdx).push(cand);
    }

    const newLines = [...lines];
    const addedLinks = [];

    for (const [lineIdx, lineCands] of byLine) {
      let lineText = newLines[lineIdx];
      // Sort by position desc to insert from right to left
      lineCands.sort((a, b) => b.charOffset - a.charOffset);

      for (const cand of lineCands) {
        const { canonical, matched, charOffset } = cand;
        // Find the match position in the CURRENT line text
        // (need to re-search since we've possibly modified it from previous insertions)
        // Use first occurrence from the right that equals matched
        const before = lineText.slice(0, charOffset);
        const after = lineText.slice(charOffset + matched.length);

        // Build link text
        let linkText;
        if (matched === canonical) {
          linkText = `[[${canonical}]]`;
        } else {
          linkText = `[[${canonical}|${matched}]]`;
        }

        lineText = before + linkText + after;
        addedLinks.push({ canonical, matched, lineIdx, lineText });
        totalLinksAdded++;
      }
      newLines[lineIdx] = lineText;
    }

    const newContent = newLines.join(lineEnding);

    // ── Verification ──────────────────────────────────────────────────────
    const strippedNew = stripLinks(newContent);
    const strippedOld = stripLinks(content);

    if (strippedNew !== strippedOld) {
      globalErrors.push({ id, reason: 'Verification failed: stripped content differs' });
      console.error(`ERROR: ${id} — verification failed, skipping.`);
      continue;
    }

    // Check line count
    const origLineCount = lines.length;
    const newLineCount = newLines.length;
    if (origLineCount !== newLineCount) {
      globalErrors.push({ id, reason: `Line count changed: ${origLineCount} → ${newLineCount}` });
      continue;
    }

    totalChanged++;

    // Build article report section
    reportLines.push(`### Article ${id}`);
    reportLines.push(`Links added: **${addedLinks.length}**`);
    reportLines.push('');
    for (const { canonical, matched, lineIdx } of addedLinks) {
      const ctx = lines[lineIdx];
      const ctxShort = ctx.length > 80 ? '...' + ctx.slice(Math.max(0, ctx.indexOf(matched) - 40), ctx.indexOf(matched) + matched.length + 40) + '...' : ctx;
      const linkRaw = matched === canonical ? `[[${canonical}]]` : `[[${canonical}|${matched}]]`;
      reportLines.push(`- **${canonical}** | matched: \`${matched}\` | line ${lineIdx + 1}`);
      reportLines.push(`  > ${ctxShort.replace(matched, linkRaw)}`);
    }

    if (openingMatterSkipped.length > 0) {
      reportLines.push('');
      reportLines.push('**Opening-matter paragraphs skipped:**');
      for (const { lineStart, lineEnd, text, reason } of openingMatterSkipped) {
        reportLines.push(`- Lines ${lineStart + 1}–${lineEnd + 1} (${reason}): \`${text.slice(0, 60)}...\``);
      }
    }
    reportLines.push('');

    if (write) {
      // Backup
      const relPath = relative(articlesDir, artFile);
      const backupPath = join(__dirname, '..', 'backup', ts, 'articles', relPath);
      mkdirSync(dirname(backupPath), { recursive: true });
      copyFileSync(artFile, backupPath);
      writeFileSync(artFile, newContent, 'utf8');
    }
  }

  // ── Skipped sections ────────────────────────────────────────────────────
  if (globalDroppedByDensity.length > 0) {
    reportLines.push('## Dropped by Density Cap');
    for (const { id, dropped } of globalDroppedByDensity) {
      reportLines.push(`### Article ${id}`);
      for (const d of dropped) {
        reportLines.push(`- ${d.canonical} (\`${d.matched}\`)`);
      }
    }
    reportLines.push('');
  }

  if (globalErrors.length > 0) {
    reportLines.push('## Errors');
    for (const { id, reason } of globalErrors) {
      reportLines.push(`- Article **${id}**: ${reason}`);
    }
    reportLines.push('');
  }

  reportLines.push('---');
  reportLines.push(`**Summary:** ${totalScanned} articles scanned, ${totalChanged} changed, ${totalLinksAdded} links added.`);
  if (!write) reportLines.push('\n> **DRY RUN**: No files were changed. Run with --write to apply.');

  const reportText = reportLines.join('\n');
  const reportFile = writeReport(`autolink-${ts}.md`, reportText);

  console.log(reportText);
  console.log(`\nReport saved to: ${reportFile}`);
  console.log(`\n📊 Summary: ${totalScanned} scanned, ${totalChanged} changed, ${totalLinksAdded} links added.`);
  if (!write) console.log('\n⚠️  DRY RUN — pass --write to apply changes.');
}
