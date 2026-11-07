import { Backlink } from "@/lib/backlinks";
import Link from "next/link";
import { Thai } from "@/components/thai";

export function BacklinksPanel({ backlinks }: { backlinks: Backlink[] }) {
  if (!backlinks || backlinks.length === 0) return null;

  return (
    <section className="mt-20 pt-12 border-t border-[var(--line)]">
      <div className="meta mb-8 flex items-center justify-between">
        <span>Linked References ({backlinks.length})</span>
        <span className="text-[9px] text-[var(--muted)]">Incoming mentions from vault</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {backlinks.map((link) => (
          <Link
            key={link.sourceId}
            href={`/article/${link.sourceId}`}
            className="block p-5 border border-[var(--line)] bg-[var(--raised)] hover:border-[var(--gold)] transition-all duration-200 group rounded-xs"
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--muted)] tracking-wider mb-2">
              <span className="text-[var(--gold)] font-medium">NO. {link.sourceId}</span>
              {link.sourceTags[0] && (
                <span className="uppercase tracking-widest text-[9px] opacity-70">
                  {link.sourceTags[0]}
                </span>
              )}
            </div>
            <h4 className="font-thai text-base text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors leading-snug line-clamp-2 font-medium mb-1">
              <Thai>{link.sourceTitle}</Thai>
            </h4>
            {link.sourceTitleEn && (
              <p className="font-serif text-xs text-[var(--secondary)] italic line-clamp-1">
                {link.sourceTitleEn}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
