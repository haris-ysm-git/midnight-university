import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { buildReport } from './build-report';

export interface ArticleFrontmatter {
  id: string; // ALWAYS string (e.g. '0308', '0126-1')
  title_th: string;
  title_en: string;
  date: string;
  tags: string[];
  description?: string;
  reading_time?: string;
  status?: 'draft' | 'published';
  last_mod?: string;
  author?: string;
}

export interface Article {
  slug: string; // The title_en slugified
  id: string; // canonical string ID
  frontmatter: ArticleFrontmatter;
  content: string;
  rawPath: string; // relative to workspace
}

export interface TagHubNote {
  slug: string;
  filename: string;
  title: string;
  aliases: string[];
  type?: 'person' | 'concept' | 'work' | 'place' | 'movement' | 'school';
  body: string;
  rawPath: string;
}

export interface LOCItem {
  id: string;
  title: string;
  rawLine: string;
  isArchived: boolean;
  article?: Article;
}

export interface LOCVolume {
  slug: string;
  title: string;
  volumeNumber: string;
  content: string;
  items: LOCItem[];
  totalCount: number;
  archivedCount: number;
  progressPercent: number;
}

const mdArchiveDir = path.join(process.cwd(), 'md_archive');
const rawMdDir = path.join(mdArchiveDir, '01.RAW MD');
const tagsDir = path.join(mdArchiveDir, '03.tag');
const locDir = path.join(mdArchiveDir, '04.LOC');

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\p{M}\-]+/gu, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Thai-aware reading time calculation.
 * Thai has no spaces between words. We use approximate Thai character count / segmenter.
 * Typical reading speed: ~1000-1200 Thai characters per minute.
 */
