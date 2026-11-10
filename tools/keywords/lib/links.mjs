/**
 * lib/links.mjs
 * Parse and rewrite [[ ]] wiki-links in markdown text.
 */

/**
 * Parse all [[...]] links from a text, skipping those inside:
 *   - fenced code blocks
 *   - inline code (` ... `)
 *   - frontmatter (--- block at top)
 *
 * Returns array of { target, label, raw, index, end }
 *   target: the link target (before |)
 *   label:  the display text (after |), or null
 *   raw:    the full [[...]] string
 *   index:  start index in text
 *   end:    end index (exclusive)
 */
export function parseLinks(text) {
  const links = [];
  // Track fenced code blocks
  let inFence = false;
  let fenceRanges = [];
  let inFM = false; // frontmatter
  let fmEnd = -1;

  // Find frontmatter
  if (text.startsWith('---')) {
    const fmMatch = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    if (fmMatch) fmEnd = fmMatch[0].length;
  }

  // Find fenced code block ranges
  const fenceRe = /^(`{3,}|~{3,})[^\r\n]*$/gm;
  let fMatch;
  let fenceStart = -1;
  let fenceChar = '';
  while ((fMatch = fenceRe.exec(text)) !== null) {
    const marker = fMatch[1];
    if (fenceStart === -1) {
      fenceStart = fMatch.index;
      fenceChar = marker[0];
    } else if (marker[0] === fenceChar && marker.length >= fenceChar.length) {
      const fenceEnd = fMatch.index + fMatch[0].length;
      fenceRanges.push([fenceStart, fenceEnd]);
      fenceStart = -1;
    }
  }

  function inExcludedRange(idx) {
    if (idx < fmEnd) return true;
    for (const [s, e] of fenceRanges) {
      if (idx >= s && idx <= e) return true;
    }
    return false;
  }

  // Find inline code ranges
  let inlineCodeRanges = [];
  const inlineRe = /`[^`\r\n]+`/g;
  let iMatch;
  while ((iMatch = inlineRe.exec(text)) !== null) {
    if (!inExcludedRange(iMatch.index)) {
      inlineCodeRanges.push([iMatch.index, iMatch.index + iMatch[0].length]);
    }
  }

  function isExcluded(idx) {
    if (inExcludedRange(idx)) return true;
    for (const [s, e] of inlineCodeRanges) {
      if (idx >= s && idx <= e) return true;
    }
    return false;
  }

  // Find all [[...]] links
  const linkRe = /\[\[([^\[\]\r\n]+?)\]\]/g;
  let lMatch;
  while ((lMatch = linkRe.exec(text)) !== null) {
    if (isExcluded(lMatch.index)) continue;
    const inner = lMatch[1];
    const pipeIdx = inner.indexOf('|');
    let target, label;
    if (pipeIdx !== -1) {
      target = inner.slice(0, pipeIdx);
      label = inner.slice(pipeIdx + 1);
    } else {
      target = inner;
      label = null;
    }
    links.push({
      target: target.trim(),
      label: label !== null ? label.trim() : null,
      raw: lMatch[0],
      index: lMatch.index,
      end: lMatch.index + lMatch[0].length,
    });
  }

  return links;
}

/**
 * Rewrite [[target]] or [[target|label]] links in text according to a mapping function.
 * mapper(target, label) -> { newTarget, newLabel } | null (null = no change)
 *
 * Skips links inside frontmatter, fenced code, inline code.
 * Skips links containing # or ^.
 */
export function rewriteLinks(text, mapper) {
  const links = parseLinks(text);
  if (links.length === 0) return text;

  // Process in reverse order to preserve indices
  let result = text;
  let offset = 0;
  const sorted = [...links].sort((a, b) => a.index - b.index);

  let out = '';
  let pos = 0;
  for (const link of sorted) {
    // Skip links with anchors
    if (link.target.includes('#') || link.target.includes('^')) continue;

    const mapped = mapper(link.target, link.label);
    if (!mapped) continue;

    const { newTarget, newLabel } = mapped;
    // Build new link text
    let newRaw;
    if (newLabel === null || newLabel === newTarget) {
      newRaw = `[[${newTarget}]]`;
    } else {
      newRaw = `[[${newTarget}|${newLabel}]]`;
    }

    out += result.slice(pos, link.index);
    out += newRaw;
    pos = link.end;
  }
  out += result.slice(pos);
  return out;
}

/**
 * Strip all [[target|label]] -> label and [[target]] -> target from text.
 * Used for idempotency / verification checks.
 */
export function stripLinks(text) {
  return text.replace(/\[\[([^\[\]\r\n]+?)\]\]/g, (_, inner) => {
    const pipeIdx = inner.indexOf('|');
    if (pipeIdx !== -1) return inner.slice(pipeIdx + 1).trim();
    return inner.trim();
  });
}
