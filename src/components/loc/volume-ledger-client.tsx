"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LOCVolume } from "@/lib/content";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

interface VolumeLedgerClientProps {
  volume: LOCVolume;
}

export function VolumeLedgerClient({ volume }: VolumeLedgerClientProps) {
  const [filter, setFilter] = useState<"All" | "Archived" | "Not yet">("All");

  const visibleItems = volume.items.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Archived") return item.isArchived;
    return !item.isArchived;
  });

  return (
    <main className="standard-page volume-page">
      <Link href="/loc" className="back-button">
        <Icon name="back" /> All volumes
      </Link>

      <div className="page-title">
        <div className="meta">
          {volume.volumeNumber ? `Volume ${volume.volumeNumber}` : volume.slug} · {volume.archivedCount} / {volume.totalCount} archived ({volume.progressPercent}%)
        </div>
        <h1>Archive ledger</h1>
        <p>
          <Thai>รายการบทความที่ได้รับการเก็บรักษา และตำแหน่งที่ยังคงรอการค้นพบ</Thai>
        </p>
      </div>

      {/* Filter Chips */}
      <div className="filter-row">
        {(["All", "Archived", "Not yet"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`chip ${filter === tab ? "is-active" : ""}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
            <span style={{ marginLeft: "6px", opacity: 0.6 }}>
              (
              {tab === "All"
                ? volume.items.length
                : tab === "Archived"
                ? volume.archivedCount
                : volume.totalCount - volume.archivedCount}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Ledger Table Rows */}
      <div className="ledger border-t border-[var(--line)]">
        {visibleItems.map((row) => {
          if (row.isArchived) {
            return (
              <Link
                key={row.id}
                href={`/article/${row.id}`}
                className="ledger-row archived group"
              >
                <span className="status-mark">●</span>
                <span className="meta font-mono text-xs">{row.id}</span>
                <strong className="font-thai text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors">
                  <Thai>{row.title}</Thai>
                </strong>
                <span className="read-badge font-mono text-xs text-[var(--gold)] flex items-center justify-end gap-1">
                  Read ↗
                </span>
              </Link>
            );
          }

          return (
            <div
              key={row.id}
              className="ledger-row missing"
            >
              <span className="status-mark">◌</span>
              <span className="meta font-mono text-xs">{row.id}</span>
              <strong className="font-thai text-[var(--secondary)]">
                <Thai>{row.title}</Thai>
              </strong>
              <span className="missing-badge font-mono text-xs text-[var(--muted)] text-right">
                Not yet archived
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
