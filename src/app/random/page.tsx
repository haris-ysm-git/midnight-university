import { RandomMosaic } from "@/components/random/random-mosaic";
import { getAllArticles, getAllTagNotes } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function RandomPage() {
  const articles = getAllArticles();
  const tagNotes = getAllTagNotes();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <RandomMosaic initialArticles={articles} tagNotes={tagNotes} />
    </main>
  );
}
