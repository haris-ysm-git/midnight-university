import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/content';

export async function GET() {
  const articles = getAllArticles();
  
  // Return only the fields needed for searching to keep payload small
  const searchData = articles.map(a => ({
    id: a.id,
    title_th: a.frontmatter.title_th,
    title_en: a.frontmatter.title_en,
    tags: a.frontmatter.tags,
    description: a.frontmatter.description || a.content.substring(0, 5000),
  }));
  
  return NextResponse.json(searchData);
}
