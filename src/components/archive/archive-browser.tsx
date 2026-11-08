"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article } from "@/lib/content";
import { CATEGORIES, CategoryMeta, getCategoryForTag } from "@/lib/categories";
import { Thai } from "@/components/thai";
import { Icon } from "@/components/icons";

interface ArchiveBrowserProps {
  articles: Article[];
}

export function ArchiveBrowser({ articles }: ArchiveBrowserProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [focus, setFocus] = useState<number>(0);

  const loopRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const isUserScrolling = useRef<boolean>(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Filter articles by category if selected
  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter((a) =>
      a.frontmatter.tags.some((t) => getCategoryForTag(t).name === selectedCategory)
    );
  }, [articles, selectedCategory]);

  const total = filteredArticles.length;

  // We repeat the array 3 times for a seamless virtual infinite loop
  const CLONES = total > 0 ? 3 : 1;
  const MIDDLE_OFFSET = total;

  const currentArticle = filteredArticles[focus % Math.max(1, total)] || filteredArticles[0];

  // Scroll to focused index smoothly
  const scrollToIndex = useCallback((targetIndex: number, smooth = true) => {
    const el = itemRefs.current.get(targetIndex);
    const container = loopRef.current;
    if (!el || !container) return;

    const containerHeight = container.clientHeight;
    const itemTop = el.offsetTop;
    const itemHeight = el.offsetHeight;
    const targetScrollTop = itemTop - containerHeight / 2 + itemHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // Center on initial mount and when filter changes
  useEffect(() => {
    setFocus(0);
    const timer = setTimeout(() => {
      scrollToIndex(MIDDLE_OFFSET, false);
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedCategory, scrollToIndex, MIDDLE_OFFSET]);

  // Track scroll position to update active focused article
  const handleScroll = () => {
    const container = loopRef.current;
    if (!container || total === 0) return;

    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    const rect = container.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    let closestIndex = 0;
    let minDist = Infinity;

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const itemRect = el.getBoundingClientRect();
      const dist = Math.abs(itemRect.top + itemRect.height / 2 - centerY);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });

    const realFocus = closestIndex % total;
    setFocus(realFocus);

    // Infinite teleport when reaching top or bottom boundary
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    if (scrollTop < 50) {
      container.scrollTop += total * 140;
    } else if (scrollTop + clientHeight > scrollHeight - 50) {
      container.scrollTop -= total * 140;
    }

    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 150);
  };

  const shift = (delta: number) => {
    const nextFocus = (focus + delta + total) % total;
    setFocus(nextFocus);
    scrollToIndex(MIDDLE_OFFSET + nextFocus, true);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        shift(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        shift(-1);
      } else if (e.key === "Enter" && currentArticle) {
        e.preventDefault();
        router.push(`/article/${currentArticle.id}`);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focus, total, currentArticle, router]);

  // Category counts
  const categoryCounts = Object.values(CATEGORIES).map((cat: CategoryMeta) => {
    const count = articles.filter((a) =>
      a.frontmatter.tags.some((t) => getCategoryForTag(t).name === cat.name)
    ).length;
    return { ...cat, count };
  }).filter((c) => c.count > 0);

  if (!articles.length) {
    return (
      <div className="p-16 text-center font-mono text-sm text-[var(--muted)]">
        No articles found in archive.
      </div>
    );
  }

  return (
    <div className="archive-page">
      {/* ══ CANDLE-LIT STUDY HERO ═══════════════════════════════════════════ */}
      <section className="hero">
        <div className="meta">Digital memorial archive · Est. 1997</div>
        <h1>
          Midnight
          <br />
          University
        </h1>
        <h2>
          <Thai>กลางวันมืด กลางคืนกลับสว่าง</Thai>
        </h2>
        <div className="gold-rule" />
        <p>
          <Thai>
            พื้นที่เก็บรักษาความคิด บทสนทนา และความทรงจำทางสังคมของไทย
            เพื่อให้ความรู้ยังคงส่องสว่างในคืนที่มืดที่สุด
          </Thai>
        </p>
        <div className="hero-scroll">
          <span /> Scroll or explore the endless loop archive
        </div>
      </section>

      {/* ══ TOP BREADCRUMB HEADER (SIBLING OUTSIDE GRID) ══════════════════ */}
      <div className="browser-top">
        <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--gold)]">
          {selectedCategory ? `${selectedCategory} Collection` : "Critical futures"}
        </div>
        <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
          Article archive
        </div>
        <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--gold)] text-right">
          {String(((focus % total) + 1)).padStart(3, "0")} / {String(total).padStart(3, "0")}
        </div>
      </div>

      {/* ══ 3-PANE ENDLESS LOOP BROWSER ══════════════════════════════════════ */}
      <section className="loop-browser">
        {/* Left Topic Rail */}
        <aside className="topic-rail">
          <div className="meta">Topics</div>
          <button
            type="button"
            className={selectedCategory === null ? "active" : ""}
            onClick={() => {
              setSelectedCategory(null);
              setFocus(0);
            }}
          >
            All Articles
            <span>{articles.length} articles</span>
          </button>
          {categoryCounts.map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={selectedCategory === cat.name ? "active" : ""}
              onClick={() => {
                setSelectedCategory(cat.name);
                setFocus(0);
              }}
            >
              <span className="inline-block mr-1.5 opacity-80" style={{ color: cat.color }}>
                {cat.glyph}
              </span>
              {cat.name}
              <span>{cat.count} articles</span>
            </button>
          ))}
        </aside>

        {/* Center Fluid Endless Scroll Track */}
        <div
          ref={loopRef}
          className="article-loop overflow-y-auto scroll-smooth"
          onScroll={handleScroll}
        >
          {Array.from({ length: CLONES }).flatMap((_, loopRound) =>
            filteredArticles.map((a, i) => {
              const globalIdx = loopRound * total + i;
              const isFocused = focus === i;

              return (
                <article
                  key={`${a.id}-round-${loopRound}`}
                  ref={(el) => {
                    if (el) itemRefs.current.set(globalIdx, el);
                    else itemRefs.current.delete(globalIdx);
                  }}
                  className={`loop-item cursor-pointer transition-all duration-200 ${
                    isFocused ? "focused" : ""
                  }`}
                  onClick={() => {
                    if (isFocused) {
                      router.push(`/article/${a.id}`);
                    } else {
                      setFocus(i);
                      scrollToIndex(globalIdx, true);
                    }
                  }}
                >
                  <div className="meta">
                    {a.id} · {a.frontmatter.date}
                  </div>
                  <h2>
                    <Thai>{a.frontmatter.title_th}</Thai>
                  </h2>
                  {a.frontmatter.title_en && a.frontmatter.title_en !== a.frontmatter.title_th && (
                    <h3>{a.frontmatter.title_en}</h3>
                  )}
                  {isFocused && (
                    <p className="mt-3">
                      <Thai>{a.frontmatter.description || ""}</Thai>
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Right Detail Rail */}
        <aside className="detail-rail">
          {currentArticle && (
            <>
              <div className="meta">
                {currentArticle.frontmatter.reading_time} ·{" "}
                {currentArticle.frontmatter.author && currentArticle.frontmatter.author !== "NA"
                  ? currentArticle.frontmatter.author
                  : "Midnight University"}
              </div>

              {currentArticle.frontmatter.tags.length > 0 && (
                <div className="tag-list">
                  {currentArticle.frontmatter.tags.map((tag) => {
                    const cat = getCategoryForTag(tag);
                    return (
                      <Link
                        key={tag}
                        href={`/keyword/${encodeURIComponent(tag)}`}
                        style={{ borderColor: `${cat.color}40`, color: cat.color }}
                      >
                        <span className="opacity-70 mr-1">{cat.glyph}</span>
                        {tag}
                      </Link>
                    );
                  })}
                </div>
              )}

              <Link
                href={`/article/${currentArticle.id}`}
                className="text-link"
              >
                Read article <Icon name="arrow" />
              </Link>
            </>
          )}
        </aside>

        {/* Bottom Loop Controls */}
        <div className="loop-controls">
          <button
            type="button"
            aria-label="Previous article"
            onClick={() => shift(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Next article"
            onClick={() => shift(1)}
          >
            ↓
          </button>
          <div className="meta">Scroll / Swipe · Arrow keys</div>
        </div>
      </section>
    </div>
  );
}
