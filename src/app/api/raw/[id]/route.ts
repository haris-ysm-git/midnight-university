import { getArticleById } from "@/lib/content";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = getArticleById(id);

  if (!article) {
    notFound();
  }

  // Return raw Markdown as text/plain with UTF-8
  return new NextResponse(article.content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `inline; filename="${article.id}.md"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
