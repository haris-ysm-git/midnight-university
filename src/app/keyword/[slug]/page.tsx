import { getHubArticles } from "@/lib/backlinks";
import { getHubContent, getAllArticles, resolveObsidianLinks } from "@/lib/content";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

interface Props {
  params: Promise<{ slug: string }>;
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

export default async function KeywordHubPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).replace(/-/g, " ");
  
  const hubArticles = getHubArticles(decodedSlug);
  const hubRawContent = getHubContent(decodedSlug);
  const allArticles = getAllArticles();
  
  const resolvedContent = hubRawContent 
    ? resolveObsidianLinks(hubRawContent, allArticles)
    : null;

  return (
    <main className="min-h-screen bg-[#1A1A1A] text-white pb-32">
      <header className="pt-32 pb-16 px-6 md:px-16 max-w-4xl mx-auto border-b border-white/10">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#C8A882] mb-6 uppercase">
          Keyword Archive
        </div>
        <h1 className="font-thai text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.3] tracking-tight mb-4 text-white capitalize">
          {decodedSlug}
        </h1>
        <p className="font-serif text-white/50 text-sm md:text-base italic">
          Aggregated entries and knowledge mapping for this topic.
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-6 md:px-16 mt-16">
        {resolvedContent && (
          <div className="mb-20 pb-20 border-b border-white/5">
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
        )}

        <h2 className="font-mono text-[10px] tracking-[0.3em] text-[#C8A882] mb-12 uppercase">
          Related Articles ({hubArticles.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hubArticles.map((link) => (
            <Link 
              key={link.sourceId} 
              href={`/article/${link.sourceId}`}
              className="block p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#C8A882]/30 transition-all duration-500 group"
            >
              <div className="font-mono text-[10px] text-white/30 tracking-widest mb-4">
                {link.sourceId}
              </div>
              <div className="font-thai text-xl text-white group-hover:text-[#C8A882] transition-colors leading-snug mb-3 line-clamp-2 font-medium">
                {link.sourceTitle}
              </div>
              <div className="font-serif text-xs text-white/40 italic line-clamp-1 border-t border-white/5 pt-3">
                {link.sourceTitleEn}
              </div>
            </Link>
          ))}
          
          {hubArticles.length === 0 && !resolvedContent && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 text-white/20 font-mono text-xs tracking-widest">
              NO ENTRIES CURRENTLY MAPPED TO THIS KEYWORD
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
