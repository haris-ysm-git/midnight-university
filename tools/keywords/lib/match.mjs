/**
 * lib/match.mjs
 * Find keyword matches in text, Thai-safe.
 */

import { isThai } from './notes.mjs';

const LATIN_ACCENTED = /[\u00C0-\u024F]/;

/** True if char is a Latin word character (letter, digit) */
function isLatinWordChar(ch) {
  if (!ch) return false;
  const code = ch.codePointAt(0);
  // A-Z, a-z, 0-9
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 48 && code <= 57)) return true;
  // Latin accented
  if (code >= 0x00C0 && code <= 0x024F) return true;
  return false;
}

/**
 * Compute Thai word boundary offsets for text using Intl.Segmenter.
 * Returns a Set of offsets where Thai words start or end.
 */
function getThaiWordBoundaries(text) {
  const seg = new Intl.Segmenter('th', { granularity: 'word' });
  const boundaries = new Set();
  for (const { index, segment } of seg.segment(text)) {
    boundaries.add(index);
    boundaries.add(index + segment.length);
  }
  return boundaries;
}

/**
 * Find all matches of a term in a paragraph of text.
 *
 * Returns array of { start, end, matched } (character offsets).
 */
export function findTermMatches(text, term, termLower) {
  const matches = [];
  const termContainsThai = isThai(term);

  if (termContainsThai) {
    // Thai boundary matching
    const boundaries = getThaiWordBoundaries(text);
    const textLower = text.toLowerCase();
    const tLower = termLower || term.toLowerCase();
    let idx = 0;
    while (idx < text.length) {
      const pos = textLower.indexOf(tLower, idx);
      if (pos === -1) break;
      const end = pos + term.length;
      if (boundaries.has(pos) && boundaries.has(end)) {
        matches.push({ start: pos, end, matched: text.slice(pos, end) });
        idx = end;
      } else {
        idx = pos + 1;
      }
    }
  } else {
    // Latin term matching
    const isShortOrAllCaps = term.length <= 4 || term === term.toUpperCase();
    const tLower = termLower || term.toLowerCase();

    let idx = 0;
    while (idx < text.length) {
      let pos;
      if (isShortOrAllCaps) {
        // Case-sensitive
        pos = text.indexOf(term, idx);
      } else {
        pos = text.toLowerCase().indexOf(tLower, idx);
      }
      if (pos === -1) break;
      const end = pos + term.length;

      // Check word boundaries
      const before = text[pos - 1];
      const after = text[end];
      if (!isLatinWordChar(before) && !isLatinWordChar(after)) {
        matches.push({ start: pos, end, matched: text.slice(pos, end) });
        idx = end;
      } else {
        idx = pos + 1;
      }
    }
  }

  return matches;
}

/**
 * Given a set of matches from multiple terms, resolve overlaps.
 * Sort by length DESC, then keep non-overlapping (greedy).
 *
 * Returns array of { start, end, matched, canonical, term }
 */
export function resolveOverlaps(allMatches) {
  // Sort by length desc, then by position asc
  allMatches.sort((a, b) => {
    const lenDiff = (b.end - b.start) - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    return a.start - b.start;
  });

  const kept = [];
  for (const match of allMatches) {
    // Check overlap with any kept match
    let overlaps = false;
    for (const k of kept) {
      if (match.start < k.end && match.end > k.start) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) kept.push(match);
  }

  // Sort by position
  kept.sort((a, b) => a.start - b.start);
  return kept;
}

/**
 * Find all keyword matches in a linkable paragraph.
 *
 * termEntries: array of { canonical, term, termLower }
 * Returns array of { start, end, matched, canonical, term }
 */
export function findAllMatches(paragraphText, termEntries) {
  const allMatches = [];
  for (const { canonical, term, termLower } of termEntries) {
    const hits = findTermMatches(paragraphText, term, termLower);
    for (const h of hits) {
      allMatches.push({ ...h, canonical, term });
    }
  }
  return resolveOverlaps(allMatches);
}