export function calculateReadingTime(text: string): string {
  const clean = text.replace(/#+.*$/gm, '').replace(/\[.*?\]\(.*?\)/g, '').replace(/\[\[.*?\]\]/g, '').trim();
  const charCount = clean.length;
  const minutes = Math.max(1, Math.ceil(charCount / 1100));
  return `${minutes} min read`;
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/#+\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/>\s?/g, '')
    .replace(/`{1,3}[^`\n]*`{1,3}/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function getFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  let allFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      allFiles = allFiles.concat(getFilesRecursively(fullPath));
    } else if (file.endsWith('.md')) {
      allFiles.push(fullPath);
    }
  }

  return allFiles;
}

// In-memory cache for build performance
let cachedArticles: Article[] | null = null;
let cachedTagNotes: TagHubNote[] | null = null;
let cachedLOCVolumes: LOCVolume[] | null = null;

export function getAllArticles(): Article[] {
  if (cachedArticles) return cachedArticles;
  const files = getFilesRecursively(rawMdDir);

  const articles: Article[] = [];

  for (const fullPath of files) {
    try {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const stat = fs.statSync(fullPath);
      const { data, content } = matter(fileContents);

      // Enforce string ID
      let rawId = data.id !== undefined && data.id !== null ? String(data.id) : '';
      if (!rawId) {
        const basename = path.basename(fullPath, '.md');
        const match = basename.match(/^(\d{4}(?:-\d+)?)/);
        rawId = match ? match[1] : basename.substring(0, 4);
      }

      // Hide drafts in production
      const status = (data.status as 'draft' | 'published') || 'published';
      if (process.env.NODE_ENV === 'production' && status === 'draft') {
        continue;
      }

      const frontmatter: ArticleFrontmatter = {
        id: rawId,
        title_th: data.title_th ? String(data.title_th) : path.basename(fullPath, '.md'),
        title_en: data.title_en ? String(data.title_en) : 'Untitled',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '2000-01-01',
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        description: data.description ? String(data.description) : stripMarkdown(content).substring(0, 160) + '...',
        reading_time: data.reading_time ? String(data.reading_time) : calculateReadingTime(content),
        status,
        last_mod: data.last_mod ? String(data.last_mod) : stat.mtime.toISOString().split('T')[0],
        author: data.author ? String(data.author) : 'NA',
      };

      articles.push({
        slug: slugify(frontmatter.title_en || frontmatter.id),
        id: frontmatter.id,
        frontmatter,
        content,
        rawPath: path.relative(process.cwd(), fullPath),
      });
    } catch (err: any) {
      buildReport.add({
        type: 'metadata_issue',
        file: fullPath,
        message: `Failed to parse article: ${err?.message || err}`,
      });
    }
  }

  // Sort by id
  cachedArticles = articles.sort((a, b) => a.id.localeCompare(b.id));
  return cachedArticles;
}

export function getArticleById(id: string): Article | null {
  const articles = getAllArticles();
  if (!id) return null;
  const normalized = id.trim();
  const normalizedLower = normalized.toLowerCase();

  // 1. Exact string match on ID (e.g. '0002', '1177', '0126-1')
  const exact = articles.find((a) => a.id.toLowerCase() === normalizedLower);
  if (exact) return exact;

  // 2. Numeric match (e.g. '2' -> '0002', '19' -> '0019', '811' -> '0811')
  const numParsed = parseInt(normalized, 10);
  if (!isNaN(numParsed)) {
    const padded = String(numParsed).padStart(4, '0');
    const numMatch = articles.find((a) => a.id === padded || parseInt(a.id, 10) === numParsed);
    if (numMatch) return numMatch;
  }

  // 3. Leading ID in string (e.g. '0002-thinking', '0002 วิธีคิด', '1177 ความเป็นมา...')
  const prefixMatch = normalized.match(/^(\d{4}(?:-\d+)?)/);
  if (prefixMatch) {
    const prefixId = prefixMatch[1];
    const match = articles.find((a) => a.id === prefixId || parseInt(a.id, 10) === parseInt(prefixId, 10));
    if (match) return match;
  }

  return null;
}

export function getArticleBySlug(slug: string): Article | null {
  const articles = getAllArticles();
  if (!slug) return null;
  const normalized = slug.trim();
  const normalizedLower = normalized.toLowerCase();
  const slugifiedInput = slugify(normalized);

  // 1. ID check first
  const byId = getArticleById(normalized);
  if (byId) return byId;

  // 2. Exact match on slug (e.g. 'thinking', 'language-of-nature')
  const bySlug = articles.find(
    (a) => a.slug.toLowerCase() === normalizedLower || a.slug === slugifiedInput
  );
  if (bySlug) return bySlug;

  // 3. Thai title match (exact or slugified)
  const byTitleTh = articles.find(
    (a) =>
      a.frontmatter.title_th.toLowerCase() === normalizedLower ||
      slugify(a.frontmatter.title_th) === slugifiedInput ||
      a.frontmatter.title_th.toLowerCase().includes(normalizedLower)
  );
  if (byTitleTh) return byTitleTh;

  // 4. English title match
  const byTitleEn = articles.find(
    (a) =>
      a.frontmatter.title_en.toLowerCase() === normalizedLower ||
      slugify(a.frontmatter.title_en) === slugifiedInput
  );
  if (byTitleEn) return byTitleEn;

  // 5. Filename match from rawPath
  const byFilename = articles.find((a) => {
    const base = path.basename(a.rawPath, '.md').toLowerCase();
    return base === normalizedLower || slugify(base) === slugifiedInput;
  });
  if (byFilename) return byFilename;

  return null;
}

/**
 * Ingest all keyword notes from md_archive/03.tag/
 */
export function getAllTagNotes(): TagHubNote[] {
  if (cachedTagNotes) return cachedTagNotes;
  if (!fs.existsSync(tagsDir)) return [];

  const files = fs.readdirSync(tagsDir).filter((f) => f.endsWith('.md'));
  const tagNotes: TagHubNote[] = [];

  for (const file of files) {
    const fullPath = path.join(tagsDir, file);
    const contentRaw = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(contentRaw);
    const baseName = path.basename(file, '.md');

    const aliases: string[] = [];
    if (Array.isArray(data.aliases)) {
      aliases.push(...data.aliases.map(String));
    } else if (typeof data.aliases === 'string') {
      aliases.push(data.aliases);
    }

    tagNotes.push({
      slug: slugify(baseName),
      filename: baseName,
      title: baseName,
      aliases,
      type: data.type || undefined,
      body: content.trim(),
      rawPath: path.relative(process.cwd(), fullPath),
    });
  }

  cachedTagNotes = tagNotes;
  return cachedTagNotes;
}

export function getTagNoteBySlug(slug: string): TagHubNote | null {
  const notes = getAllTagNotes();
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const slugified = slugify(decoded);

  return (
    notes.find(
      (n) =>
        n.slug === slugified ||
        n.filename.toLowerCase() === decoded ||
        n.aliases.some((a) => a.toLowerCase() === decoded || slugify(a) === slugified)
    ) || null
  );
}

/**
 * Tolerant Wikilink Resolution:
 * Matches [[target|display]] or [[target]].
 * - First by article ID (leading 4 digits and optional -1/-2 variant)
 * - Then by article title_th / title_en
 * - Then by tag note filename
 * - Then by tag note aliases (case-insensitive & whitespace-normalized)
 * - If unresolved: renders as muted text with dotted underline and tooltip (never a 404), logs to build report.
 */
export function resolveObsidianLinks(
  content: string,
  articles: Article[] = getAllArticles(),
  tagNotes: TagHubNote[] = getAllTagNotes(),
  sourceFile: string = 'content'
): string {
  // Pre-build alias map for O(1) matching
  const aliasToSlugMap = new Map<string, string>();
  for (const note of tagNotes) {
    aliasToSlugMap.set(note.filename.toLowerCase().trim(), note.slug);
    for (const alias of note.aliases) {
      aliasToSlugMap.set(alias.toLowerCase().trim(), note.slug);
    }
  }

  return content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
    const cleanP1 = p1.replace(/^\[+|\]+$/g, '');
    const parts = cleanP1.split('|');
    const target = parts[0].trim();
    const alias = parts[1] ? parts[1].trim() : target;
    const targetNormalized = target.toLowerCase();

    // 1. Resolve by article ID (4 digits + optional suffix)
    const idPrefixMatch = target.match(/^(\d{4}(?:-\d+)?)/);
    if (idPrefixMatch) {
      const articleById = articles.find((a) => a.id === idPrefixMatch[1]);
      if (articleById) {
        return `[${alias}](/article/${articleById.id})`;
      }
    }

    // 2. Resolve by exact article title
    const articleByTitle = articles.find(
      (a) =>
        a.frontmatter.title_th.toLowerCase() === targetNormalized ||
        a.frontmatter.title_en.toLowerCase() === targetNormalized
    );
    if (articleByTitle) {
      return `[${alias}](/article/${articleByTitle.id})`;
    }

    // 3. Resolve by tag note filename or alias
    if (aliasToSlugMap.has(targetNormalized)) {
      const noteSlug = aliasToSlugMap.get(targetNormalized)!;
      return `[${alias}](/keyword/${encodeURIComponent(noteSlug)})`;
    }

    // 4. Resolve by matching article tags directly
    const tagMatch = articles.some((a) =>
      a.frontmatter.tags.some((t) => t.toLowerCase() === targetNormalized)
    );
    if (tagMatch) {
      return `[${alias}](/keyword/${encodeURIComponent(slugify(target))})`;
    }

    // 5. Unresolved link: DO NOT break as a 404. Render as markdown link to #unresolved with title attribute.
    buildReport.add({
      type: 'unresolved_link',
      file: sourceFile,
      message: `Unresolved wikilink: [[${target}]]`,
    });

    const safeTitle = target.replace(/"/g, "'");
    return `[${alias}](#unresolved "${safeTitle}")`;
  });
}

