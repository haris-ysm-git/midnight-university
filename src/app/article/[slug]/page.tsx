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

export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = getAllArticles();

  const params: { slug: string }[] = [];

  for (const article of articles) {
    // 1. Canonical 4-digit ID (e.g. "0002", "0811", "1177")
    params.push({ slug: article.id });

    // 2. Short English slug (< 30 chars) to avoid Windows MAX_PATH limits
    if (article.slug && article.slug !== article.id && article.slug.length < 30) {
      params.push({ slug: article.slug });
    }

    // 3. Unpadded numeric string (e.g. "2", "811")
    const num = parseInt(article.id, 10);
    if (!isNaN(num)) {
      const numStr = String(num);
      if (numStr !== article.id) {
        params.push({ slug: numStr });
      }
    }
  }

  return params;
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    decodedSlug = slug;
  }

  // Multi-pass tolerant resolution: canonical ID -> slug -> raw slug -> title
  const article =
    getArticleById(decodedSlug) ||
    getArticleBySlug(decodedSlug) ||
    getArticleById(slug) ||
    getArticleBySlug(slug);

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
