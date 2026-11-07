import { FeedView } from "@/components/feed/feed-view";
import { getAllArticles } from "@/lib/content";

export const dynamic = "force-static";

export default function FeedPage() {
  const articles = getAllArticles();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <FeedView articles={articles} />
    </main>
  );
}
