import { Backlink } from "@/lib/backlinks";
import Link from "next/link";
import { ACCENT, BG } from "@/lib/design-tokens";

export function BacklinksPanel({ backlinks }: { backlinks: Backlink[] }) {
  if (!backlinks || backlinks.length === 0) return null;

  return (
    <div className="mt-24 pt-12 border-t border-white/10">
      <h3 className="font-mono text-xs tracking-[0.2em] text-white/50 mb-8">
        LINKED REFERENCES
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {backlinks.map((link) => (
          <Link 
            key={link.sourceId} 
            href={`/article/${link.sourceId}`}
            className="block p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 group"
          >
            <div className="font-mono text-[10px] text-white/30 tracking-widest mb-3">
              {link.sourceId}
            </div>
            <div className="font-thai text-lg text-white group-hover:text-accent transition-colors leading-snug mb-2 line-clamp-2">
              {link.sourceTitle}
            </div>
            <div className="font-serif text-xs text-white/50 italic line-clamp-1">
              {link.sourceTitleEn}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
