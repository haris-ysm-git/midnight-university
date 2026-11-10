/**
 * commands/rename-links.mjs
 * Rewrite article links after notes were renamed or when links point to aliases/wrong case.
 * Dry run unless --write.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, extname, basename, relative } from 'path';
import { fileURLToPath } from 'url';
import { loadNotes, resolveTarget } from '../lib/notes.mjs';
import { rewriteLinks } from '../lib/links.mjs';
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

/** Extract article ID from filename */
function articleId(filepath) {
  const name = basename(filepath, '.md');
  const m = name.match(/^(\d+)/);
  return m ? m[1] : name;
}

/** Detect line ending of text */
function detectLineEnding(text) {
  if (text.includes('\r\n')) return '\r\n';
  return '\n';
}

export default async function renameLinks(config, flags) {
  const { notesDir, articlesDir } = config;
  const { write } = flags;

  // Load rename map
  let renameMap = {};
  const renameMapPath = join(__dirname, '..', 'keyword-rename-map.json');
  try {
    if (existsSync(renameMapPath)) {
      renameMap = JSON.parse(readFileSync(renameMapPath, 'utf8'));
    }
  } catch { renameMap = {}; }

  // Load notes
  const { notes } = loadNotes(notesDir, config);

  const ts = timestamp();
  const backupBase = join(__dirname, '..', 'backup', ts);

  const changes = [];
  const skipped = [];

  /**
   * Process a single file: apply rename rules to all [[...]] links.
   * Returns { changed, newContent, linkChanges }
   */
  function processFile(content, fileLabel) {
    const linkChanges = [];

    function mapper(target, label) {
      // Skip anchors
      if (target.includes('#') || target.includes('^')) return null;

      let newTarget = null;

      // Rule 1: rename map
      if (renameMap[target] !== undefined) {
        newTarget = renameMap[target];
      } else {
        // Rule 2: alias of exactly one note
        const resolved = resolveTarget(target, notes);
        if (resolved && resolved.matchType === 'alias') {
          newTarget = resolved.canonical;
        } else if (resolved && resolved.matchType === 'case-insensitive') {
          // Rule 3: case mismatch
          newTarget = resolved.canonical;
        }
      }

      if (!newTarget || newTarget === target) return null;

      // Build new label
      const displayText = label !== null ? label : target;
      const newLabel = newTarget === displayText ? null : displayText;

      linkChanges.push({ old: `[[${target}${label !== null ? '|' + label : ''}]]`, newTarget, newLabel });
      return { newTarget, newLabel };
    }

    const newContent = rewriteLinks(content, mapper);
    return { changed: newContent !== content, newContent, linkChanges };
  }

  // Process articles
  const articleFiles = collectMd(articlesDir);
  for (const artFile of articleFiles) {
    let content;
    try { content = readFileSync(artFile, 'utf8'); } catch { continue; }
    const { changed, newContent, linkChanges } = processFile(content, articleId(artFile));
    if (changed) {
      changes.push({ file: artFile, label: articleId(artFile), type: 'article', linkChanges });
      if (write) {
        // Backup
        const rel = relative(articlesDir, artFile);
        const backupPath = join(backupBase, 'articles', rel);
        mkdirSync(dirname(backupPath), { recursive: true });
        copyFileSync(artFile, backupPath);
        writeFileSync(artFile, newContent, 'utf8');
      }
    }
  }

  // Process note bodies (not frontmatter - only links in note body)
  const noteFiles = readdirSync(notesDir).filter(f => extname(f) === '.md');
  for (const nf of noteFiles) {
    const fp = join(notesDir, nf);
    let content;
    try { content = readFileSync(fp, 'utf8'); } catch { continue; }
    const { changed, newContent, linkChanges } = processFile(content, basename(nf, '.md'));
    if (changed) {
      changes.push({ file: fp, label: basename(nf, '.md'), type: 'note', linkChanges });
      if (write) {
        const backupPath = join(backupBase, 'notes', nf);
        mkdirSync(dirname(backupPath), { recursive: true });
        copyFileSync(fp, backupPath);
        writeFileSync(fp, newContent, 'utf8');
      }
    }
  }

  // ── Build report ───────────────────────────────────────────────────────
  const reportLines = [];
  reportLines.push('# rename-links Report');
  reportLines.push(`Mode: **${write ? 'WRITE' : 'DRY RUN'}**`);
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push('');
  reportLines.push(`## Summary`);
  reportLines.push(`- Files with changes: **${changes.length}**`);
  reportLines.push('');

  for (const { file, label, type, linkChanges } of changes) {
    reportLines.push(`### ${type === 'article' ? 'Article' : 'Note'} \`${label}\``);
    reportLines.push(`File: \`${file}\``);
    for (const lc of linkChanges) {
      const newRaw = lc.newLabel === null ? `[[${lc.newTarget}]]` : `[[${lc.newTarget}|${lc.newLabel}]]`;
      reportLines.push(`- ${lc.old} → ${newRaw}`);
    }
    reportLines.push('');
  }

  if (!write) {
    reportLines.push('> **DRY RUN**: No files were changed. Run with --write to apply.');
  } else {
    reportLines.push(`> Files backed up to: tools/keywords/backup/${ts}/`);
  }

  const reportText = reportLines.join('\n');
  const reportFile = writeReport(`rename-links-${ts}.md`, reportText);

  console.log(reportText);
  console.log(`\nReport saved to: ${reportFile}`);
  if (!write) console.log('\n⚠️  DRY RUN — pass --write to apply changes.');
}
