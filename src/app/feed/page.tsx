import { getAllArticles } from "@/lib/content";
import Link from "next/link";
import { ACCENT } from "@/lib/design-tokens";

export default function FeedPage() {
  const articles = getAllArticles();
  
  // Sort by date descending
  const sorted = [...articles].sort((a, b) => 
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );

  return (
    <main className="min-h-screen bg-bg text-white pb-32">
      <header className="pt-24 pb-12 px-6 md:px-16 border-b border-white/10 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">Chronological Feed</h1>
        <p className="font-mono text-sm tracking-widest text-white/50">RECENT ADDITIONS TO THE ARCHIVE</p>
      </header>

      <div className="max-w-4xl mx-auto px-6 md:px-16 mt-16 relative">
        {/* Timeline line */}
        <div className="absolute left-6 md:left-16 top-0 bottom-0 w-px bg-white/10 ml-[3.5rem] md:ml-[4.5rem] z-0 hidden sm:block" />

        <div className="space-y-16">
          {sorted.map((article) => (
            <div key={article.id} className="relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-12 group">
              {/* Date Column */}
              <div className="sm:w-32 shrink-0 pt-2 sm:text-right hidden sm:block">
                <div className="font-mono text-sm tracking-widest text-accent mb-1">
                  {article.frontmatter.date.substring(0, 4)}
                </div>
                <div className="font-mono text-[10px] tracking-widest text-white/40">
                  {article.frontmatter.date.substring(5)}
                </div>
              </div>

              {/* Node on timeline */}
              <div className="absolute left-[3.5rem] md:left-[4.5rem] top-4 w-3 h-3 rounded-full bg-bg border border-white/20 group-hover:border-accent group-hover:bg-accent/20 transition-colors hidden sm:block -ml-[5px]" />

              {/* Mobile Date */}
              <div className="sm:hidden font-mono text-xs text-accent tracking-widest mb-[-1rem]">
                {article.frontmatter.date}
              </div>

              {/* Content Column */}
              <Link 
                href={`/article/${article.id}`}
                className="flex-1 block p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/15 transition-all"
              >
                <div className="font-mono text-[10px] tracking-widest text-white/30 mb-4 flex justify-between">
                  <span>{article.id}</span>
                  <span>{article.frontmatter.reading_time}</span>
                </div>
                
                <h2 className="font-thai text-2xl md:text-3xl font-medium leading-[1.3] text-white group-hover:text-accent transition-colors mb-2">
                  {article.frontmatter.title_th}
                </h2>
                
                <h3 className="font-serif text-lg text-white/60 italic mb-6">
                  {article.frontmatter.title_en}
                </h3>
                
                {article.frontmatter.description && (
                  <p className="font-thai text-white/70 leading-relaxed line-clamp-3 mb-6 text-sm md:text-base">
                    {article.frontmatter.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {article.frontmatter.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/5 text-[9px] font-mono tracking-widest text-white/50 uppercase rounded-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
