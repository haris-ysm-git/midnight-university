import { NextResponse } from "next/server";
import { getAllArticles, getAllTagNotes } from "@/lib/content";

export async function GET() {
  const articles = getAllArticles();
  const tagNotes = getAllTagNotes();

  // Return search index data: articles + tag notes
  const searchArticles = articles.map((a) => ({
    id: a.id,
    type: "article" as const,
    title_th: a.frontmatter.title_th,
    title_en: a.frontmatter.title_en,
    author: a.frontmatter.author || "",
    tags: a.frontmatter.tags,
    description: a.frontmatter.description || a.content.substring(0, 300),
  }));

  const searchKeywords = tagNotes.map((n) => ({
    id: n.slug,
    type: "keyword" as const,
    title_th: n.title,
    title_en: n.aliases.join(", "),
    author: n.type || "concept",
    tags: n.aliases,
    description: `Keyword archive: ${n.title}`,
  }));

  return NextResponse.json({
    articles: searchArticles,
    keywords: searchKeywords,
  });
}
