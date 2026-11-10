import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const dynamic = "force-static";

export interface PoolKeyword {
  target: string;
  display: string;
  start: number;
  end: number;
}

export interface PoolItem {
  id: string;
  titleTh: string;
  text: string;
  keywords: PoolKeyword[];
}

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else if (file.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function cleanTextFragment(str: string): string {
  let res = str.replace(/\\([\[\]\(\)\*_\-#])/g, "$1");
  res = res.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/\u00A0/g, " ");
  return res;
}

export async function GET() {
  const rawMdDir = path.join(process.cwd(), "md_archive", "01.RAW MD");
  const tagsDir = path.join(process.cwd(), "md_archive", "03.tag");
  const files = getFilesRecursively(rawMdDir);

  // Load tag terms from 03.tag
  const tagTerms: { target: string; display: string }[] = [];
  if (fs.existsSync(tagsDir)) {
    const tagFiles = fs.readdirSync(tagsDir).filter((f) => f.endsWith(".md"));
    for (const tf of tagFiles) {
      const name = tf.replace(/\.md$/, "").trim();
      if (name.length >= 3) {
        tagTerms.push({ target: name, display: name });
      }
    }
    tagTerms.sort((a, b) => b.display.length - a.display.length);
  }

  // Multi-article series detector
  const seriesToArticles = new Map<string, Set<string>>();
  for (const file of files) {
    try {
      const { data } = matter(fs.readFileSync(file, "utf8"));
      const titleTh = data.title_th ? String(data.title_th) : path.basename(file, ".md");
      const id = data.id !== undefined && data.id !== null ? String(data.id) : path.basename(file).substring(0, 4);
      const seriesKey = titleTh
        .replace(/\s*\((?:[0-9]+|[๑-๙]+)\)\s*$/, "")
        .replace(/\s*(?:ตอนที่|ตอน)\s*(?:[0-9]+|[๑-๙]+)\s*$/, "")
        .replace(/\s*[0-9]+$/, "")
        .trim();
      if (!seriesToArticles.has(seriesKey)) {
        seriesToArticles.set(seriesKey, new Set());
      }
      seriesToArticles.get(seriesKey)!.add(id);
    } catch {
      // ignore
    }
  }

  interface Candidate {
    id: string;
    titleTh: string;
    seriesKey: string;
    first40: string;
    text: string;
    keywords: PoolKeyword[];
    hasKeyword: boolean;
  }

  const candidates: Candidate[] = [];

  for (const file of files) {
    try {
      const fileContents = fs.readFileSync(file, "utf8");
      const { data, content } = matter(fileContents);
      const id = data.id !== undefined && data.id !== null ? String(data.id) : path.basename(file).substring(0, 4);
      const titleTh = data.title_th ? String(data.title_th) : path.basename(file, ".md");

      const seriesKey = titleTh
        .replace(/\s*\((?:[0-9]+|[๑-๙]+)\)\s*$/, "")
        .replace(/\s*(?:ตอนที่|ตอน)\s*(?:[0-9]+|[๑-๙]+)\s*$/, "")
        .replace(/\s*[0-9]+$/, "")
        .trim();

      const bodyLength = content.length;
      const minOffset = Math.floor(bodyLength * 0.30);
      const maxOffset = Math.floor(bodyLength * 0.85);

      const rawParagraphs = content.split(/\r?\n\r?\n+/);
      let searchPos = 0;

      for (const rawP of rawParagraphs) {
        const startOffset = content.indexOf(rawP, searchPos);
        if (startOffset !== -1) {
          searchPos = startOffset + rawP.length;
        }

        const p = rawP.trim();
        if (!p) continue;
        // Candidate paragraphs ONLY between 30% and 85% of body length
        if (startOffset < minOffset || startOffset > maxOffset) continue;
        if (p.startsWith("#") || p.startsWith(">") || p.startsWith("-") || /^\d+\)/.test(p)) continue;
        if (p.length < 120) continue;
        if (p.includes("http")) continue;
        if (/ผู้แปล|ต้นฉบับ|ที่มา|เชิงอรรถ|บรรณานุกรม/.test(p)) continue;

        const thaiChars = (p.match(/[\u0E00-\u0E7F]/g) || []).length;
        const hasWiki = /\[\[(.*?)\]\]/.test(p);
        if (!hasWiki && (thaiChars / p.length < 0.4)) continue;
        if (p === titleTh || p.startsWith(titleTh)) continue;

        // Clean text & track keyword offsets
        const pWithoutSlash = p.replace(/\\([\[\]\(\)\*_\-#])/g, "$1");
        const keywords: PoolKeyword[] = [];
        let cleaned = "";
        let lastIdx = 0;
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match: RegExpExecArray | null;

        while ((match = linkRegex.exec(pWithoutSlash)) !== null) {
          cleaned += cleanTextFragment(pWithoutSlash.substring(lastIdx, match.index));
          const inner = match[1];
          const parts = inner.split("|");
          const target = parts[0].trim();
          const display = parts[1] ? parts[1].trim() : target;
          const start = cleaned.length;
          cleaned += display;
          const end = cleaned.length;
          keywords.push({ target, display, start, end });
          lastIdx = linkRegex.lastIndex;
        }
        cleaned += cleanTextFragment(pWithoutSlash.substring(lastIdx));

        // Remove ** and *, non-breaking spaces, collapse whitespace
        cleaned = cleaned
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/\u00A0/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleaned.length < 120) continue;
        if (cleaned.length > 450) {
          cleaned = cleaned.substring(0, 449) + "…";
        }

        // If no wikilink found, check for tag note term
        if (keywords.length === 0) {
          for (const t of tagTerms) {
            const idx = cleaned.indexOf(t.display);
            if (idx !== -1) {
              keywords.push({
                target: t.target,
                display: t.display,
                start: idx,
                end: idx + t.display.length,
              });
              break;
            }
          }
        }

        const first40 = cleaned.slice(0, 40).replace(/[\s\p{P}\p{S}]/gu, "");

        candidates.push({
          id,
          titleTh,
          seriesKey,
          first40,
          text: cleaned,
          keywords,
          hasKeyword: keywords.length > 0,
        });
      }
    } catch {
      // skip
    }
  }

  // Prioritize keyword items to maintain >= 60% keyword ratio
  const pool: PoolItem[] = [];
  const seenFirst40 = new Set<string>();
  const seenSeries = new Set<string>();
  const articleCount = new Map<string, number>();

  const keywordCandidates = candidates.filter((c) => c.hasKeyword);
  const nonKeywordCandidates = candidates.filter((c) => !c.hasKeyword);

  const sortedCandidates = [...keywordCandidates, ...nonKeywordCandidates];

  for (const c of sortedCandidates) {
    if (pool.length >= 420) break;
    if (seenFirst40.has(c.first40)) continue;

    const isMultiSeries = (seriesToArticles.get(c.seriesKey)?.size || 1) > 1;
    if (isMultiSeries && seenSeries.has(c.seriesKey)) {
      continue;
    }

    const currentArtCount = articleCount.get(c.id) || 0;
    if (currentArtCount >= 2) continue;

    seenFirst40.add(c.first40);
    seenSeries.add(c.seriesKey);
    articleCount.set(c.id, currentArtCount + 1);

    pool.push({
      id: c.id,
      titleTh: c.titleTh,
      text: c.text,
      keywords: c.keywords,
    });
  }

  return NextResponse.json(pool);
}
