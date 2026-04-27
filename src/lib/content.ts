import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface ArticleFrontmatter {
  id: string;
  title_th: string;
  title_en: string;
  date: string;
  tags: string[];
  description?: string;
  reading_time?: string;
  status?: string;
  last_mod?: string;
  author?: string;
}

export interface Article {
  slug: string; // The title_en slugified
  id: string;
  frontmatter: ArticleFrontmatter;
  content: string;
  rawPath: string; // the original path relative to workspace
}

const mdArchiveDir = path.join(process.cwd(), 'md_archive');
const rawMdDir = path.join(mdArchiveDir, '01.RAW MD');

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\p{L}\p{N}\p{M}\-]+/gu, '') // Keep letters, numbers, marks (Thai vowels/diacritics), and dashes
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

function calculateReadingTime(text: string): string {
  // Approximate reading time (using length instead of word count since Thai has no spaces)
  // Assuming 200 words per min, approx 1200 characters per min for Thai
  const charCount = text.length;
  const time = Math.ceil(charCount / 1200);
  return `${time} min read`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#+\s/g, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract text from links
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // Extract text from obsidian links
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italics
    .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
    .replace(/>\s?/g, '') // Remove blockquotes
    .replace(/`{1,3}[^`\n]*`{1,3}/g, '') // Remove inline code and code blocks
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}

// Function to recursively get all markdown files
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

export function getAllArticles(): Article[] {
  const files = getFilesRecursively(rawMdDir);
  
  const articles = files.map(fullPath => {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const stat = fs.statSync(fullPath);
    const { data, content } = matter(fileContents);
    
    // Some validation / defaults
    const frontmatter: ArticleFrontmatter = {
      id: data.id ? String(data.id) : path.basename(fullPath, '.md').substring(0, 4),
      title_th: data.title_th || path.basename(fullPath, '.md'),
      title_en: data.title_en || 'Untitled',
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : '2000-01-01',
      tags: data.tags || [],
      description: data.description || stripMarkdown(content).substring(0, 200) + '...',
      reading_time: data.reading_time || calculateReadingTime(content),
      status: data.status || 'published',
      last_mod: data.last_mod || stat.mtime.toISOString().split('T')[0],
      author: data.author || 'NA',
    };

    return {
      slug: slugify(frontmatter.title_en),
      id: frontmatter.id,
      frontmatter,
      content,
      rawPath: fullPath,
    };
  });
  
  // Sort by id / date
  return articles.sort((a, b) => a.id.localeCompare(b.id));
}

export function getArticleById(id: string): Article | null {
  const articles = getAllArticles();
  return articles.find(a => a.id === id) || null;
}

export function getArticleBySlug(slug: string): Article | null {
  const articles = getAllArticles();
  return articles.find(a => a.slug === slug) || null;
}

// Convert [[filename]] to /article/[id]
// Supports aliased links: [[target|alias]]
export function resolveObsidianLinks(content: string, articles: Article[]): string {
  return content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
    const parts = p1.split('|');
    const target = parts[0].trim();
    const alias = parts[1] ? parts[1].trim() : target;

    // 1. Try to find by ID exactly
    let linkedArticle = articles.find(a => a.id === target);
    
    // 2. Try to find by title or filename
    if (!linkedArticle) {
      linkedArticle = articles.find(a => 
        a.frontmatter.title_th === target || 
        a.frontmatter.title_en === target ||
        path.basename(a.rawPath, '.md') === target
      );
    }
    
    // 3. If target starts with 4 digits, try finding by that ID (common in LOC files)
    if (!linkedArticle && /^\d{4}/.test(target)) {
      const idPrefix = target.substring(0, 4);
      linkedArticle = articles.find(a => a.id === idPrefix);
    }
    
    if (linkedArticle) {
      return `[${alias}](/article/${linkedArticle.id})`;
    }
    
    // Fallback: search for keyword/tag
    return `[${alias}](/keyword/${slugify(target)})`;
  });
}

export function getHubFiles(): string[] {
  const tagsDir = path.join(mdArchiveDir, '03.tag');
  if (!fs.existsSync(tagsDir)) return [];
  return fs.readdirSync(tagsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));
}

export function getHubContent(hubName: string): string | null {
  const tagsDir = path.join(mdArchiveDir, '03.tag');
  const fullPath = path.join(tagsDir, `${hubName}.md`);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf8');
  }
  return null;
}

// --- LOC (List of Content) Functions ---

export interface LOCVolume {
  slug: string;
  title: string;
  content: string;
}

export function getLOCFiles(): LOCVolume[] {
  const locDir = path.join(process.cwd(), 'md_archive', '04.LOC');
  if (!fs.existsSync(locDir)) {
    return [];
  }

  const files = fs.readdirSync(locDir).filter(f => f.endsWith('.md'));
  
  const volumes = files.map(file => {
    const fullPath = path.join(locDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const slug = file.replace(/\.md$/, '');
    
    // Extract title from the first heading, fallback to slug
    const firstLineMatch = content.match(/^#\s+(.+)/m);
    const title = firstLineMatch ? firstLineMatch[1].trim() : slug;
    
    return {
      slug,
      title,
      content
    };
  });

  // Sort volumes alphabetically (e.g., 0000-0200 before 0201-0400)
  return volumes.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getLOCBySlug(slug: string): LOCVolume | null {
  const volumes = getLOCFiles();
  return volumes.find(v => v.slug === slug) || null;
}

export interface RandomParagraph {
  text: string;
  articleId: string;
  articleTitle: string;
  author: string;
  date: string;
}

export function getRandomParagraphs(count: number): RandomParagraph[] {
  const allArticles = getAllArticles();
  const allParagraphs: RandomParagraph[] = [];

  allArticles.forEach(article => {
    // Split by double newline or single newline if it looks like a new paragraph
    // Remove headers and extra markdown
    const cleanedContent = article.content
      .replace(/^#+.*$/gm, '') // Remove headers
      .replace(/!\[.*\]\(.*\)/g, '') // Remove images
      .trim();

    const paragraphs = cleanedContent.split(/\n\s*\n/);
    
    paragraphs.forEach(p => {
      const trimmed = p.trim();
      // Only keep paragraphs with some substance (at least 20 chars)
      // and not code blocks or lists
      if (trimmed.length > 50 && !trimmed.startsWith('```') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        // Strip markdown for preview
        const plainText = stripMarkdown(trimmed);
        
        // Limit word count (approx)
        const words = plainText.split(/\s+/);
        const preview = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');

        allParagraphs.push({
          text: preview,
          articleId: article.id,
          articleTitle: article.frontmatter.title_th,
          author: article.frontmatter.author || 'NA',
          date: article.frontmatter.date
        });
      }
    });
  });

  // Pick random ones
  const shuffled = allParagraphs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
