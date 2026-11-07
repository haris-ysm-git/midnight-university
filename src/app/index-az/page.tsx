import { IndexDirectory } from "@/components/index/index-directory";
import { getAllArticles, getAllTagNotes } from "@/lib/content";

export const dynamic = "force-static";

export default function AZIndexPage() {
  const articles = getAllArticles();
  const tagNotes = getAllTagNotes();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <IndexDirectory articles={articles} tagNotes={tagNotes} />
    </main>
  );
}
