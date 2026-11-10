import { buildReport } from "./build-report";

export interface ParsedZoneData {
  openingMatter: {
    h1Title: string;
    monoId: string;
    creditByline?: string;
    epigraph?: {
      quote: string;
      attribution?: string;
    };
    provenanceLines: string[];
    introduction: string[];
  };
  bodyMarkdown: string;
  backMatter: {
    footnotes: { number: number; text: string }[];
    bibliography: string[];
    furtherReading: string[];
    hasBackMatter: boolean;
  };
  tableOfContents: {
    depth: number;
    text: string;
    slug: string;
  }[];
  isFellBack: boolean;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseArticleZones(
  rawContent: string,
  articleId: string,
  fileName: string = "unknown.md"
): ParsedZoneData {
  const result: ParsedZoneData = {
    openingMatter: {
      h1Title: "",
      monoId: articleId,
      provenanceLines: [],
      introduction: [],
    },
    bodyMarkdown: "",
    backMatter: {
      footnotes: [],
      bibliography: [],
      furtherReading: [],
      hasBackMatter: false,
    },
    tableOfContents: [],
    isFellBack: false,
  };

  try {
    const lines = rawContent.split(/\r?\n/);
    let i = 0;

    // 1. Skip Frontmatter if present
    if (lines[0]?.trim() === "---") {
      i++;
      while (i < lines.length && lines[i].trim() !== "---") {
        i++;
      }
      i++; // skip closing ---
    }

    // 2. Find H1
    let h1LineIndex = -1;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].startsWith("# ")) {
        h1LineIndex = j;
        break;
      }
    }

    if (h1LineIndex !== -1) {
      const rawH1 = lines[h1LineIndex].replace(/^#\s+/, "").trim();
      
      // Split ID and credits from H1: e.g. "0187 ปรัชญา... (Jacques Derrida) (สมเกียรติ : แปล)"
      // Match leading ID if present
      const idMatch = rawH1.match(/^(\d{4}(?:-\d+)?)\s*(.*)$/);
      let cleanH1 = rawH1;
      if (idMatch) {
        result.openingMatter.monoId = idMatch[1];
        cleanH1 = idMatch[2];
      }

      // Check trailing parenthesized credits
      const creditMatch = cleanH1.match(/^(.*?)\s*(\([^)]+(?::|แปล|เรียบเรียง|บรรยาย|วิจัย)[^)]*\))$/);
      if (creditMatch) {
        result.openingMatter.h1Title = creditMatch[1].trim();
        result.openingMatter.creditByline = creditMatch[2].trim();
      } else {
        result.openingMatter.h1Title = cleanH1;
      }

      i = h1LineIndex + 1;
    }

    // 3. Collect Opening Matter & Find Body Start
    // Body start heuristics:
    // (a) Heading of depth 2, 3 or 4: /^##\s+/, /^###\s+/ or /^####\s+/
    // (b) Paragraph beginning with bold speaker: /^\*\*[^*]+\*\*\s*:/
    let bodyStartIndex = -1;
    for (let j = i; j < lines.length; j++) {
      const line = lines[j].trim();
      if (/^##\s+/.test(line) || /^###\s+/.test(line) || /^####\s+/.test(line)) {
        bodyStartIndex = j;
        break;
      }
      if (/^\*\*[^*]+\*\*\s*:/.test(line)) {
        bodyStartIndex = j;
        break;
      }
    }

    // If no explicit body start found, check for a thematic break '---' after H1
    if (bodyStartIndex === -1) {
      for (let j = i; j < lines.length; j++) {
        if (lines[j].trim() === "---") {
          bodyStartIndex = j + 1;
          break;
        }
      }
    }

    // Still not found: treat everything after epigraph as body
    if (bodyStartIndex === -1) {
      bodyStartIndex = i;
    }

    // Extract blocks between H1 and bodyStartIndex (Opening Matter)
    const openingLines = lines.slice(i, bodyStartIndex);
    const openingBlocks: string[] = [];
    let currentBlock: string[] = [];

    for (const line of openingLines) {
      if (line.trim() === "" || line.trim() === "---") {
        if (currentBlock.length > 0) {
          openingBlocks.push(currentBlock.join("\n").trim());
          currentBlock = [];
        }
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length > 0) {
      openingBlocks.push(currentBlock.join("\n").trim());
    }

    // Process Opening Blocks:
    // Check first or second block for Epigraph (blockquote)
    let epigraphBlockIndex = -1;
    for (let b = 0; b < Math.min(3, openingBlocks.length); b++) {
      if (openingBlocks[b].startsWith(">")) {
        epigraphBlockIndex = b;
        const epigraphRaw = openingBlocks[b].replace(/^>\s?/gm, "").trim();
        const attributionMatch = epigraphRaw.match(/^([\s\S]*?)\s*(\([^)]+\))$/);
        if (attributionMatch) {
          result.openingMatter.epigraph = {
            quote: attributionMatch[1].trim(),
            attribution: attributionMatch[2].trim(),
          };
        } else {
          result.openingMatter.epigraph = {
            quote: epigraphRaw,
          };
        }
        break;
      }
    }

    for (let b = 0; b < openingBlocks.length; b++) {
      if (b === epigraphBlockIndex) continue;
      const block = openingBlocks[b];
      // Short paragraphs (<= 140 chars) are provenance/credit lines
      if (block.length <= 140 && !block.startsWith("#")) {
        result.openingMatter.provenanceLines.push(block);
      } else {
        result.openingMatter.introduction.push(block);
      }
    }

    // 4. Extract Back Matter from bodyStartIndex onwards
    // Back matter starts at:
    // - blockquote with first line containing เชิงอรรถ
    // - heading matching บรรณานุกรม, เอกสารอ้างอิง, หนังสืออ่านเพิ่มเติม, Bibliography, References
    // - or thematic break before such sections
    const remainingLines = lines.slice(bodyStartIndex);
    let backMatterStartIndex = -1;

    for (let j = 0; j < remainingLines.length; j++) {
      const line = remainingLines[j].trim();
      if (/^(?:>|#+)?\s*(เชิงอรรถ|Footnotes|บรรณานุกรม|เอกสารอ้างอิง|หนังสืออ่านเพิ่มเติม|Bibliography|References)/i.test(line)) {
        backMatterStartIndex = j;
        break;
      }
      if (line === "---" && j < remainingLines.length - 1) {
        const nextLines = remainingLines.slice(j + 1, j + 5).join(" ");
        if (/เชิงอรรถ|บรรณานุกรม|เอกสารอ้างอิง|หนังสืออ่านเพิ่มเติม|Bibliography|References/i.test(nextLines)) {
          backMatterStartIndex = j;
          break;
        }
      }
    }

    let bodyLines: string[] = [];
    let backMatterLines: string[] = [];

    if (backMatterStartIndex !== -1) {
      bodyLines = remainingLines.slice(0, backMatterStartIndex);
      backMatterLines = remainingLines.slice(backMatterStartIndex);
    } else {
      bodyLines = remainingLines;
    }

    // Strip trailing closing '---' from back matter or body
    while (backMatterLines.length > 0 && (backMatterLines[backMatterLines.length - 1].trim() === "---" || backMatterLines[backMatterLines.length - 1].trim() === "")) {
      backMatterLines.pop();
    }
    while (bodyLines.length > 0 && (bodyLines[bodyLines.length - 1].trim() === "---" || bodyLines[bodyLines.length - 1].trim() === "")) {
      bodyLines.pop();
    }

    // 5. Parse Back Matter Items
    if (backMatterLines.length > 0) {
      result.backMatter.hasBackMatter = true;
      const backMatterText = backMatterLines.join("\n");

      // Check footnotes in blockquote or list
      const fnRegex = />?\s*\(([0-9]+)\)\s+([\s\S]+?)(?=(?:>?\s*\([0-9]+\)|$))/g;
      let fnMatch;
      while ((fnMatch = fnRegex.exec(backMatterText)) !== null) {
        const fnNum = parseInt(fnMatch[1], 10);
        const fnText = fnMatch[2].replace(/^>\s?/gm, "").trim();
        result.backMatter.footnotes.push({ number: fnNum, text: fnText });
      }

      // Check bibliography items
      if (/บรรณานุกรม|เอกสารอ้างอิง|Bibliography|References/i.test(backMatterText)) {
        const bibLines = backMatterText
          .split("\n")
          .map((l) => l.replace(/^>\s?/, "").trim())
          .filter((l) => l.length > 15 && !/^(บรรณานุกรม|เอกสารอ้างอิง|Bibliography|References|#|---)/i.test(l));
        result.backMatter.bibliography = bibLines;
      }

      // Check further reading
      if (/หนังสืออ่านเพิ่มเติม|Further Reading/i.test(backMatterText)) {
        const readingLines = backMatterText
          .split("\n")
          .map((l) => l.replace(/^>\s?/, "").trim())
          .filter((l) => l.length > 15 && !/^(หนังสืออ่านเพิ่มเติม|Further Reading|#|---)/i.test(l));
        result.backMatter.furtherReading = readingLines;
      }
    }

    // Ensure all introductory paragraphs are part of the body markdown pipeline
    if (result.openingMatter.introduction.length > 0) {
      bodyLines = [...result.openingMatter.introduction, "", ...bodyLines];
      result.openingMatter.introduction = [];
    }

    // 6. Build Table of Contents and anchors from body headings
    let processedBodyText = bodyLines.join("\n");

    const headingRegex = /^(#{2,4})\s+(.+)$/gm;
    let headingMatch;
    while ((headingMatch = headingRegex.exec(processedBodyText)) !== null) {
      const depth = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const slug = slugifyHeading(text);
      result.tableOfContents.push({ depth, text, slug });
    }

    // 7. Footnote Inline Linking Heuristic
    if (result.backMatter.footnotes.length > 0) {
      const availableFootnotes = new Set(result.backMatter.footnotes.map((f) => f.number));
      const referencedFootnotes = new Set<number>();

      // Replace (N) in body that are NOT at line start
      processedBodyText = processedBodyText.replace(
        /(?<=[^\n])\s*\(([0-9]+)\)(?!\))/g,
        (match, numStr) => {
          const num = parseInt(numStr, 10);
          if (availableFootnotes.has(num)) {
            referencedFootnotes.add(num);
            return ` <sup id="fnref-${num}"><a href="#fn-${num}" class="footnote-ref text-[var(--gold)] font-mono text-[10px] hover:underline" data-fn="${num}">[${num}]</a></sup>`;
          }
          return match;
        }
      );

      // Warning check for missing footnote references or markers
      for (const fn of result.backMatter.footnotes) {
        if (!referencedFootnotes.has(fn.number)) {
          buildReport.add({
            type: "footnote_mismatch",
            file: fileName,
            message: `Footnote note (${fn.number}) exists in back matter but has no inline marker in body text.`,
          });
        }
      }
    }

    result.bodyMarkdown = processedBodyText;
  } catch (err: any) {
    // Graceful fallback to default prose styling
    buildReport.add({
      type: "non_conforming_structure",
      file: fileName,
      message: `Failed to parse article zones: ${err?.message || err}. Falling back to default prose.`,
    });
    result.isFellBack = true;
    result.bodyMarkdown = rawContent;
  }

  return result;
}
