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
    <main className="standard-page">
      {/* ══ HEADER & VIEW TOGGLE ═══════════════════════════════════════════ */}
      <div className="title-row">
        <div className="page-title">
          <div className="meta">
            Chronological archive · {articles.length} entries
          </div>
          <h1>Feed</h1>
          <p>
            <Thai>ร่องรอยของบทความ เรียงตามเวลาที่ถูกบันทึก</Thai>
          </p>
        </div>

        {/* Segmented View Switcher */}
        <div className="segmented" aria-label="Feed view">
          {(["list", "calendar", "timeline"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={mode === item ? "active" : ""}
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
              />
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Year Scrub Strip */}
      <div className="mobile-year-scrub">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => scrollToYear(year)}
          >
            {year}
          </button>
        ))}
      </div>

      {/* ══ DENSITY HEATMAP STRIP ═══════════════════════════════════════════ */}
      <div className="density">
        <div className="density-label">
          <div className="meta">Year → month publication density</div>
          <span>
            Fewer <i /><i /><i /><i /> More
          </span>
        </div>
        <div className="density-grid">
          {years.slice(0, 9).map((year, yi) => (
            <div key={year} className="density-year">
              <button
                type="button"
                onClick={() => scrollToYear(year)}
              >
                {year}
              </button>
              {Array.from({ length: 12 }, (_, m) => {
                const count = monthDensity.get(`${year}-${m}`) || 0;
                const heatLevel =
                  count === 0 ? "heat" : count === 1 ? "heat heat-1" : count <= 3 ? "heat heat-2" : "heat heat-4";
                return (
                  <button
                    key={m}
                    aria-label={`${year}, month ${m + 1}`}
                    title={`${year}-${String(m + 1).padStart(2, "0")}: ${count} articles`}
                    className={heatLevel}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ══ MODE: LIST VIEW ═════════════════════════════════════════════════ */}
      {mode === "list" && (
        <div className="feed-list">
          {years.map((year) => {
            const list = yearGroups.get(year) || [];
            return (
              <section key={year} id={`year-${year}`} className="year-group">
                <div className="year-heading">
                  <h2>{year}</h2>
                  <div className="meta">
                    {list.length} {list.length === 1 ? "entry" : "entries"}
                  </div>
                </div>

                {list.map((a) => {
                  const isExpanded = expandedId === a.id;
                  const primaryTag = a.frontmatter.tags[0] || "Other";
                  const cat = getCategoryForTag(primaryTag);

                  return (
                    <article
                      key={a.id}
                      className={`feed-row ${isExpanded ? "expanded" : ""}`}
                    >
                      <button
                        type="button"
                        className="feed-summary"
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      >
                        <time>{a.frontmatter.date.substring(5)}</time>
                        <div className="meta">{a.id}</div>
                        <h3>
                          <Thai>{a.frontmatter.title_th}</Thai>
                        </h3>
                        <span
                          className="tag-dot"
                          style={{ backgroundColor: cat.color }}
                          title={cat.name}
                        />
                        <Icon name="chevron" />
                      </button>

                      {isExpanded && (
                        <div className="feed-detail">
                          {a.frontmatter.title_en && (
                            <em>{a.frontmatter.title_en}</em>
                          )}
                          {a.frontmatter.description && (
                            <p>
                              <Thai>{a.frontmatter.description}</Thai>
                            </p>
                          )}
                          {a.frontmatter.tags.length > 0 && (
                            <div className="tag-list">
                              {a.frontmatter.tags.map((tag) => (
                                <Link
                                  key={tag}
                                  href={`/keyword/${encodeURIComponent(tag)}`}
                                >
                                  {tag}
                                </Link>
                              ))}
                            </div>
                          )}
                          <div className="meta">
                            {a.frontmatter.reading_time} · {a.frontmatter.author || "Midnight University"}
                          </div>
                          <Link
                            href={`/article/${a.id}`}
                            className="text-link"
                          >
                            Read <Icon name="arrow" />
                          </Link>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}

      {/* ══ MODE: CALENDAR VIEW ═════════════════════════════════════════════ */}
      {mode === "calendar" && (
        <div className="calendar-view">
          {years.map((year) => {
            const list = yearGroups.get(year) || [];
            return (
              <section key={year}>
                <h2>{year}</h2>
                <div>
                  {Array.from({ length: 12 }, (_, m) => {
                    const monthArticles = list.filter(
                      (a) => parseInt(a.frontmatter.date.substring(5, 7), 10) - 1 === m
                    );
                    const monthName = new Date(2000, m).toLocaleString("en", {
                      month: "short",
                    });
                    const count = monthArticles.length;

                    return (
                      <button
                        key={m}
                        className={count > 0 ? "has-entry" : ""}
                        onClick={() => {
                          if (count > 0) {
                            setMode("list");
                            scrollToYear(year);
                          }
                        }}
                      >
                        <span>{monthName}</span>
                        <b>{count}</b>
                      </button>
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
        <div className="timeline-view">
          {years.map((year) => {
            const list = yearGroups.get(year) || [];
            return (
              <section key={year}>
                <h2>{year}</h2>
                <div>
                  {list.map((a) => (
                    <Link
                      key={a.id}
                      href={`/article/${a.id}`}
                    >
                      <div className="meta">
                        {a.id} · {a.frontmatter.date}
                      </div>
                      <strong>
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
    </main>
  );
}
