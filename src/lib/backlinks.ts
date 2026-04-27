import { getAllArticles, Article, slugify } from './content';

export interface Backlink {
  sourceId: string;
  sourceTitle: string;
  sourceTitleEn: string;
  sourceTags: string[];
}

export function getBacklinksFor(targetArticleId: string): Backlink[] {
  const allArticles = getAllArticles();
  const targetArticle = allArticles.find(a => a.id === targetArticleId);
  
  if (!targetArticle) return [];

  const targetTitleTh = targetArticle.frontmatter.title_th;
  const targetTitleEn = targetArticle.frontmatter.title_en;
  
  // Create variations of what could be linked
  const linkPatterns = [
    `[[${targetTitleTh}]]`,
    `[[${targetTitleEn}]]`,
    `[[${targetArticle.id}]]`,
    `[[${targetTitleTh.split(' ').join('')}]]`, // sometimes names might be joined
  ];

  const backlinks: Backlink[] = [];

  for (const article of allArticles) {
    if (article.id === targetArticleId) continue;
    
    // Check if any of the link patterns exist in the content
    const containsLink = linkPatterns.some(pattern => article.content.includes(pattern));
    
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

export function getHubArticles(keyword: string): Backlink[] {
  const allArticles = getAllArticles();
  const normalizedKeyword = slugify(keyword);
  const lowerKeyword = keyword.toLowerCase();
  
  const hubArticles: Backlink[] = [];

  for (const article of allArticles) {
    const hasTag = article.frontmatter.tags.some(tag => 
      slugify(tag) === normalizedKeyword || 
      tag.toLowerCase() === lowerKeyword
    );
    
    // Check if the content links to this keyword. e.g. [[Keyword]], [[keyword|alias]]
    // We use a regex to handle potential aliases and case-insensitivity
    const escapedKeyword = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wikilinkRegex = new RegExp(`\\[\\[${escapedKeyword}(\\|.*)?\\]\\]`, 'gi');
    const hasLink = wikilinkRegex.test(article.content);
    
    if (hasTag || hasLink) {
      hubArticles.push({
        sourceId: article.id,
        sourceTitle: article.frontmatter.title_th,
        sourceTitleEn: article.frontmatter.title_en,
        sourceTags: article.frontmatter.tags,
      });
    }
  }

  return hubArticles;
}
