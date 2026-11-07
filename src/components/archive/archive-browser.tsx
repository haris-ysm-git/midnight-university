"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article } from "@/lib/content";
import { CATEGORIES, CategoryMeta, getCategoryForTag } from "@/lib/categories";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

interface ArchiveBrowserProps {
  articles: Article[];
}

export function ArchiveBrowser({ articles }: ArchiveBrowserProps) {
  const router = useRouter();
  const [focus, setFocus] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelLock = useRef(false);

  // Filter articles if category selected
  const filteredArticles = selectedCategory
    ? articles.filter((a) =>
        a.frontmatter.tags.some(
          (t) => getCategoryForTag(t).name.toLowerCase() === selectedCategory.toLowerCase()
        )
      )
    : articles;

  const total = filteredArticles.length;
  const currentArticle = filteredArticles[focus % (total || 1)] || articles[0];

  const shift = useCallback(
    (delta: number) => {
      if (total <= 1) return;
      setFocus((prev) => (prev + delta + total) % total);
    },
    [total]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        shift(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        shift(-1);
      } else if (e.key === "Enter" && currentArticle) {
        router.push(`/article/${currentArticle.id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shift, currentArticle, router]);

  // Mouse wheel navigation with debounce lock
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) > 25) {
      wheelLock.current = true;
      shift(e.deltaY > 0 ? 1 : -1);
      setTimeout(() => {
        wheelLock.current = false;
      }, 200);
    }
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaY) > 40) {
      shift(deltaY < 0 ? 1 : -1);
    }
    touchStartY.current = null;
  };

  // Compute category counts
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

      {/* ══ 3-PANE ENDLESS LOOP BROWSER ══════════════════════════════════════ */}
      <section
        className="loop-browser"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Breadcrumb Header */}
        <div className="browser-top">
          <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--gold)]">
            {selectedCategory ? `${selectedCategory} Collection` : "Critical futures"}
          </div>
          <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
            Article archive
          </div>
          <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--gold)]">
            {String(((focus % total) + 1)).padStart(3, "0")} / {String(total).padStart(3, "0")}
          </div>
        </div>

        {/* Left Topic Rail */}
        <aside className="topic-rail">
          <div className="meta mb-6 font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            Topics
          </div>
          <button
            type="button"
            className={`w-full text-left transition-colors mb-4 ${
              selectedCategory === null
                ? "text-[var(--gold-bright)] font-semibold"
                : "text-[var(--secondary)] hover:text-[var(--gold)]"
            }`}
            onClick={() => {
              setSelectedCategory(null);
              setFocus(0);
            }}
          >
            All Articles
            <span className="block font-mono text-[9px] text-[var(--muted)] tracking-wider uppercase mt-1">
              {articles.length} articles
            </span>
          </button>
          {categoryCounts.map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={`w-full text-left transition-colors mb-4 ${
                selectedCategory === cat.name
                  ? "text-[var(--gold-bright)] font-semibold"
                  : "text-[var(--secondary)] hover:text-[var(--gold)]"
              }`}
              onClick={() => {
                setSelectedCategory(cat.name);
                setFocus(0);
              }}
            >
              <span className="inline-block mr-1.5 opacity-80" style={{ color: cat.color }}>
                {cat.glyph}
              </span>
              {cat.name}
              <span className="block font-mono text-[9px] text-[var(--muted)] tracking-wider uppercase mt-1">
                {cat.count} articles
              </span>
            </button>
          ))}
        </aside>

        {/* Center Endless Loop Track */}
        <div className="article-loop flex flex-col justify-center">
          {[-1, 0, 1].map((offset) => {
            const index = (focus + offset + total) % total;
            const a = filteredArticles[index];
            if (!a) return null;
            const isFocused = offset === 0;

            return (
              <article
                key={`${a.id}-${offset}`}
                className={`loop-item ${isFocused ? "focused" : ""}`}
                onClick={() => {
                  if (isFocused) {
                    router.push(`/article/${a.id}`);
                  } else {
                    shift(offset);
                  }
                }}
              >
                <div className="meta font-mono text-xs text-[var(--gold)] tracking-wider uppercase">
                  {a.id} · {a.frontmatter.date}
                </div>
                <h2 className="font-thai text-2xl md:text-3xl lg:text-4xl font-medium leading-[1.35] text-[var(--text)] mt-2 mb-1">
                  <Thai>{a.frontmatter.title_th}</Thai>
                </h2>
                {a.frontmatter.title_en && a.frontmatter.title_en !== a.frontmatter.title_th && (
                  <h3 className="font-serif italic text-base md:text-lg text-[var(--secondary)] mb-3">
                    {a.frontmatter.title_en}
                  </h3>
                )}
                {isFocused && (
                  <p className="font-thai text-sm md:text-base text-[var(--secondary)] leading-relaxed mt-4 max-w-2xl line-clamp-3">
                    <Thai>{a.frontmatter.description || ""}</Thai>
                  </p>
                )}
              </article>
            );
          })}
        </div>

        {/* Right Detail Rail */}
        <aside className="detail-rail">
          {currentArticle && (
            <>
              <div className="meta font-mono text-xs text-[var(--muted)] tracking-wider">
                {currentArticle.frontmatter.reading_time} ·{" "}
                <span className="text-[var(--gold)]">
                  {currentArticle.frontmatter.author && currentArticle.frontmatter.author !== "NA"
                    ? currentArticle.frontmatter.author
                    : "Midnight University"}
                </span>
              </div>

              {currentArticle.frontmatter.tags.length > 0 && (
                <div className="tag-list flex flex-wrap gap-2 my-4">
                  {currentArticle.frontmatter.tags.map((tag) => {
                    const cat = getCategoryForTag(tag);
                    return (
                      <Link
                        key={tag}
                        href={`/keyword/${encodeURIComponent(tag)}`}
                        className="px-2.5 py-1 text-xs border rounded-xs transition-colors"
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
                className="text-link mt-auto inline-flex items-center gap-2 text-sm font-mono text-[var(--gold-bright)] hover:underline uppercase tracking-wider"
              >
                Read article <Icon name="arrow" size={12} />
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
            className="flex items-center justify-center border border-[var(--line)] text-[var(--gold)] hover:border-[var(--gold)] hover:bg-[var(--raised)] w-10 h-10 transition-colors"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Next article"
            onClick={() => shift(1)}
            className="flex items-center justify-center border border-[var(--line)] text-[var(--gold)] hover:border-[var(--gold)] hover:bg-[var(--raised)] w-10 h-10 transition-colors"
          >
            ↓
          </button>
          <span className="meta font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] ml-3">
            Use arrow keys / j,k · Scroll or swipe
          </span>
        </div>
      </section>
    </div>
  );
}
