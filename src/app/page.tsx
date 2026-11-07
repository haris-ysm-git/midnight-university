import { ArchiveBrowser } from "@/components/archive/archive-browser";
import { getAllArticles } from "@/lib/content";

export const dynamic = "force-static";

export default function Home() {
  const allArticles = getAllArticles();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <ArchiveBrowser articles={allArticles} />
    </main>
  );
}
