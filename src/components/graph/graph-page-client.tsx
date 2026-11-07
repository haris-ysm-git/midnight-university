"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { GraphDataset, HubNodeData } from "@/lib/graph-data";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

interface GraphPageClientProps {
  dataset: GraphDataset;
}

export function GraphPageClient({ dataset }: GraphPageClientProps) {
  const { hubs, categories } = dataset;
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [minConnections, setMinConnections] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListView, setIsListView] = useState(false);

  // Filter hubs by category, min connections, and search query
  const filteredHubs = useMemo(() => {
    return hubs.filter((h) => {
      const matchCat = !activeCategory || h.category === activeCategory;
      const matchConn = h.count >= minConnections;
      const matchQuery = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchConn && matchQuery;
    });
  }, [hubs, activeCategory, minConnections, searchQuery]);

  const selectedHub = hubs.find((h) => h.id === selectedHubId) || null;

  return (
    <div className="graph-page standard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ══ TITLE ROW & VIEW TOGGLE ═════════════════════════════════════════ */}
      <div className="title-row flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--line)] pb-8 mb-8 gap-6">
        <div className="page-title">
          <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-3">
            The spatial network · {filteredHubs.length} hubs active
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[var(--text)] tracking-tight mb-4">
            Knowledge Graph
          </h1>
          <p className="font-thai text-lg sm:text-xl text-[var(--secondary)] font-normal leading-relaxed">
            <Thai>เริ่มจากศูนย์กลางความคิด แล้วค่อยขยายไปยังบทความ</Thai>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsListView(!isListView)}
          className="outline-button flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-mono text-xs text-[var(--gold)] hover:border-[var(--gold)] hover:bg-[var(--raised)] transition-colors uppercase tracking-wider self-start sm:self-auto"
        >
          <Icon name={isListView ? "graph" : "list"} size={14} />
          {isListView ? "Graph view" : "List view"}
        </button>
      </div>

      {/* ══ CONTROLS BAR ════════════════════════════════════════════════════ */}
      <div className="graph-controls grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-6 border-b border-[var(--line)] pb-6 mb-8 items-end">
        {/* Category Filter Chips */}
        <div className="category-filters flex flex-wrap gap-2">
          <button
            type="button"
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded-xs border transition-colors ${
              activeCategory === null
                ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)] font-medium"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--text)]"
            }`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded-xs border transition-colors flex items-center gap-1.5 ${
                activeCategory === c.name
                  ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)] font-medium"
                  : "border-[var(--line)] text-[var(--secondary)] hover:border-[var(--gold)]"
              }`}
              onClick={() => setActiveCategory(activeCategory === c.name ? null : c.name)}
            >
              <span style={{ color: activeCategory === c.name ? "var(--bg)" : c.color }}>
                {c.glyph}
              </span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Min. Connections Slider */}
        <label className="block">
          <span className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
            Min. connections <b className="text-[var(--gold)]">{minConnections}</b>
          </span>
          <input
            type="range"
            min="1"
            max="8"
            value={minConnections}
            onChange={(e) => setMinConnections(parseInt(e.target.value, 10))}
            className="w-full accent-[var(--gold)]"
          />
        </label>

        {/* Search Node Input */}
        <label className="graph-search flex items-center gap-2 border-b border-[var(--line-strong)] pb-1">
          <Icon name="search" size={14} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Find a node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
            >
              ✕
            </button>
          )}
        </label>
      </div>

      {/* ══ GRAPH VIEW VS LIST VIEW ═════════════════════════════════════════ */}
      {isListView ? (
        /* Accessible List View */
        <div className="graph-list divide-y divide-[var(--line)] border-t border-[var(--line)]">
          {filteredHubs.map((h) => (
            <div
              key={h.id}
              className="py-4 hover:bg-[var(--raised)]/40 transition-colors px-2"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedHubId(selectedHubId === h.id ? null : h.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base" style={{ color: h.color }}>
                    {h.glyph}
                  </span>
                  <strong className="font-serif text-lg text-[var(--text)] font-medium">
                    {h.name}
                  </strong>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    ({h.count} articles)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/keyword/${encodeURIComponent(h.name)}`}
                    className="font-mono text-[10px] uppercase text-[var(--gold)] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open Hub →
                  </Link>
                  <Icon
                    name="chevron"
                    size={14}
                    className={`transition-transform duration-200 opacity-60 ${
                      selectedHubId === h.id ? "rotate-180 text-[var(--gold)]" : ""
                    }`}
                  />
                </div>
              </div>

              {selectedHubId === h.id && h.articles.length > 0 && (
                <div className="mt-3 pl-8 space-y-2 border-l border-[var(--gold)]/40 ml-2">
                  {h.articles.map((art) => (
                    <div key={art.id} className="flex items-baseline justify-between py-1">
                      <Link
                        href={`/article/${art.id}`}
                        className="font-thai text-sm text-[var(--secondary)] hover:text-[var(--gold-bright)] hover:underline"
                      >
                        <span className="font-mono text-xs text-[var(--gold)] mr-2">{art.id}</span>
                        <Thai>{art.title}</Thai>
                      </Link>
                      <span className="font-mono text-[10px] text-[var(--muted)]">
                        {art.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Network Visualization */
        <div
          className={`network relative h-[650px] border border-[var(--line)] bg-[var(--sunken)]/60 rounded-xs overflow-hidden ${
            selectedHubId ? "has-selection" : ""
          }`}
        >
          {/* SVG Connecting Edges */}
          <svg className="w-full h-full inset-0 absolute pointer-events-none" aria-hidden="true">
            {filteredHubs.slice(0, 15).map((h, i) => {
              const target = filteredHubs[(i + 3) % filteredHubs.length];
              if (!target) return null;
              return (
                <line
                  key={`${h.id}-${target.id}`}
                  x1={`${h.x}%`}
                  y1={`${h.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke="rgba(201,168,124,0.18)"
                  strokeWidth="0.8"
                />
              );
            })}
          </svg>

          {/* Hub Nodes */}
          {filteredHubs.map((hub) => {
            const isSelected = selectedHubId === hub.id;
            const size = Math.min(68, Math.max(34, 30 + hub.count * 2.5));

            return (
              <button
                key={hub.id}
                type="button"
                className={`node group flex items-center justify-center rounded-full absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  isSelected ? "selected ring-4 ring-[var(--gold)] scale-110 z-30" : "z-10 hover:scale-105"
                }`}
                style={
                  {
                    left: `${hub.x}%`,
                    top: `${hub.y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: hub.color,
                    color: "var(--bg)",
                    opacity: selectedHubId && !isSelected ? 0.25 : 1,
                  } as React.CSSProperties
                }
                onClick={() => setSelectedHubId(isSelected ? null : hub.id)}
                title={`${hub.name} (${hub.count} articles)`}
              >
                <span className="font-mono text-xs font-bold pointer-events-none">
                  {hub.glyph}
                </span>
                <b className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-wider text-[var(--text)] whitespace-nowrap pointer-events-none bg-[var(--sunken)]/80 px-1 rounded-2xs">
                  {hub.name.length > 14 ? hub.name.substring(0, 12) + "…" : hub.name}
                </b>
              </button>
            );
          })}

          {/* Satellite Orbit for Selected Node */}
          {selectedHub && selectedHub.articles.length > 0 && (
            <div
              className="satellites absolute pointer-events-auto z-40"
              style={{
                left: `${selectedHub.x}%`,
                top: `${selectedHub.y}%`,
              }}
            >
              {selectedHub.articles.slice(0, 5).map((art, idx) => {
                const angle = (idx * 360) / Math.min(5, selectedHub.articles.length);
                const distance = 85;
                const rad = (angle * Math.PI) / 180;
                const ox = distance * Math.cos(rad);
                const oy = distance * Math.sin(rad);

                return (
                  <Link
                    key={art.id}
                    href={`/article/${art.id}`}
                    className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)] text-[var(--bg)] font-mono text-[9px] font-bold flex items-center justify-center shadow-lg hover:scale-125 transition-transform"
                    style={{
                      transform: `translate(${ox}px, ${oy}px)`,
                    }}
                    title={`${art.id}: ${art.title}`}
                  >
                    {art.id}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Zoom/Pan Hint */}
          <div className="zoom-hint absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-widest text-[var(--muted)] bg-[var(--sunken)]/90 px-3 py-1 border border-[var(--line)] rounded-xs">
            Select a hub to explore orbiting articles · Click node to inspect
          </div>
        </div>
      )}

      {/* ══ BOTTOM CATEGORY LEGEND ═════════════════════════════════════════ */}
      <div className="graph-legend flex flex-wrap gap-6 border-t border-[var(--line)] pt-6 mt-8">
        {categories.map((c) => (
          <span key={c.name} className="flex items-center gap-1.5 font-mono text-xs" style={{ color: c.color }}>
            <span>{c.glyph}</span>
            <i className="not-italic text-[var(--secondary)]">{c.name}</i>
          </span>
        ))}
      </div>
    </div>
  );
}