/**
 * Parse List_of_Content files from 04.LOC/
 */
export function getLOCFiles(): LOCVolume[] {
  if (cachedLOCVolumes) return cachedLOCVolumes;
  if (!fs.existsSync(locDir)) return [];

  const articles = getAllArticles();
  const files = fs.readdirSync(locDir).filter((f) => f.endsWith('.md'));

  const volumes: LOCVolume[] = files.map((file) => {
    const fullPath = path.join(locDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const slug = file.replace(/\.md$/, '');

    const lines = content.split(/\r?\n/);
    let title = slug;
    let volumeNumber = '';

    const firstH1 = lines.find((l) => l.startsWith('# '));
    if (firstH1) {
      title = firstH1.replace(/^#\s+/, '').trim();
    }
    const volMatch = slug.match(/(\d{4}-\d{4})/);
    if (volMatch) {
      volumeNumber = volMatch[1];
    }

    const items: LOCItem[] = [];
    let archivedCount = 0;
    let totalCount = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line === '---') continue;

      // Check if line contains [[...]] wikilink (e.g. [[NNNN title]] or [[NNNN target|alias]])
      const wikilinkMatch = line.match(/\[\[(.*?)\]\]/);
      if (wikilinkMatch) {
        totalCount++;
        archivedCount++;
        const inner = wikilinkMatch[1].trim();
        const parts = inner.split('|');
        const target = parts[0].trim();
        const alias = parts[1] ? parts[1].trim() : target;

        // Extract 4-digit ID from target or alias
        const idMatch = target.match(/^(\d{4}(?:-\d+)?)/) || alias.match(/^(\d{4}(?:-\d+)?)/);
        const itemId = idMatch ? idMatch[1] : target.substring(0, 4);
        let itemTitle = alias.replace(/^(\d{4}(?:-\d+)?)\s*/, '').trim() || target;

        const matchingArticle = articles.find((a) => a.id === itemId);
        if (matchingArticle && !itemTitle) {
          itemTitle = matchingArticle.frontmatter.title_th;
        }

        items.push({
          id: itemId,
          title: itemTitle || line,
          rawLine: line,
          isArchived: true,
          article: matchingArticle,
        });
        continue;
      }

      // Check if plain line starts with NNNN
      const plainMatch = line.match(/^(\d{4}(?:-\d+)?)\s+(.+)$/);
      if (plainMatch) {
        totalCount++;
        const itemId = plainMatch[1];
        const itemTitle = plainMatch[2];
        const matchingArticle = articles.find((a) => a.id === itemId);

        // If article actually exists even though not bracketed, treat as archived
        const isActuallyArchived = Boolean(matchingArticle);
        if (isActuallyArchived) archivedCount++;

        items.push({
          id: itemId,
          title: itemTitle,
          rawLine: line,
          isArchived: isActuallyArchived,
          article: matchingArticle,
        });
      }
    }

    const progressPercent = totalCount > 0 ? Math.round((archivedCount / totalCount) * 100) : 0;

    return {
      slug,
      title,
      volumeNumber: volumeNumber || slug.replace('List of Content ', ''),
      content,
      items,
      totalCount,
      archivedCount,
      progressPercent,
    };
  });

  cachedLOCVolumes = volumes.sort((a, b) => a.slug.localeCompare(b.slug));
  return cachedLOCVolumes;
}

