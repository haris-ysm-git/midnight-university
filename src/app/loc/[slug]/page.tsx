import { getLOCBySlug, getLOCFiles, getAllArticles, resolveObsidianLinks } from "@/lib/content";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import remarkGfm from "remark-gfm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const volumes = getLOCFiles();
  return volumes.map((vol) => ({
    slug: vol.slug,
  }));
}

const components = {
  a: (props: any) => {
    const href = props.href;
    if (href?.startsWith('/')) {
      return (
        <Link href={href} {...props}>
          {props.children}
        </Link>
      );
    }
    return <a target="_blank" rel="noopener noreferrer" {...props} />;
  },
};

export default async function LOCVolumePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const volume = getLOCBySlug(decodedSlug);
  
  if (!volume) {
    notFound();
  }

  const allArticles = getAllArticles();
  
  // Convert basic \d{4} lines that aren't wrapped in [[ ]] to links if they match an article
  let processedContent = volume.content;
  
  // Find lines that start with 4 digits and don't have [[ ]]
  processedContent = processedContent.replace(/^(\d{4})\s+(.+)$/gm, (match, id, rest) => {
    // If it's already in a link or has [[ ]], skip
    if (match.includes('[[') || match.includes('](')) return match;
    
    // Check if we have an article with this ID
    const article = allArticles.find(a => a.id === id);
    if (article) {
      // Create a markdown link
      return `[${id} ${article.frontmatter.title_th}](/article/${id}) ${rest.replace(article.frontmatter.title_th, '')}`;
    }
    return match;
  });

  // Resolve standard [[wikilinks]]
  const resolvedContent = resolveObsidianLinks(processedContent, allArticles);

  return (
    <article className="min-h-screen bg-[#1A1A1A] text-white pb-32">
      <header className="pt-32 pb-16 px-6 md:px-16 max-w-4xl mx-auto border-b border-white/10">
        <Link 
          href="/loc"
          className="font-mono text-[10px] tracking-[0.2em] text-[#C8A882] hover:text-white transition-colors uppercase mb-8 inline-block"
        >
          ← Back to Contents
        </Link>
        <h1 className="font-thai text-4xl md:text-5xl font-semibold leading-[1.3] text-white mt-4">
          {volume.title}
        </h1>
        <div className="font-mono text-[10px] tracking-[0.2em] text-white/40 mt-6 uppercase">
          {volume.slug}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 md:px-16 mt-16">
        <div className="article-prose">
          <MDXRemote 
            source={resolvedContent} 
            components={components} 
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              }
            }}
          />
        </div>
      </div>
    </article>
  );
}
