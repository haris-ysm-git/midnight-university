import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-[10px] tracking-[0.3em] text-white/30 mb-8 uppercase">
        Error 404
      </div>

      <h1 className="font-serif text-6xl md:text-8xl text-white/10 mb-4 select-none" style={{ letterSpacing: "-0.04em" }}>
        404
      </h1>

      <p className="font-thai text-xl md:text-2xl text-white/70 mb-3 leading-relaxed">
        ไม่พบหน้าที่คุณกำลังมองหา
      </p>
      <p className="font-serif text-sm text-white/35 italic mb-12">
        The page you're looking for could not be found.
      </p>

      <div className="w-12 h-px bg-[#C8A882] mb-12" />

      <p className="font-mono text-[10px] tracking-[0.18em] text-white/30 mb-8 max-w-sm">
        หากคุณคลิกลิงก์จาก Graph View หน้านี้อาจเป็น Hub Note ที่ยังไม่มีบทความ
        <br /><br />
        This may be an empty hub note from the Knowledge Graph that has no article yet.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link
          href="/"
          className="font-mono text-[10px] tracking-[0.2em] text-white border border-white/15 px-6 py-3 hover:bg-white/5 transition-colors uppercase"
        >
          ← Back to Archive
        </Link>
        <Link
          href="/graph"
          className="font-mono text-[10px] tracking-[0.2em] text-[#C8A882] border border-[#C8A882]/30 px-6 py-3 hover:bg-[#C8A882]/5 transition-colors uppercase"
        >
          Open Graph View
        </Link>
      </div>
    </div>
  );
}