export function getLOCBySlug(slug: string): LOCVolume | null {
  const volumes = getLOCFiles();
  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  return (
    volumes.find(
      (v) =>
        v.slug.toLowerCase() === decoded ||
        v.volumeNumber.toLowerCase() === decoded ||
        v.slug.toLowerCase().includes(decoded)
    ) || null
  );
}

export function getHubFiles(): string[] {
  return getAllTagNotes().map((n) => n.filename);
}

export function getHubContent(hubName: string): string | null {
  const note = getTagNoteBySlug(hubName);
  return note ? note.body : null;
}

export interface RandomParagraph {
  text: string;
  fullText: string;
  articleId: string;
  articleTitle: string;
  author: string;
  date: string;
}

function selectPhrase(text: string): string {
  const fragments = text.split(/\s{2,}/).filter((f) => f.trim().length > 20);
  if (fragments.length <= 1) return text;
  return fragments[0].trim();
}

export function getTagNames(): string[] {
  return getAllTagNotes().map((n) => n.filename);
}

export function getRandomParagraphs(count: number): RandomParagraph[] {
  const allArticles = getAllArticles();
  const allParagraphs: RandomParagraph[] = [];

  allArticles.forEach((article) => {
    const cleanedContent = article.content
      .replace(/^#+.*$/gm, '')
      .replace(/!\[.*\]\(.*\)/g, '')
      .trim();

    const paragraphs = cleanedContent.split(/\n\s*\n/);

    paragraphs.forEach((p) => {
      const trimmed = p.trim();
      if (
        trimmed.length > 80 &&
        !trimmed.startsWith('```') &&
        !trimmed.startsWith('-') &&
        !trimmed.startsWith('*')
      ) {
        const plainText = stripMarkdown(trimmed);
        allParagraphs.push({
          text: selectPhrase(plainText),
          fullText: plainText,
          articleId: article.id,
          articleTitle: article.frontmatter.title_th,
          author: article.frontmatter.author || 'NA',
          date: article.frontmatter.date,
        });
      }
    });
  });

  const shuffled = allParagraphs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
