import { getArticleById, getArticleBySlug, getAllArticles, resolveObsidianLinks } from "@/lib/content";
import { getBacklinksFor } from "@/lib/backlinks";
import { ArticleLayout } from "@/components/article-layout";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import remarkGfm from "remark-gfm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  
  // We want to build routes for both IDs and Slugs to ensure links don't break
  const idParams = articles.map((article) => ({
    slug: article.id,
  }));
  
  const slugParams = articles.map((article) => ({
    slug: article.slug,
  }));

  return [...idParams, ...slugParams];
}

const components = {
  a: (props: any) => {
    const href = props.href;
    // Handle internal routing
    if (href?.startsWith('/')) {
      return (
        <Link href={href} {...props}>
          {props.children}
        </Link>
      );
    }
    return <a target="_blank" rel="noopener noreferrer" {...props} />;
  },
  // We can add custom components here
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  // Try finding by ID first, then fallback to Slug
  const article = getArticleById(decodedSlug) || getArticleBySlug(decodedSlug);
  
  if (!article) {
    notFound();
  }

  const backlinks = getBacklinksFor(article.id);
  const allArticles = getAllArticles();
  
  // Resolve [[wikilinks]] before passing to MDX
  const resolvedContent = resolveObsidianLinks(article.content, allArticles);

  return (
    <ArticleLayout article={article} backlinks={backlinks}>
      <MDXRemote 
        source={resolvedContent} 
        components={components} 
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          }
        }}
      />
    </ArticleLayout>
  );
}
