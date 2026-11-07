import React from "react";
import Link from "next/link";
import { getLOCFiles } from "@/lib/content";
import { Thai } from "@/components/thai";

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
        {volumes.map((vol) => (
          <Link
            key={vol.slug}
            href={`/loc/${encodeURIComponent(vol.slug)}`}
            className="volume-card"
          >
            <div className="meta">
              Volume {vol.volumeNumber || vol.slug.replace("List of Content ", "")}
            </div>
            <h2>
              <Thai>{vol.title}</Thai>
            </h2>
            <div className="progress-label">
              <span>
                Archived {vol.archivedCount} / {vol.totalCount}
              </span>
              <b>{vol.progressPercent}%</b>
            </div>
            <div className="progress-bar">
              <i style={{ width: `${vol.progressPercent}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
