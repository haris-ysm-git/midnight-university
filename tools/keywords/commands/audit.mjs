/**
 * commands/audit.mjs
 * Read-only health report on notes and articles.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadNotes, resolveTarget } from '../lib/notes.mjs';
import { parseLinks } from '../lib/links.mjs';
import { writeReport } from '../lib/report.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THAI_RE = /[\u0E00-\u0E7F]/;

function isThaiFn(s) { return THAI_RE.test(s); }

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

/** Extract article ID from filename (leading digits) */
function articleId(filepath) {
  const name = basename(filepath, '.md');
  const m = name.match(/^(\d+)/);
  return m ? m[1] : name;
}

export default async function audit(config, flags) {
  const { notesDir, articlesDir } = config;

  // ── Load notes ──────────────────────────────────────────────────────────
  const { notes, termIndex, ambiguous, stopSet } = loadNotes(notesDir, config);

  // Load rename map
  let renameMap = {};
  const renameMapPath = join(__dirname, '..', 'keyword-rename-map.json');
  try {
    if (existsSync(renameMapPath)) {
      renameMap = JSON.parse(readFileSync(renameMapPath, 'utf8'));
    }
  } catch { renameMap = {}; }

  // ── Note stats ──────────────────────────────────────────────────────────
  const noteFiles = readdirSync(notesDir).filter(f => extname(f) === '.md');
  const thaiNamedNotes = noteFiles.filter(f => isThaiFn(basename(f, '.md')));
  const emptyNotes = noteFiles.filter(f => {
    try { return readFileSync(join(notesDir, f), 'utf8').trim() === ''; }
    catch { return true; }
  });

  // Case-insensitive duplicate note names
  const nameLower = new Map();
  const duplicateNames = [];
  for (const name of notes.keys()) {
    const lower = name.toLowerCase();
    if (nameLower.has(lower)) duplicateNames.push([nameLower.get(lower), name]);
    else nameLower.set(lower, name);
  }

  // ── Collect article links ──────────────────────────────────────────────
  const articleFiles = collectMd(articlesDir);

  // Per note: which articles link to it
  const linkedByNote = new Map(); // canonical -> Set<articleId>
  // Missing targets
  const missingTargets = new Map(); // target -> { articles: Set<id>, labels: Set<string> }
  // Alias links
  const aliasLinks = []; // { target, canonical, articleId }
  // Case mismatches
  const caseMismatches = []; // { target, canonical, articleId }
  // Old Thai names
  const oldThaiLinks = []; // { target, newName, articleId }

  const renameKeys = new Set(Object.keys(renameMap));

  for (const artFile of articleFiles) {
    const id = articleId(artFile);
    let content;
    try { content = readFileSync(artFile, 'utf8'); } catch { continue; }

    const links = parseLinks(content);
    for (const link of links) {
      const { target, label } = link;
      if (target.includes('#') || target.includes('^')) continue;

      // Old Thai names
      if (renameKeys.has(target)) {
        oldThaiLinks.push({ target, newName: renameMap[target], articleId: id });
        continue;
      }

      const resolved = resolveTarget(target, notes);
      if (!resolved) {
        // Missing target
        if (!missingTargets.has(target)) missingTargets.set(target, { articles: new Set(), labels: new Set() });
        const mt = missingTargets.get(target);
        mt.articles.add(id);
        if (label) mt.labels.add(label);
      } else {
        const { canonical, matchType } = resolved;
        // Track linked-by
        if (!linkedByNote.has(canonical)) linkedByNote.set(canonical, new Set());
        linkedByNote.get(canonical).add(id);

        if (matchType === 'alias') {
          aliasLinks.push({ target, canonical, articleId: id });
        } else if (matchType === 'case-insensitive') {
          caseMismatches.push({ target, canonical, articleId: id });
        }
      }
    }
  }

  // Notes not linked by any article
  const unlinkedNotes = [...notes.keys()].filter(c => !linkedByNote.has(c));

  // ── Build report ───────────────────────────────────────────────────────
  const lines = [];
  lines.push('# Keyword Audit Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Counts');
  lines.push(`- Notes total: **${noteFiles.length}**`);
  lines.push(`- Notes with Thai filenames: **${thaiNamedNotes.length}** ${thaiNamedNotes.length === 0 ? '✅' : '❌ (must be 0 — unzip 03_tag_fixed.zip first)'}`);
  if (thaiNamedNotes.length > 0) {
    for (const f of thaiNamedNotes) lines.push(`  - ${f}`);
  }
  lines.push(`- Empty notes: **${emptyNotes.length}**`);
  lines.push(`- Articles: **${articleFiles.length}**`);
  lines.push('');

  lines.push('## Ambiguous Terms');
  lines.push('*(same alias on more than one note — never auto-linked)*');
  if (ambiguous.size === 0) {
    lines.push('None.');
  } else {
    for (const term of [...ambiguous].sort()) {
      lines.push(`- \`${term}\``);
    }
  }
  lines.push('');

  lines.push('## Case-Insensitive Duplicate Note Names');
  if (duplicateNames.length === 0) {
    lines.push('None.');
  } else {
    for (const [a, b] of duplicateNames) {
      lines.push(`- \`${a}\` / \`${b}\``);
    }
  }
  lines.push('');

  lines.push('## Missing Targets');
  lines.push('*[[targets]] used in articles with no matching note file.*');
  if (missingTargets.size === 0) {
    lines.push('None.');
  } else {
    const sorted = [...missingTargets.entries()].sort((a, b) => b[1].articles.size - a[1].articles.size);
    for (const [target, { articles, labels }] of sorted) {
      const exampleIds = [...articles].slice(0, 3).join(', ');
      lines.push(`- **${target}** — ${articles.size} article(s) [${exampleIds}]`);
      if (labels.size > 0) lines.push(`  Labels used: ${[...labels].map(l => `\`${l}\``).join(', ')}`);
    }
  }
  lines.push('');

  lines.push('## Alias Links');
  lines.push('*Links whose target is an alias, not the canonical filename.*');
  if (aliasLinks.length === 0) {
    lines.push('None.');
  } else {
    const grouped = new Map();
    for (const { target, canonical, articleId } of aliasLinks) {
      const key = `${target} → ${canonical}`;
      if (!grouped.has(key)) grouped.set(key, { target, canonical, articles: new Set() });
      grouped.get(key).articles.add(articleId);
    }
    for (const [key, { target, canonical, articles }] of grouped) {
      lines.push(`- \`[[${target}]]\` → suggest \`[[${canonical}|${target}]]\` (${articles.size} article(s))`);
    }
  }
  lines.push('');

  lines.push('## Case Mismatches');
  lines.push('*Links where target differs from filename only by case.*');
  if (caseMismatches.length === 0) {
    lines.push('None.');
  } else {
    for (const { target, canonical, articleId } of caseMismatches) {
      lines.push(`- \`[[${target}]]\` → \`[[${canonical}]]\` in article ${articleId}`);
    }
  }
  lines.push('');

  lines.push('## Links to Old Thai Names (fixable by rename-links)');
  if (oldThaiLinks.length === 0) {
    lines.push('None.');
  } else {
    const grouped = new Map();
    for (const { target, newName, articleId } of oldThaiLinks) {
      if (!grouped.has(target)) grouped.set(target, { newName, articles: new Set() });
      grouped.get(target).articles.add(articleId);
    }
    for (const [target, { newName, articles }] of grouped) {
      lines.push(`- \`[[${target}]]\` → \`[[${newName}]]\` (${articles.size} article(s))`);
    }
  }
  lines.push('');

  lines.push('## Unlinked Notes');
  lines.push('*(informational: notes no article currently links to)*');
  if (unlinkedNotes.length === 0) {
    lines.push('None.');
  } else {
    for (const c of unlinkedNotes.sort()) lines.push(`- ${c}`);
  }
  lines.push('');

  const reportText = lines.join('\n');
  const reportFile = writeReport('audit.md', reportText);

  console.log(reportText);
  console.log(`\nReport saved to: ${reportFile}`);
}
