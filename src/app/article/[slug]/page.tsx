import { getArticleById, getArticleBySlug, getAllArticles, resolveObsidianLinks } from "@/lib/content";
import { getBacklinksFor } from "@/lib/backlinks";
import { parseArticleZones } from "@/lib/zone-parser";
import { ArticleLayout } from "@/components/article-layout";
import { getMdxComponents } from "@/components/reader/mdx-components";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();

  // Support both 4-digit ID and slug
  const idParams = articles.map((article) => ({
    slug: article.id,
  }));

  const slugParams = articles.map((article) => ({
    slug: article.slug,
  }));

  return [...idParams, ...slugParams];
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // Try finding by canonical ID first, fallback to slug
  const article = getArticleById(decodedSlug) || getArticleBySlug(decodedSlug);

  if (!article) {
    notFound();
  }

  const allArticles = getAllArticles();
  const currentIndex = allArticles.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  const backlinks = getBacklinksFor(article.id);

  // 1. Parse zones from markdown structure
  const zones = parseArticleZones(article.content, article.id, article.rawPath);

  // 2. Resolve wikilinks on body markdown
  const resolvedBody = resolveObsidianLinks(zones.bodyMarkdown, allArticles, undefined, article.rawPath);

  // 3. Custom MDX components
  const mdxComponents = getMdxComponents();

  return (
    <ArticleLayout
      article={article}
      backlinks={backlinks}
      zones={zones}
      prevArticle={prevArticle}
      nextArticle={nextArticle}
    >
      <MDXRemote
        source={resolvedBody}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkBreaks],
          },
        }}
      />
    </ArticleLayout>
  );
}
