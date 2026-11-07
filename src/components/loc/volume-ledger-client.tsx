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
    <div className="standard-page volume-page max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/loc"
        className="back-button inline-flex items-center gap-2 text-xs font-mono text-[var(--gold)] hover:underline uppercase tracking-wider mb-8"
      >
        <Icon name="back" size={14} /> All volumes
      </Link>

      <div className="page-title mb-10">
        <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-3">
          {volume.volumeNumber ? `Volume ${volume.volumeNumber}` : volume.slug} · {volume.archivedCount} / {volume.totalCount} archived ({volume.progressPercent}%)
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[var(--text)] tracking-tight mb-4">
          Archive ledger
        </h1>
        <p className="font-thai text-lg text-[var(--secondary)] leading-relaxed">
          <Thai>รายการบทความที่ได้รับการเก็บรักษา และตำแหน่งที่ยังคงรอการค้นพบ</Thai>
        </p>
      </div>

      {/* Filter Chips */}
      <div className="filter-row flex gap-2 mb-8 border-b border-[var(--line)] pb-4">
        {(["All", "Archived", "Not yet"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`px-4 py-1.5 font-mono text-xs uppercase tracking-wider rounded-xs border transition-colors ${
              filter === tab
                ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)] font-medium"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--text)]"
            }`}
            onClick={() => setFilter(tab)}
          >
            {tab}
            <span className="ml-1.5 opacity-70">
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
      <div className="ledger border-t border-[var(--line)] divide-y divide-[var(--line)]">
        {visibleItems.map((item, idx) => {
          if (item.isArchived) {
            return (
              <Link
                key={`${item.id}-${idx}`}
                href={`/article/${item.id}`}
                className="grid grid-cols-[20px_60px_1fr_120px] gap-4 sm:gap-6 items-center p-4 hover:bg-[var(--raised)] transition-colors group"
              >
                <span className="status-mark text-[var(--gold)] font-bold text-sm">●</span>
                <span className="font-mono text-xs text-[var(--gold)] font-semibold">
                  {item.id}
                </span>
                <strong className="font-thai text-sm sm:text-base font-normal text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors leading-snug">
                  <Thai>{item.title}</Thai>
                </strong>
                <span className="font-mono text-[10px] text-[var(--gold-pale)] uppercase tracking-wider text-right">
                  Read →
                </span>
              </Link>
            );
          }

          return (
            <div
              key={`${item.id}-${idx}`}
              className="grid grid-cols-[20px_60px_1fr_120px] gap-4 sm:gap-6 items-center p-4 opacity-40 text-[var(--secondary)]"
            >
              <span className="status-mark text-[var(--muted)] font-normal text-sm">◌</span>
              <span className="font-mono text-xs text-[var(--muted)]">{item.id}</span>
              <span className="font-thai text-sm sm:text-base font-normal leading-snug">
                <Thai>{item.title}</Thai>
              </span>
              <span className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider text-right">
                Not yet archived
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
