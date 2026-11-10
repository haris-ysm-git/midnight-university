/**
 * lib/zones.mjs
 * Decide which lines (and regions) of an article may receive auto-links.
 *
 * Returns a ZoneMap for an article: per-line decisions.
 */

// Provenance label prefixes (Thai and English)
const PROVENANCE_LABELS = [
  'ผู้แปล', 'แปลโดย', 'เรียบเรียง', 'ต้นฉบับ', 'ที่มา', 'แหล่งที่มา',
  'เขียนโดย', 'ผู้เขียน', 'บรรณาธิการ', 'หมายเหตุ',
  'Original', 'Translated', 'Source',
];

// Back-matter section markers
const BACKMATTER_TH = ['บรรณานุกรม', 'เอกสารอ้างอิง', 'อ้างอิง', 'หนังสืออ่านเพิ่มเติม'];
const BACKMATTER_EN = ['References', 'Bibliography', 'Further reading'];

/** Check if a line is a back-matter heading */
function isBackmatterHeading(line) {
  const stripped = line.replace(/^#+\s*/, '');
  for (const kw of [...BACKMATTER_TH, ...BACKMATTER_EN]) {
    if (stripped.includes(kw)) return true;
  }
  return false;
}

/** Check if a line is a provenance paragraph opener */
function isProvenanceLine(line) {
  for (const label of PROVENANCE_LABELS) {
    if (line.startsWith(label)) return true;
    // Also match with colon: "ผู้แปล:"
    if (line.startsWith(label + ':') || line.startsWith(label + ' ')) return true;
  }
  return false;
}

/**
 * Analyze an article's lines and return zone info.
 *
 * Returns:
 *   {
 *     linkableLines: Set<number>,  (0-indexed lines that may receive links)
 *     openingMatterSkipped: Array<{ lineStart, lineEnd, text, reason }>,
 *   }
 */
export function computeZones(lines) {
  const linkableLines = new Set();
  const openingMatterSkipped = [];

  let inFrontmatter = false;
  let frontmatterDone = false;
  let frontmatterEnd = -1;

  // Detect frontmatter
  if (lines[0] && lines[0].trim() === '---') {
    inFrontmatter = true;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        frontmatterEnd = i;
        frontmatterDone = true;
        break;
      }
    }
  }

  let inFence = false;
  let fenceMarker = '';
  let reachedH1 = false;
  let h1Line = -1;
  let openingMatterSepLine = -1; // the --- after H1
  let inOpeningMatter = false;
  let reachedBackmatter = false;

  // Collect paragraphs for opening matter analysis
  // A paragraph is a contiguous block of non-blank, non-special lines
  let currentParagraphStart = -1;
  let currentParagraphLines = [];

  function flushParagraph(endLine) {
    if (currentParagraphLines.length === 0) return;
    const text = currentParagraphLines.join('\n');
    const charLen = text.length;
    const reason_parts = [];

    if (charLen < 160) {
      reason_parts.push(`too short (${charLen} < 160 chars)`);
    }
    if (isProvenanceLine(currentParagraphLines[0])) {
      reason_parts.push('provenance line');
    }

    if (reason_parts.length > 0) {
      openingMatterSkipped.push({
        lineStart: currentParagraphStart,
        lineEnd: endLine - 1,
        text: text.slice(0, 120),
        reason: reason_parts.join('; '),
      });
    } else {
      // These lines are linkable
      for (let l = currentParagraphStart; l < endLine; l++) {
        linkableLines.add(l);
      }
    }
    currentParagraphLines = [];
    currentParagraphStart = -1;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip frontmatter
    if (!frontmatterDone && inFrontmatter) {
      if (i <= frontmatterEnd) continue;
    }
    if (i <= frontmatterEnd) continue;

    // Detect H1
    if (!reachedH1 && /^#\s/.test(line)) {
      reachedH1 = true;
      h1Line = i;
      inOpeningMatter = true;
      continue; // H1 itself is not linkable
    }

    // Detect fenced code blocks
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1];
        if (inOpeningMatter) flushParagraph(i);
      } else if (line.startsWith(fenceMarker)) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    // Check for back-matter
    if (!reachedBackmatter) {
      if (/^#/.test(line) && isBackmatterHeading(line)) {
        reachedBackmatter = true;
        if (inOpeningMatter) flushParagraph(i);
        continue;
      }
      // '> เชิงอรรถ' blockquote
      if (/^>\s*เชิงอรรถ/.test(line)) {
        reachedBackmatter = true;
        if (inOpeningMatter) flushParagraph(i);
        continue;
      }
    }

    if (reachedBackmatter) continue;

    // Check for opening matter separator (--- after H1)
    if (inOpeningMatter && line.trim() === '---') {
      openingMatterSepLine = i;
      inOpeningMatter = false;
      flushParagraph(i);
      continue;
    }

    // Lines that are NEVER linkable (regardless of zone):
    // - headings
    if (/^#{1,6}\s/.test(line)) {
      if (inOpeningMatter) flushParagraph(i);
      continue;
    }
    // - blockquotes
    if (/^>/.test(line)) {
      if (inOpeningMatter) flushParagraph(i);
      continue;
    }
    // - horizontal rules
    if (/^---+$|^\*\*\*+$|^___+$/.test(line.trim())) {
      if (inOpeningMatter) flushParagraph(i);
      continue;
    }
    // - table lines
    if (/^\|/.test(line)) {
      if (inOpeningMatter) flushParagraph(i);
      continue;
    }
    // - image embeds
    if (/^!\[/.test(line)) {
      if (inOpeningMatter) flushParagraph(i);
      continue;
    }

    if (inOpeningMatter) {
      // Collect into paragraph blocks for analysis
      if (line.trim() === '') {
        // Blank line = paragraph break
        flushParagraph(i);
      } else {
        if (currentParagraphStart === -1) currentParagraphStart = i;
        currentParagraphLines.push(line);
      }
      continue;
    }

    // Body (after opening matter separator)
    if (!inOpeningMatter) {
      if (line.trim() !== '') {
        linkableLines.add(i);
      }
    }
  }

  // Flush any remaining opening matter paragraph
  if (inOpeningMatter && currentParagraphLines.length > 0) {
    flushParagraph(lines.length);
  }

  return { linkableLines, openingMatterSkipped };
}
