import { getAllArticles, getAllTagNotes, slugify, stripMarkdown } from './content';

export interface Backlink {
  sourceId: string;
  sourceTitle: string;
  sourceTitleEn: string;
  sourceTags: string[];
  contextSnippet?: string;
}

export interface HubData {
  keyword: string;
  articles: Backlink[];
  contextSnippets: {
    articleId: string;
    articleTitle: string;
    snippet: string;
  }[];
  coOccurringKeywords: { tag: string; count: number }[];
}

export function getBacklinksFor(targetArticleId: string): Backlink[] {
  const allArticles = getAllArticles();
  const targetArticle = allArticles.find((a) => a.id === targetArticleId);

  if (!targetArticle) return [];

  const targetTitleTh = targetArticle.frontmatter.title_th;
  const targetTitleEn = targetArticle.frontmatter.title_en;

  const linkPatterns = [
    `[[${targetTitleTh}]]`,
    `[[${targetTitleEn}]]`,
    `[[${targetArticle.id}]]`,
    `[[${targetArticle.id} `,
  ];

  const backlinks: Backlink[] = [];

  for (const article of allArticles) {
    if (article.id === targetArticleId) continue;

    const containsLink = linkPatterns.some((pattern) => article.content.includes(pattern));

    if (containsLink) {
      backlinks.push({
        sourceId: article.id,
        sourceTitle: article.frontmatter.title_th,
        sourceTitleEn: article.frontmatter.title_en,
        sourceTags: article.frontmatter.tags,
      });
    }
  }

  return backlinks;
}

export function getHubArticles(keyword: string): HubData {
  const allArticles = getAllArticles();
  const tagNotes = getAllTagNotes();
  const normalizedKeyword = slugify(keyword);
  const lowerKeyword = keyword.toLowerCase().trim();

  // Find note and its aliases
  const matchedNote = tagNotes.find(
    (n) =>
      n.slug === normalizedKeyword ||
      n.filename.toLowerCase() === lowerKeyword ||
      n.aliases.some((a) => a.toLowerCase() === lowerKeyword || slugify(a) === normalizedKeyword)
  );

  const lookupTerms = new Set<string>([lowerKeyword]);
  if (matchedNote) {
    lookupTerms.add(matchedNote.filename.toLowerCase());
    matchedNote.aliases.forEach((a) => lookupTerms.add(a.toLowerCase()));
  }

  const hubArticles: Backlink[] = [];
  const contextSnippets: { articleId: string; articleTitle: string; snippet: string }[] = [];
  const coOccurMap = new Map<string, number>();

  for (const article of allArticles) {
    let isMatched = false;
    let snippetFound: string | null = null;

    // 1. Tag match
    const hasTag = article.frontmatter.tags.some(
      (tag) => lookupTerms.has(tag.toLowerCase()) || slugify(tag) === normalizedKeyword
    );
    if (hasTag) isMatched = true;

    // 2. Link match and snippet extraction
    for (const term of lookupTerms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const linkRegex = new RegExp(`\\[\\[${escaped}(\\|.*?)?\\]\\]`, 'gi');

      if (linkRegex.test(article.content)) {
        isMatched = true;

        if (!snippetFound) {
          // Extract paragraph where link occurs
          const paragraphs = article.content.split(/\n\s*\n/);
          for (const p of paragraphs) {
            if (new RegExp(`\\[\\[${escaped}(\\|.*?)?\\]\\]`, 'i').test(p)) {
              snippetFound = stripMarkdown(p).substring(0, 240);
              break;
            }
          }
        }
      }
    }

    if (isMatched) {
      hubArticles.push({
        sourceId: article.id,
        sourceTitle: article.frontmatter.title_th,
        sourceTitleEn: article.frontmatter.title_en,
        sourceTags: article.frontmatter.tags,
        contextSnippet: snippetFound || undefined,
      });

      if (snippetFound) {
        contextSnippets.push({
          articleId: article.id,
          articleTitle: article.frontmatter.title_th,
          snippet: snippetFound,
        });
      }

      // Count co-occurring tags
      for (const t of article.frontmatter.tags) {
        if (!lookupTerms.has(t.toLowerCase()) && slugify(t) !== normalizedKeyword) {
          coOccurMap.set(t, (coOccurMap.get(t) || 0) + 1);
        }
      }
    }
  }

  const coOccurringKeywords = Array.from(coOccurMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    keyword,
    articles: hubArticles,
    contextSnippets,
    coOccurringKeywords,
  };
}
