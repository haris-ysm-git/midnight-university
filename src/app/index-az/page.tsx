import { getAllArticles } from "@/lib/content";
import Link from "next/link";
import { ACCENT, BG } from "@/lib/design-tokens";

export default function AZIndexPage() {
  const articles = getAllArticles();
  
  // Group articles by first character (Thai or English)
  const grouped: Record<string, typeof articles> = {};
  
  articles.forEach(article => {
    let firstChar = article.frontmatter.title_th.charAt(0).toUpperCase();
    // Handle Thai vowels that might precede consonants (เ, แ, โ, ใ, ไ)
    if (['เ', 'แ', 'โ', 'ใ', 'ไ'].includes(firstChar) && article.frontmatter.title_th.length > 1) {
      firstChar = article.frontmatter.title_th.charAt(1).toUpperCase();
    }
    
    // Group english characters together or separate, depending on preference.
    // For now, we just use the raw first char.
    if (!grouped[firstChar]) {
      grouped[firstChar] = [];
    }
    grouped[firstChar].push(article);
  });

  // Sort groups alphabetically
  const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'th'));

  return (
    <main className="min-h-screen bg-bg text-white pb-32">
      <header className="pt-24 pb-12 px-6 md:px-16 border-b border-white/10 max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">A-Z Index</h1>
        <p className="font-mono text-sm tracking-widest text-white/50">ALPHABETICAL ARCHIVE DIRECTORY</p>
        
        {/* Quick Jump Bar */}
        <div className="flex flex-wrap gap-3 mt-12">
          {sortedKeys.map(key => (
            <a 
              key={key} 
              href={`#section-${key}`}
              className="w-8 h-8 flex items-center justify-center border border-white/20 rounded-sm font-thai hover:bg-white/10 hover:text-accent transition-colors text-sm"
            >
              {key}
            </a>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-16 mt-16">
        {sortedKeys.map(key => (
          <section key={key} id={`section-${key}`} className="mb-20 scroll-mt-32">
            <div className="flex items-end gap-6 mb-8 border-b border-white/10 pb-4">
              <h2 className="font-thai text-5xl md:text-6xl font-bold text-accent">{key}</h2>
              <div className="font-mono text-xs tracking-widest text-white/30 mb-2">
                {grouped[key].length} ENTRIES
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grouped[key].map(article => (
                <Link 
                  key={article.id} 
                  href={`/article/${article.id}`}
                  className="group block p-5 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all"
                >
                  <div className="font-mono text-[10px] tracking-widest text-white/30 mb-3">{article.id}</div>
                  <div className="font-thai text-lg leading-snug mb-1 group-hover:text-accent transition-colors line-clamp-2">
                    {article.frontmatter.title_th}
                  </div>
                  <div className="font-serif text-xs text-white/50 italic line-clamp-1">
                    {article.frontmatter.title_en}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
