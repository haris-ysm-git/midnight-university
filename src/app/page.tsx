import { EndlessScroll } from "@/components/endless-scroll";
import { MobileArchiveWrapper } from "@/components/mobile-archive-wrapper";
import { HeroStatement } from "@/components/hero-statement";
import { getAllArticles } from "@/lib/content";

export default function Home() {
  const allArticles = getAllArticles();

  // Shuffle and limit to 40 articles for performance
  const shuffled = [...allArticles].sort(() => 0.5 - Math.random());
  const articles = shuffled.slice(0, 40);

  return (
    <main className="min-h-screen flex flex-col bg-[#1A1A1A]">
      {/* Desktop: hero + 4-col endless scroll */}
      <div className="hidden md:flex flex-col flex-1">
        <HeroStatement />
        {articles.length > 0 ? (
          <EndlessScroll articles={articles} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50 font-mono text-sm">
            No articles found in archive.
          </div>
        )}
      </div>

      {/* Mobile: full-screen MobileArchive layout (matches Figma exactly) */}
      <div className="md:hidden flex-1">
        {articles.length > 0 ? (
          <MobileArchiveWrapper articles={articles} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50 font-mono text-sm p-8 text-center">
            No articles found in archive.
          </div>
        )}
      </div>
    </main>
  );
}
