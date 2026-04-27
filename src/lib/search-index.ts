import { Document } from 'flexsearch';

export interface SearchResult {
  id: string;
  title_th: string;
  title_en: string;
  description: string;
  tags: string[];
}

let searchIndex: any = null;
let searchStore: Map<string, SearchResult> = new Map();
let isBuilt = false;

export async function initSearchIndex() {
  if (isBuilt) return;

  searchIndex = new Document({
    document: {
      id: 'id',
      index: ['title_th', 'title_en', 'description', 'tags'],
    },
    tokenize: 'full',
  });

  try {
    const res = await fetch('/api/search');
    const articles: SearchResult[] = await res.json();
    
    articles.forEach((article) => {
      const doc = {
        id: article.id,
        title_th: article.title_th,
        title_en: article.title_en,
        description: article.description,
        tags: article.tags.join(' '),
      };
      
      searchIndex.add(doc);
      searchStore.set(article.id, article);
    });
    
    isBuilt = true;
  } catch (e) {
    console.error("Failed to build search index", e);
  }
}

export function searchArticles(query: string): SearchResult[] {
  if (!query || !isBuilt) return [];
  
  const results = searchIndex.search(query, 10);
  
  const uniqueIds = new Set<string>();
  
  results.forEach((result: any) => {
    result.result.forEach((id: string) => {
      uniqueIds.add(id);
    });
  });

  const searchResults: SearchResult[] = [];
  uniqueIds.forEach(id => {
    const item = searchStore.get(id);
    if (item) searchResults.push(item);
  });

  return searchResults;
}
