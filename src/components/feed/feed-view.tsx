"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Article } from "@/lib/content";
import { getCategoryForTag } from "@/lib/categories";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

interface FeedViewProps {
  articles: Article[];
}

export function FeedView({ articles }: FeedViewProps) {
  const [mode, setMode] = useState<"list" | "calendar" | "timeline">("list");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group articles by year
  const { yearGroups, years, monthDensity } = useMemo(() => {
    const groups = new Map<number, Article[]>();
    const densityMap = new Map<string, number>();

    for (const a of articles) {
      const year = parseInt(a.frontmatter.date.substring(0, 4), 10) || 2001;
      const month = parseInt(a.frontmatter.date.substring(5, 7), 10) - 1 || 0;

      if (!groups.has(year)) {
        groups.set(year, []);
      }
      groups.get(year)!.push(a);

      const key = `${year}-${month}`;
      densityMap.set(key, (densityMap.get(key) || 0) + 1);
    }

    // Sort years descending
    const sortedYears = Array.from(groups.keys()).sort((a, b) => b - a);

    // Sort articles within each year descending
    for (const y of sortedYears) {
      groups.get(y)!.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
    }

    return {
      yearGroups: groups,
      years: sortedYears,
      monthDensity: densityMap,
    };
  }, [articles]);

  const scrollToYear = (year: number) => {
    const el = document.getElementById(`year-${year}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="standard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ══ HEADER & VIEW TOGGLE ═══════════════════════════════════════════ */}
      <div className="title-row flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--line)] pb-8 mb-8 gap-6">
        <div className="page-title">
          <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-3">
            Chronological archive · {articles.length} entries
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[var(--text)] tracking-tight mb-4">
            Feed
          </h1>
          <p className="font-thai text-lg sm:text-xl text-[var(--secondary)] font-normal leading-relaxed">
            <Thai>ร่องรอยของบทความ เรียงตามเวลาที่ถูกบันทึก</Thai>
          </p>
        </div>

        {/* Segmented View Switcher */}
        <div className="segmented flex border border-[var(--line)] bg-[var(--sunken)] rounded-xs self-start sm:self-auto" aria-label="Feed view">
          {(["list", "calendar", "timeline"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                mode === item
                  ? "bg-[var(--gold)] text-[var(--bg)] font-medium"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              onClick={() => setMode(item)}
            >
              <Icon
                name={
                  item === "list"
                    ? "list"
                    : item === "calendar"
                    ? "calendar"
                    : "feed"
                }
                size={14}
              />
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Year Scrub Strip */}
      <div className="mobile-year-scrub flex gap-2 overflow-x-auto pb-4 mb-6 md:hidden">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => scrollToYear(year)}
            className="flex-shrink-0 border border-[var(--line)] px-3 py-1 font-mono text-xs text-[var(--gold)] rounded-xs"
          >
            {year}
          </button>
        ))}
      </div>

      {/* ══ DENSITY HEATMAP STRIP ═══════════════════════════════════════════ */}
      <div className="density border-t border-b border-[var(--line)] py-6 mb-12 hidden md:block">
        <div className="density-label flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            Year → month publication density
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">
            Fewer
            <i className="w-2 h-2 bg-[var(--gold)] opacity-20 inline-block" />
            <i className="w-2 h-2 bg-[var(--gold)] opacity-40 inline-block" />
            <i className="w-2 h-2 bg-[var(--gold)] opacity-65 inline-block" />
            <i className="w-2 h-2 bg-[var(--gold)] opacity-100 inline-block" />
            More
          </span>
        </div>
        <div className="density-grid grid gap-4 grid-cols-4 sm:grid-cols-6 lg:grid-cols-9">
          {years.slice(0, 9).map((year) => (
            <div key={year} className="density-year">
              <button
                type="button"
                onClick={() => scrollToYear(year)}
                className="font-mono text-[10px] text-[var(--secondary)] hover:text-[var(--gold)] block text-left mb-1.5"
              >
                {year}
              </button>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, m) => {
                  const count = monthDensity.get(`${year}-${m}`) || 0;
                  const heatLevel =
                    count === 0 ? "opacity-10" : count === 1 ? "opacity-35" : count <= 3 ? "opacity-65" : "opacity-100";
                  return (
                    <div
                      key={m}
                      title={`${year}-${String(m + 1).padStart(2, "0")}: ${count} articles`}
                      className={`h-2.5 bg-[var(--gold)] ${heatLevel} transition-opacity rounded-2xs`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MODE: LIST VIEW ═════════════════════════════════════════════════ */}
      {mode === "list" && (
        <div className="feed-list space-y-12">
          {years.map((year) => {
            const list = yearGroups.get(year) || [];
            return (
              <section key={year} id={`year-${year}`} className="year-group">
                <div className="year-heading">
                  <h2 className="font-serif text-3xl sm:text-4xl text-[var(--gold)] font-normal">
                    {year}
                  </h2>
                  <div className="meta font-mono text-xs text-[var(--muted)] tracking-wider mt-1">
                    {list.length} {list.length === 1 ? "entry" : "entries"}
                  </div>
                </div>

                <div className="divide-y divide-[var(--line)]">
                  {list.map((a) => {
                    const isExpanded = expandedId === a.id;
                    const primaryTag = a.frontmatter.tags[0] || "Other";
                    const cat = getCategoryForTag(primaryTag);

                    return (
                      <article
                        key={a.id}
                        className={`feed-row transition-colors ${
                          isExpanded ? "bg-[var(--raised)]" : "hover:bg-[var(--raised)]/40"
                        }`}
                      >
                        <button
                          type="button"
                          className="feed-summary w-full p-4 sm:p-5"
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        >
                          <time className="font-mono text-xs text-[var(--secondary)]">
                            {a.frontmatter.date.substring(5)}
                          </time>
                          <span className="font-mono text-xs text-[var(--gold)] font-semibold">
                            {a.id}
                          </span>
                          <h3 className="font-thai text-base sm:text-lg text-[var(--text)] font-normal leading-snug">
                            <Thai>{a.frontmatter.title_th}</Thai>
                          </h3>
                          <span
                            className="tag-dot inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                            title={cat.name}
                          />
                          <Icon
                            name="chevron"
                            size={14}
                            className={`transition-transform duration-200 opacity-60 ${
                              isExpanded ? "rotate-180 text-[var(--gold)]" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="feed-detail px-6 pb-6 pt-2">
                            {a.frontmatter.title_en && (
                              <em className="font-serif italic text-base text-[var(--gold)] block mb-3">
                                {a.frontmatter.title_en}
                              </em>
                            )}
                            {a.frontmatter.description && (
                              <p className="font-thai text-sm text-[var(--secondary)] leading-relaxed mb-4 max-w-3xl">
                                <Thai>{a.frontmatter.description}</Thai>
                              </p>
                            )}
                            {a.frontmatter.tags.length > 0 && (
                              <div className="tag-list flex flex-wrap gap-2 mb-4">
                                {a.frontmatter.tags.map((tag) => (
                                  <Link
                                    key={tag}
                                    href={`/keyword/${encodeURIComponent(tag)}`}
                                    className="font-mono text-[10px] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-xs hover:border-[var(--gold)] hover:text-[var(--gold)]"
                                  >
                                    {tag}
                                  </Link>
                                ))}
                              </div>
                            )}
                            <div className="meta font-mono text-xs text-[var(--muted)] tracking-wider mb-4">
                              {a.frontmatter.reading_time} · {a.frontmatter.author || "Midnight University"}
                            </div>
                            <Link
                              href={`/article/${a.id}`}
                              className="text-link inline-flex items-center gap-1.5 font-mono text-xs text-[var(--gold-bright)] hover:underline uppercase tracking-wider"
                            >
                              Read article <Icon name="arrow" size={12} />
                            </Link>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ══ MODE: CALENDAR VIEW ═════════════════════════════════════════════ */}
      {mode === "calendar" && (
        <div className="calendar-view border-t border-[var(--line)]">
          {years.map((year) => {
            const list = yearGroups.get(year) || [];
            return (
              <section
                key={year}
                className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-[var(--line)] py-8 gap-4"
              >
                <h2 className="font-serif text-3xl text-[var(--gold)]">{year}</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-12 gap-2">
                  {Array.from({ length: 12 }, (_, m) => {
                    const monthArticles = list.filter(
                      (a) => parseInt(a.frontmatter.date.substring(5, 7), 10) - 1 === m
                    );
                    const monthName = new Date(2000, m).toLocaleString("en", {
                      month: "short",
                    });
                    const hasEntries = monthArticles.length > 0;

                    return (
                      <div
                        key={m}
                        className={`p-3 border border-[var(--line)] rounded-xs ${
                          hasEntries ? "bg-[var(--gold)]/10 border-[var(--gold)]/40" : "opacity-40"
                        }`}
                      >
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] block">
                          {monthName}
                        </span>
                        <b className="font-serif text-2xl text-[var(--text)] block mt-2">
                          {monthArticles.length}
                        </b>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ══ MODE: TIMELINE VIEW ═════════════════════════════════════════════ */}
      {mode === "timeline" && (
        <div className="timeline-view max-w-3xl mx-auto py-8">
          {years.map((year) => {
            const list = yearGroups.get(year) || [];
            return (
              <section key={year} className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-4 mb-8">
                <h2 className="font-serif text-3xl text-[var(--gold)]">{year}</h2>
                <div className="border-l border-[var(--line)] pl-6 space-y-4">
                  {list.map((a) => (
                    <Link
                      key={a.id}
                      href={`/article/${a.id}`}
                      className="block p-5 border border-[var(--line)] bg-[var(--raised)]/40 hover:bg-[var(--raised)] hover:border-[var(--gold)] transition-colors rounded-xs group"
                    >
                      <div className="meta font-mono text-[10px] text-[var(--gold)] tracking-wider mb-1.5 uppercase">
                        {a.id} · {a.frontmatter.date}
                      </div>
                      <strong className="font-thai text-base text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors block leading-snug">
                        <Thai>{a.frontmatter.title_th}</Thai>
                      </strong>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
