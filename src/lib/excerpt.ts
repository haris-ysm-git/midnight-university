/**
 * Excerpt Extraction & Text Cleaning Helper
 * Shared across Archive scroller, right panel, and Random page pool.
 */

export function cleanMarkdownText(str: string): string {
  // Remove backslash before [ ] ( ) * _ - #
  let res = str.replace(/\\([\[\]\(\)\*_\-#])/g, "$1");
  // Convert wikilinks: [[target|display]] -> display, [[target]] -> target
  res = res.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1");
  // Remove bold/italic markers
  res = res.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
  // Replace non-breaking spaces and normalize whitespace
  res = res.replace(/\u00A0/g, " ").replace(/[ \t]+/g, " ");
  return res.trim();
}

export function isProvenanceOrMetadata(text: string): boolean {
  if (text.startsWith("#") || text.startsWith(">") || text.startsWith("-") || /^\d+\)/.test(text)) {
    return true;
  }
  if (text.includes("http://") || text.includes("https://")) {
    return true;
  }
  // Common metadata markers
  if (
    /ผู้แปล|ต้นฉบับ|ที่มา|เชิงอรรถ|บรรณานุกรม|หมายเหตุ\s*:|แปลและเรียบเรียง|อาจารย์ประจำ|สำนักส่งเสริม|ถอดเทป/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

export interface ArticleSnippets {
  cardSnippet: string;
  detailSnippet: string;
}

/**
 * Extracts clean, non-H1, non-provenance body snippets for the card (first paragraph)
 * and the right detail panel (next paragraph or next sentences).
 */
export function getArticleSnippets(content: string, titleTh?: string): ArticleSnippets {
  // Split raw content into paragraphs
  const rawParagraphs = content.split(/\r?\n\r?\n+/);
  const candidates: string[] = [];

  for (const rawP of rawParagraphs) {
    const p = rawP.trim();
    if (!p) continue;
    if (isProvenanceOrMetadata(p)) continue;
    if (p.length < 80) continue;

    // Check if it's identical to or begins with title_th or H1
    if (titleTh && (p === titleTh || p.startsWith(titleTh))) continue;

    const cleaned = cleanMarkdownText(p);
    if (cleaned.length >= 80) {
      candidates.push(cleaned);
    }
  }

  const firstPara = candidates[0] || "";
  const secondPara = candidates[1] || "";

  // Card gets first body paragraph
  const cardSnippet = firstPara;

  // Right panel gets second paragraph if available and >= 100 chars,
  // or subsequent sentences of first paragraph, never repeating identical text.
  let detailSnippet = secondPara;
  if (!detailSnippet || detailSnippet === cardSnippet) {
    // If first paragraph is long enough, take the latter portion
    if (firstPara.length > 180) {
      const parts = firstPara.split(/(?<=[.!?\s\u0E2F])\s+/);
      if (parts.length > 2) {
        detailSnippet = parts.slice(2).join(" ");
      }
    }
  }

  return {
    cardSnippet: cardSnippet || cleanMarkdownText(content.slice(0, 200)),
    detailSnippet: detailSnippet || "Midnight University Research Archive",
  };
}
