/**
 * commands/stubs.mjs
 * Create keyword notes for [[targets]] that exist in articles but have no note file.
 * Dry run unless --write.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, extname, basename, relative } from 'path';
import { fileURLToPath } from 'url';
import { loadNotes, resolveTarget } from '../lib/notes.mjs';
import { parseLinks } from '../lib/links.mjs';
import { writeReport, timestamp } from '../lib/report.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const THAI_RE = /[\u0E00-\u0E7F]/;
const LATIN_RE = /[A-Za-z]/;

function containsThai(s) { return THAI_RE.test(s); }
function containsLatin(s) { return LATIN_RE.test(s); }

/** Sanitise a filename: remove \/|:*?"<> */
function sanitiseFilename(s) {
  return s.replace(/[\\/:*?"<>|]/g, '');
}

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

export default async function stubs(config, flags) {
  const { notesDir, articlesDir } = config;
  const { write } = flags;

  const { notes } = loadNotes(notesDir, config);

  // Load keyword-translations.json if it exists
  let translations = {};
  const translationsPath = join(__dirname, '..', 'keyword-translations.json');
  try {
    if (existsSync(translationsPath)) {
      translations = JSON.parse(readFileSync(translationsPath, 'utf8'));
    }
  } catch { translations = {}; }

  // Collect all missing targets from articles
  const articleFiles = collectMd(articlesDir);
  // target -> { labels: Set<string>, evidence: string[] }
  const missingTargets = new Map();

  for (const artFile of articleFiles) {
    let content;
    try { content = readFileSync(artFile, 'utf8'); } catch { continue; }
    const links = parseLinks(content);
    for (const { target, label } of links) {
      if (target.includes('#') || target.includes('^')) continue;
      const resolved = resolveTarget(target, notes);
      if (!resolved) {
        if (!missingTargets.has(target)) {
          missingTargets.set(target, { labels: new Set(), evidence: [] });
        }
        const mt = missingTargets.get(target);
        if (label && label.toLowerCase() !== target.toLowerCase() && label.length <= 60) {
          mt.labels.add(label);
        }
        // Find evidence context (80 chars around the target)
        if (mt.evidence.length < 2) {
          const idx = content.indexOf(`[[${target}`);
          if (idx !== -1) {
            const start = Math.max(0, idx - 20);
            const end = Math.min(content.length, idx + target.length + 40);
            mt.evidence.push(content.slice(start, end).replace(/\r?\n/g, ' ').slice(0, 80));
          }
        }
      }
    }
  }

  const ts = timestamp();
  const toCreate = [];        // { filename, content, target }
  const translationsNeeded = []; // Thai targets
  const alreadyExist = [];

  for (const [target, { labels, evidence }] of missingTargets) {
    const noteFile = join(notesDir, sanitiseFilename(target) + '.md');

    if (existsSync(noteFile)) {
      alreadyExist.push(target);
      continue;
    }

    if (containsThai(target) && !containsLatin(target)) {
      // Thai-only target: check translations
      if (translations[target]) {
        const englishName = translations[target];
        const engFile = join(notesDir, sanitiseFilename(englishName) + '.md');
        if (existsSync(engFile)) {
          alreadyExist.push(target);
          continue;
        }
        // Build aliases: Thai target + distinct labels
        const aliasSet = new Set([target, ...labels]);
        const aliasLines = [...aliasSet].map(a => `  - ${a}`).join('\n');
        const noteContent = `---\naliases:\n${aliasLines}\n---\n`;
        toCreate.push({ filename: engFile, content: noteContent, target, englishName });
      } else {
        // Find suggestion from parentheses context
        let suggestion = '';
        for (const ev of evidence) {
          const parenMatch = ev.match(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(([A-Za-z][^)]+)\\)'));
          if (parenMatch) { suggestion = parenMatch[1].trim(); break; }
        }
        translationsNeeded.push({
          thai: target,
          english: '',
          suggestion,
          evidence: evidence[0] || '',
          needs_review: true,
        });
      }
    } else if (containsLatin(target)) {
      // English/Latin target
      const safeFilename = sanitiseFilename(target);
      const noteFile2 = join(notesDir, safeFilename + '.md');
      if (existsSync(noteFile2)) {
        alreadyExist.push(target);
        continue;
      }
      let noteContent;
      if (labels.size > 0) {
        const aliasLines = [...labels].map(a => `  - ${a}`).join('\n');
        noteContent = `---\naliases:\n${aliasLines}\n---\n`;
      } else {
        noteContent = `---\naliases:\n---\n`;
      }
      toCreate.push({ filename: noteFile2, content: noteContent, target });
    }
  }

  // Write translations-needed.json
  if (translationsNeeded.length > 0) {
    writeReport('translations-needed.json', JSON.stringify(translationsNeeded, null, 2));
    console.log(`\n📄 Thai targets needing translation: ${translationsNeeded.length}`);
    console.log('   See: tools/keywords/reports/translations-needed.json');
    console.log('   Fill the "english" field and copy to tools/keywords/keyword-translations.json');
  }

  // Build report
  const reportLines = [];
  reportLines.push('# stubs Report');
  reportLines.push(`Mode: **${write ? 'WRITE' : 'DRY RUN'}**`);
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push('');
  reportLines.push('## Summary');
  reportLines.push(`- English stubs to create: **${toCreate.length}**`);
  reportLines.push(`- Thai targets needing translation: **${translationsNeeded.length}**`);
  reportLines.push(`- Already existing (skipped): **${alreadyExist.length}**`);
  reportLines.push('');

  reportLines.push('## English Stubs');
  if (toCreate.length === 0) {
    reportLines.push('None.');
  } else {
    for (const { filename, target, englishName } of toCreate) {
      reportLines.push(`- **${target}** → \`${basename(filename)}\`${englishName ? ` (from Thai: ${target})` : ''}`);
    }
  }
  reportLines.push('');

  reportLines.push('## Thai Targets (translation needed)');
  if (translationsNeeded.length === 0) {
    reportLines.push('None.');
  } else {
    for (const { thai, suggestion, evidence } of translationsNeeded) {
      reportLines.push(`- **${thai}**${suggestion ? ` (suggestion: "${suggestion}")` : ''}`);
      if (evidence) reportLines.push(`  > ${evidence}`);
    }
  }
  reportLines.push('');

  if (!write) {
    reportLines.push('> **DRY RUN**: No files were created. Run with --write to apply.');
  }

  const reportText = reportLines.join('\n');
  const reportFile = writeReport(`stubs-${ts}.md`, reportText);

  if (write) {
    for (const { filename, content } of toCreate) {
      mkdirSync(dirname(filename), { recursive: true });
      writeFileSync(filename, content, 'utf8');
      console.log(`Created: ${filename}`);
    }
  }

  console.log(reportText);
  console.log(`\nReport saved to: ${reportFile}`);
  if (!write) console.log('\n⚠️  DRY RUN — pass --write to apply changes.');
}
