import React from "react";
import Link from "next/link";
import { getLOCFiles } from "@/lib/content";
import { Thai } from "@/components/thai";

export const dynamic = "force-static";

export default function LOCIndexPage() {
  const volumes = getLOCFiles();

  return (
    <main className="standard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="page-title mb-12">
        <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-3">
          The complete catalogue · {volumes.length} volumes
        </div>
        <h1 className="font-thai text-4xl sm:text-5xl lg:text-6xl font-medium text-[var(--text)] tracking-tight mb-4">
          สารบัญบทความ
        </h1>
        <p className="font-serif italic text-lg sm:text-xl text-[var(--secondary)] font-normal leading-relaxed">
          List of Contents · ช่องว่างที่ยังไม่ถูกเก็บรักษาคือส่วนหนึ่งของประวัติศาสตร์
        </p>
      </div>

      {/* Volume Grid */}
      <div className="volume-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
        {volumes.map((vol) => (
          <Link
            key={vol.slug}
            href={`/loc/${encodeURIComponent(vol.slug)}`}
            className="volume-card block bg-[var(--raised)] p-7 transition-all hover:bg-[var(--sunken)] hover:border-[var(--gold)] group"
          >
            <div className="meta font-mono text-xs text-[var(--gold)] tracking-wider uppercase mb-4">
              Volume {vol.volumeNumber || vol.slug.replace("List of Content ", "")}
            </div>
            <h2 className="font-thai text-xl font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors mb-8 leading-relaxed">
              <Thai>{vol.title}</Thai>
            </h2>
            <div className="progress-label flex justify-between font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] mb-2">
              <span>
                Archived {vol.archivedCount} / {vol.totalCount}
              </span>
              <b className="text-[var(--gold)] font-semibold">{vol.progressPercent}%</b>
            </div>
            <div className="progress-bar w-full h-[2px] bg-[var(--sunken)] overflow-hidden">
              <div
                className="h-full bg-[var(--gold)] transition-all duration-300"
                style={{ width: `${vol.progressPercent}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
