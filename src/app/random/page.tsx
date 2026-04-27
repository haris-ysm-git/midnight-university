import { getRandomParagraphs } from "@/lib/content";
import { RandomScroll } from "@/components/random-scroll";

export const dynamic = "force-dynamic"; // Ensure random on each reload

export default function RandomReadPage() {
  // Load 20 random paragraphs as requested
  const paragraphs = getRandomParagraphs(20);

  return (
    <main className="min-h-screen bg-[#1A1A1A]">
      <RandomScroll paragraphs={paragraphs} />
    </main>
  );
}
