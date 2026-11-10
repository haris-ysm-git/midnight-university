/**
 * lib/notes.mjs
 * Load keyword notes, parse YAML aliases, build a term index.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';

// Thai Unicode block: U+0E00–U+0E7F
const THAI_RE = /[\u0E00-\u0E7F]/;
const THAI_CHAR_RE = /[\u0E00-\u0E7F]/g;

/** Count Thai characters (not spaces) */
function thaiCharCount(s) {
  return (s.match(THAI_CHAR_RE) || []).length;
}

/** True if string contains any Thai character */
export function isThai(s) {
  return THAI_RE.test(s);
}

/** True if string contains any Latin letter */
export function isLatin(s) {
  return /[A-Za-z\u00C0-\u024F]/.test(s);
}

/**
 * Parse a note's YAML frontmatter for aliases.
 * Returns array of alias strings.
 */
function parseAliases(content) {
  const aliases = [];
  // Find the frontmatter block
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return aliases;
  const yaml = fm[1];
  // Find the aliases: block
  const aliasBlock = yaml.match(/^aliases:\s*\r?\n((?:[ \t]+-[^\r\n]*(?:\r?\n|$))*)/m);
  if (!aliasBlock) return aliases;
  const lines = aliasBlock[1].split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^[ \t]+-\s+(.+)/);
    if (m) {
      const alias = m[1].trim();
      if (alias) aliases.push(alias);
    }
  }
  return aliases;
}

/**
 * Load all notes from notesDir.
 * Returns { notes, termIndex, ambiguous, stopTerms }
 *
 * notes: Map<canonicalName, { canonical, aliases, file }>
 * termIndex: Map<termLower, canonicalName>  (only unambiguous terms)
 * ambiguous: Set<termLower>
 * stopTerms: Set<canonicalNameLower>
 */
export function loadNotes(notesDir, config) {
  const { stoplist = [], minThaiLength = 3 } = config;
  const stopSet = new Set(stoplist.map(s => s.toLowerCase()));

  const notes = new Map();     // canonical -> { canonical, aliases, file }
  const termIndex = new Map(); // termLower -> canonical
  const ambiguous = new Set(); // termLower -> conflict

  let files;
  try {
    files = readdirSync(notesDir).filter(f => extname(f) === '.md');
  } catch (e) {
    throw new Error(`Cannot read notesDir: ${notesDir} — ${e.message}`);
  }

  // First pass: collect note data
  for (const file of files) {
    const canonical = basename(file, '.md');
    const fullPath = join(notesDir, file);
    let content = '';
    try {
      content = readFileSync(fullPath, 'utf8');
    } catch {
      // empty / unreadable - skip
    }
    const aliases = parseAliases(content);
    // Terms = canonical + aliases, deduplicated case-insensitively
    const seenLower = new Set();
    const terms = [];
    for (const t of [canonical, ...aliases]) {
      const trimmed = t.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        terms.push(trimmed);
      }
    }
    notes.set(canonical, { canonical, aliases, terms, file, content });
  }

  // Second pass: build term index, detect ambiguity
  for (const [canonical, note] of notes) {
    const isStoplisted = stopSet.has(canonical.toLowerCase());

    for (const term of note.terms) {
      const lower = term.toLowerCase();

      // Skip stoplist: canonical or its Latin aliases
      // Thai aliases of a stoplisted note also skip by default (--include-generic enables them)
      if (isStoplisted) {
        continue; // skip ALL terms of stoplisted note (both Latin and Thai) by default
        // The --include-generic flag is handled in autolink.mjs by re-adding Thai aliases
      }

      // Length filters
      if (isThai(term) && thaiCharCount(term) < minThaiLength) continue;
      if (!isThai(term) && isLatin(term) && term.length < 3) continue;

      if (termIndex.has(lower)) {
        const existing = termIndex.get(lower);
        if (existing !== canonical) {
          // Conflict
          ambiguous.add(lower);
          termIndex.delete(lower);
        }
        // If existing === canonical, it's a duplicate alias - fine
      } else if (!ambiguous.has(lower)) {
        termIndex.set(lower, canonical);
      }
    }
  }

  return { notes, termIndex, ambiguous, stopSet };
}

/**
 * Find the canonical note name for a link target.
 * Returns { canonical, matchType } or null.
 * matchType: 'exact' | 'case-insensitive' | 'alias' | 'alias-ambiguous' | null
 */
export function resolveTarget(target, notes) {
  if (!target) return null;
  // 1. Exact filename match
  if (notes.has(target)) return { canonical: target, matchType: 'exact' };
  // 2. Case-insensitive filename match
  const lower = target.toLowerCase();
  for (const [canonical] of notes) {
    if (canonical.toLowerCase() === lower) {
      return { canonical, matchType: 'case-insensitive' };
    }
  }
  // 3. Alias match
  const matches = [];
  for (const [canonical, note] of notes) {
    for (const alias of note.aliases) {
      if (alias.toLowerCase() === lower) {
        matches.push(canonical);
        break;
      }
    }
  }
  if (matches.length === 1) return { canonical: matches[0], matchType: 'alias' };
  if (matches.length > 1) return { canonical: null, matchType: 'alias-ambiguous' };
  return null;
}
