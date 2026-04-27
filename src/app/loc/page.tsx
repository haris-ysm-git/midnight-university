import { getLOCFiles } from "@/lib/content";
import Link from "next/link";

export default function LOCIndexPage() {
  const volumes = getLOCFiles();

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white pt-32 pb-32">
      <div className="max-w-3xl mx-auto px-6 md:px-16">
        <header className="mb-16 border-b border-white/10 pb-12">
          <h1 className="font-thai text-4xl md:text-5xl font-semibold mb-4 text-[#e0e0e0]">
            สารบัญบทความ
          </h1>
          <p className="font-serif text-xl text-white/50 italic">
            List of Content (LOC)
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {volumes.map((vol) => (
            <Link 
              key={vol.slug} 
              href={`/loc/${vol.slug}`}
              className="group block p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#C8A882]/30 transition-all rounded-md"
            >
              <h2 className="font-thai text-2xl font-medium text-[#cccccc] group-hover:text-white transition-colors mb-2">
                {vol.title}
              </h2>
              <div className="font-mono text-[10px] tracking-[0.2em] text-[#C8A882] uppercase">
                {vol.slug.replace("List of Content ", "Volume ")}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
