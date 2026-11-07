export interface SearchArticleItem {
  id: string;
  type: "article";
  title_th: string;
  title_en: string;
  author: string;
  tags: string[];
  description: string;
}

export interface SearchKeywordItem {
  id: string;
  type: "keyword";
  title_th: string;
  title_en: string;
  author: string;
  tags: string[];
  description: string;
}

export interface SearchResultsPayload {
  articles: SearchArticleItem[];
  keywords: SearchKeywordItem[];
}

let cachedData: SearchResultsPayload | null = null;
let isLoading = false;

export async function initSearchIndex(): Promise<SearchResultsPayload | null> {
  if (cachedData) return cachedData;
  if (isLoading) return null;

  isLoading = true;
  try {
    const res = await fetch("/api/search");
    if (!res.ok) throw new Error("Search API error");
    const data = await res.json();
    cachedData = data;
    return cachedData;
  } catch (e) {
    console.error("Failed to load search data", e);
    return null;
  } finally {
    isLoading = false;
  }
}

export function performSearch(query: string): SearchResultsPayload {
  if (!query || !cachedData) {
    return { articles: [], keywords: [] };
  }

  const q = query.toLowerCase().trim();

  const matchedArticles = cachedData.articles.filter((a) => {
    return (
      a.id.includes(q) ||
      a.title_th.toLowerCase().includes(q) ||
      a.title_en.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const matchedKeywords = cachedData.keywords.filter((k) => {
    return (
      k.title_th.toLowerCase().includes(q) ||
      k.title_en.toLowerCase().includes(q) ||
      k.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return {
    articles: matchedArticles.slice(0, 12),
    keywords: matchedKeywords.slice(0, 6),
  };
}
