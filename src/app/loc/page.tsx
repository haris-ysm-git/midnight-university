import React from "react";
import Link from "next/link";
import { getLOCFiles } from "@/lib/content";
import { computeVolumeInfo } from "@/lib/volume-gradient";

export const dynamic = "force-static";

export default function LOCIndexPage() {
  const volumes = getLOCFiles();

  return (
    <main className="standard-page">
      <div className="page-title">
        <div className="meta">
          The complete catalogue · {volumes.length} volumes
        </div>
        <h1>
          สารบัญบทความ
        </h1>
        <p>
          List of Contents · ช่องว่างที่ยังไม่ถูกเก็บรักษาคือส่วนหนึ่งของประวัติศาสตร์
        </p>
      </div>

      {/* Volume Grid */}
      <div className="volume-grid">
        {volumes.map((vol) => {
          // Parse start-end range from slug e.g. "List of Content 0201-0400"
          const match = vol.slug.match(/(\d{4})-(\d{4})/);
          const start = match ? parseInt(match[1], 10) : 0;
          const end = match ? parseInt(match[2], 10) : 0;

          // Parse volume number from '## สารบัญที่ N'
          const numMatch = vol.content.match(/##\s*สารบัญที่\s*(\d+)/);
          const volNumber = numMatch
            ? parseInt(numMatch[1], 10)
            : Math.floor(start / 200) + 1;

          const info = computeVolumeInfo(start, end, volNumber);
          const volLabel = `VOLUME ${String(volNumber).padStart(2, "0")}`;

          const startStr = start.toString().padStart(4, "0");
          const endStr = end.toString().padStart(4, "0");
          // en dash with thin spaces
          const rangeDisplay = `${startStr}\u2009–\u2009${endStr}`;

          const totalWeight = info.tagMix.reduce((s, t) => s + t.count, 0);

          return (
            <Link
              key={vol.slug}
              href={`/loc/${encodeURIComponent(vol.slug)}`}
              className="volume-card flex flex-col justify-between"
              style={{
                background: info.gradient,
              }}
            >
              <div>
                <div className="meta font-mono text-[11px] tracking-[0.1em] text-[var(--gold)] uppercase">
                  {volLabel}
                </div>
                <h2
                  className="font-serif text-[clamp(2rem,3.2vw,2.9rem)] leading-[1.2] text-[var(--text)] my-3"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {rangeDisplay}
                </h2>
              </div>

              <div className="mt-auto pt-4">
                {/* Tag mix bar or NOT ARCHIVED YET */}
                {info.isNeutral ? (
                  <div className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider py-1">
                    NOT ARCHIVED YET
                  </div>
                ) : (
                  <>
                    <div
                      className="w-full h-[4px] flex overflow-hidden rounded-none mb-2"
                      style={{ background: "rgba(255, 255, 255, 0.08)" }}
                    >
                      {info.tagMix.map((t, idx) => {
                        const weight = totalWeight > 0 ? (t.count / totalWeight) * 100 : 0;
                        return (
                          <div
                            key={idx}
                            style={{
                              width: `${weight}%`,
                              backgroundColor: t.color,
                            }}
                            className="h-full"
                          />
                        );
                      })}
                    </div>
                    {/* Legend of at most 3 items */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                      {info.tagMix.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span
                            className="text-[10px] leading-none"
                            style={{ color: t.color }}
                            aria-hidden="true"
                          >
                            {t.glyph}
                          </span>
                          <span className="font-mono text-[10px] uppercase text-[var(--secondary)]">
                            {t.tag}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--muted)]">
                            {t.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Progress bar and label */}
                <div className="progress-label flex justify-between font-mono text-[9px] text-[var(--muted)] uppercase tracking-[0.08em]">
                  <span>
                    Archived {vol.archivedCount} / {vol.totalCount}
                  </span>
                  <b className="text-[var(--gold)] font-bold">{vol.progressPercent}%</b>
                </div>
                <div className="progress-bar mt-2 h-[2px] bg-[var(--sunken)] w-full overflow-hidden">
                  <i
                    className="block h-full bg-[var(--gold)] transition-all duration-300"
                    style={{ width: `${vol.progressPercent}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
