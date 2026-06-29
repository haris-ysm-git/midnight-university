import { getRandomParagraphs, getTagNames } from "@/lib/content";
import { NewspaperGrid } from "@/components/newspaper-grid";
// RandomScroll is preserved below but hidden — kept for reference.
// import { RandomScroll } from "@/components/random-scroll";

export const dynamic = "force-dynamic"; // Ensure random on each reload

export default function RandomReadPage() {
  // Load 30 random paragraphs for the newspaper grid
  const paragraphs = getRandomParagraphs(30);
  const tags = getTagNames();

  return (
    <main className="min-h-screen bg-[#1A1A1A]">
      {/* ── Newspaper Edition ─────────────────────────── */}
      <NewspaperGrid paragraphs={paragraphs} tags={tags} />

      {/* ── Legacy: endless scroll (hidden, preserved) ── */}
      {/* <div style={{ display: "none" }}>
        <RandomScroll paragraphs={paragraphs} />
      </div> */}
    </main>
  );
}
