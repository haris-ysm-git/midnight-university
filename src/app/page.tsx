import { EndlessScroll } from "@/components/endless-scroll";
import { getAllArticles } from "@/lib/content";

export const dynamic = "force-static";

export default function Home() {
  const allArticles = getAllArticles();

  return (
    <div className="h-full bg-[var(--bg)] text-[var(--text)]">
      {/* Hero statement */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-serif text-[var(--gold)] mb-4">
          Midnight University
        </h1>
        <p className="text-lg text-[var(--secondary)]">
          กลางวันคือการเริ่มต้นเดินทางไปสู่ความมืด ส่วนกลางคืนคือจุดเริ่มต้นไปสู่ความสว่าง- เที่ยงวันคือจุดที่สว่างสุดแต่จะมืดลง เที่ยงคืนคือจุดที่มืดสุดแต่จะสว่างขึ้น
        </p>


      </div>
      <EndlessScroll articles={allArticles} />
    </div>
  );
}
