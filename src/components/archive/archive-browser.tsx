"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Article } from "@/lib/content";
import { CATEGORIES, CategoryMeta, getCategoryForTag } from "@/lib/categories";
import { getArticleSnippets } from "@/lib/excerpt";
import { Thai } from "@/components/thai";
import { Icon } from "@/components/icons";

const SETTLE_ENABLED = true;
const EASE_BEZIER = [0.16, 1, 0.3, 1] as const;

interface ArchiveBrowserProps {
  articles: Article[];
}

export function ArchiveBrowser({ articles }: ArchiveBrowserProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter articles by category if selected
  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter((a) =>
      a.frontmatter.tags.some((t) => getCategoryForTag(t).name === selectedCategory)
    );
  }, [articles, selectedCategory]);

  const TOTAL = filteredArticles.length;
  const CLONES = Math.max(3, Math.ceil(24 / Math.max(1, TOTAL)));
  const N = TOTAL * CLONES;
  const MIDDLE_START = TOTAL * Math.floor(CLONES / 2);

  const looped = useMemo(() => {
    let arr: Article[] = [];
    for (let i = 0; i < CLONES; i++) {
      arr = [...arr, ...filteredArticles];
    }
    return arr;
  }, [filteredArticles, CLONES]);

  const [activeIndex, setActiveIndex] = useState(MIDDLE_START);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);

  const isTeleporting = useRef(false);
  const activeIdxRef = useRef(MIDDLE_START);
  const scrollRafId = useRef<number | null>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const settleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeIdxRef.current = activeIndex;
  }, [activeIndex]);

  const realIndex = TOTAL > 0 ? (activeIndex % TOTAL + TOTAL) % TOTAL : 0;
  const activeArticle = filteredArticles[realIndex] || filteredArticles[0];
  const progressPercent = TOTAL > 0 ? ((realIndex + 1) / TOTAL) * 100 : 0;

  // Category counts
  const categoryCounts = useMemo(() => {
    return Object.values(CATEGORIES)
      .map((cat: CategoryMeta) => {
        const count = articles.filter((a) =>
          a.frontmatter.tags.some((t) => getCategoryForTag(t).name === cat.name)
        ).length;
        return { ...cat, count };
      })
      .filter((c) => c.count > 0);
  }, [articles]);

  // Determine active category for topic rail highlight
  const activeArticleCategory = useMemo(() => {
    if (!activeArticle) return null;
    for (const tag of activeArticle.frontmatter.tags) {
      const cat = getCategoryForTag(tag);
      if (categoryCounts.some((c) => c.name === cat.name)) {
        return cat.name;
      }
    }
    return null;
  }, [activeArticle, categoryCounts]);

  // Snippets for active article (card & detail)
  const activeSnippets = useMemo(() => {
    if (!activeArticle) return { cardSnippet: "", detailSnippet: "" };
    return getArticleSnippets(activeArticle.content, activeArticle.frontmatter.title_th);
  }, [activeArticle]);

  // Layout initialization & recompute spacers
  const applyLayout = useCallback(
    (targetIdx: number) => {
      const container = scrollRef.current;
      const refItem = itemRefs.current[MIDDLE_START] || itemRefs.current[0];
      const topSpacer = topSpacerRef.current;
      const bottomSpacer = bottomSpacerRef.current;
      if (!container || !refItem || !topSpacer || !bottomSpacer) return;

      const ch = container.clientHeight;
      const ih = refItem.offsetHeight || 160;
      const pad = Math.max(20, ch / 2 - ih / 2);

      topSpacer.style.height = `${pad}px`;
      bottomSpacer.style.height = `${pad}px`;

      const target = itemRefs.current[targetIdx];
      if (target) {
        container.scrollTo({
          top: target.offsetTop - ch / 2 + target.offsetHeight / 2,
          behavior: "instant",
        });
      }
    },
    [MIDDLE_START]
  );

  // Mount & Resize
  useEffect(() => {
    applyLayout(MIDDLE_START);
    setActiveIndex(MIDDLE_START);

    const container = scrollRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      applyLayout(activeIdxRef.current);
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [applyLayout, MIDDLE_START, selectedCategory]);

  // Teleport jump logic
  const checkTeleport = useCallback(() => {
    if (isTeleporting.current) return;
    const current = activeIdxRef.current;
    const container = scrollRef.current;
    if (!container || TOTAL === 0) return;

    const isOutsideMiddle = current < MIDDLE_START || current >= MIDDLE_START + TOTAL;
    const isAtEdge = current <= 1 || current >= N - 2;

    if (isOutsideMiddle || isAtEdge) {
      const targetIdx = MIDDLE_START + ((current % TOTAL + TOTAL) % TOTAL);
      const currentItem = itemRefs.current[current];
      const targetItem = itemRefs.current[targetIdx];

      if (currentItem && targetItem) {
        const ch = container.clientHeight;
        const currentTargetCenter = currentItem.offsetTop - ch / 2 + currentItem.offsetHeight / 2;
        const offsetFromCenter = container.scrollTop - currentTargetCenter;

        isTeleporting.current = true;
        const newTop = targetItem.offsetTop - ch / 2 + targetItem.offsetHeight / 2 + offsetFromCenter;
        container.scrollTo({ top: newTop, behavior: "instant" });
        setActiveIndex(targetIdx);

        // Ignore scroll events during jump
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isTeleporting.current = false;
          });
        });
      }
    }
  }, [MIDDLE_START, TOTAL, N]);

  // Smooth settle logic
  const checkSettle = useCallback(() => {
    if (!SETTLE_ENABLED || isTeleporting.current) return;
    const container = scrollRef.current;
    if (!container) return;

    const current = activeIdxRef.current;
    const item = itemRefs.current[current];
    if (!item) return;

    const ch = container.clientHeight;
    const targetTop = item.offsetTop - ch / 2 + item.offsetHeight / 2;
    const diff = Math.abs(container.scrollTop - targetTop);

    if (diff > 8 && diff < ch) {
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  }, []);

  // Passive scroll listener throttled with rAF
  const handleScroll = useCallback(() => {
    if (isTeleporting.current) return;

    if (scrollRafId.current !== null) {
      cancelAnimationFrame(scrollRafId.current);
    }

    scrollRafId.current = requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const maxDistance = rect.height * 2;

      let closest = activeIdxRef.current;
      let minDist = Infinity;

      // Test items within 2 container heights
      for (let i = 0; i < N; i++) {
        const item = itemRefs.current[i];
        if (!item) continue;
        const ir = item.getBoundingClientRect();
        const distFromCenter = Math.abs(ir.top + ir.height / 2 - centerY);

        if (distFromCenter < maxDistance && distFromCenter < minDist) {
          minDist = distFromCenter;
          closest = i;
        }
      }

      if (closest !== activeIdxRef.current) {
        setActiveIndex(closest);
      }

      // Handle idle teleport (120ms) and soft settle (180ms)
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(checkTeleport, 120);

      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(checkSettle, 180);
    });
  }, [N, checkTeleport, checkSettle]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (scrollRafId.current !== null) cancelAnimationFrame(scrollRafId.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [handleScroll]);

  // Smooth scroll to specific index
  const scrollToIndex = useCallback((targetIdx: number, behavior: ScrollBehavior = "smooth") => {
    if (targetIdx < 0 || targetIdx >= N) return;
    const container = scrollRef.current;
    const item = itemRefs.current[targetIdx];
    if (!container || !item) return;

    const ch = container.clientHeight;
    container.scrollTo({
      top: item.offsetTop - ch / 2 + item.offsetHeight / 2,
      behavior,
    });
  }, [N]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        document.querySelector(".search-overlay")
      ) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollToIndex(activeIdxRef.current + 1, "smooth");
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollToIndex(activeIdxRef.current - 1, "smooth");
      } else if (e.key === "Enter") {
        if (activeArticle) {
          e.preventDefault();
          router.push(`/article/${activeArticle.id}`);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scrollToIndex, activeArticle, router]);

  if (articles.length === 0) {
    return (
      <div className="p-16 text-center font-mono text-sm text-[var(--muted)]">
        No articles found in archive.
      </div>
    );
  }

  const dotCount = Math.min(TOTAL, 12);

  return (
    <div className="archive-page flex flex-col h-[calc(100dvh-68px)] max-h-[calc(100dvh-68px)] max-md:h-[calc(100dvh-58px)] max-md:max-h-[calc(100dvh-58px)] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* ══ DIVIDER STRIP (48px) ════════════════════════════════════════════ */}
      <div className="browser-top flex items-center justify-between h-12 px-6 md:px-10 border-b border-[var(--line)] shrink-0 z-10 bg-[var(--bg)]">
        <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--gold)]">
          {selectedCategory ? `${selectedCategory} Collection` : "Critical futures"}
        </div>
        <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
          Article archive
        </div>
        <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--gold)] text-right">
          {TOTAL > 0 ? String(realIndex + 1).padStart(3, "0") : "000"} / {String(TOTAL).padStart(3, "0")}
        </div>
      </div>

      {/* ══ 3-COLUMN LOOP BROWSER ═══════════════════════════════════════════ */}
      <section className="loop-browser flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[240px_1fr_280px] relative overflow-hidden">
        {/* ── Left Topic Rail (Desktop) ─────────────────────────────────── */}
        <aside className="topic-rail hidden md:block p-5 border-r border-[var(--line)] overflow-y-auto thin-scrollbar">
          <div className="meta font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-3">
            Topics
          </div>
          <button
            type="button"
            className={selectedCategory === null ? "active" : ""}
            onClick={() => setSelectedCategory(null)}
          >
            <span className="flex items-center">
              {selectedCategory === null && <span className="dot-marker" />}
              All Articles
            </span>
            <span className="font-mono text-[10px] text-[var(--muted)]">{articles.length}</span>
          </button>

          {categoryCounts.map((cat) => {
            const isCategorySelected = selectedCategory === cat.name;
            const isArticleInCat = selectedCategory === null && activeArticleCategory === cat.name;
            const isHighlighted = isCategorySelected || isArticleInCat;

            return (
              <button
                key={cat.name}
                type="button"
                className={isHighlighted ? "active" : ""}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span className="flex items-center">
                  {isHighlighted && <span className="dot-marker" />}
                  <span className="inline-block mr-1.5 opacity-80" style={{ color: cat.color }}>
                    {cat.glyph}
                  </span>
                  {cat.name}
                </span>
                <span className="font-mono text-[10px] text-[var(--muted)]">{cat.count}</span>
              </button>
            );
          })}
        </aside>

        {/* ── Centre Native Free-Scroll Scroller Track ───────────────────── */}
        <div className="relative flex-1 min-h-0 h-full overflow-hidden">
          <div
            ref={scrollRef}
            tabIndex={0}
            aria-label="Endless Article Loop"
            className="article-loop h-full overflow-y-scroll outline-none scrollbar-hide"
          >
            <div ref={topSpacerRef} />

            {looped.map((a, i) => {
              const cloneRound = Math.floor(i / TOTAL);
              const isMiddleCopy = cloneRound === Math.floor(CLONES / 2);
              const isActive = activeIndex === i;
              const isHovered = hoveredIdx === i;

              const opacity = isActive ? 1 : isHovered ? 0.5 : 0.17;
              const snippets = getArticleSnippets(a.content, a.frontmatter.title_th);

              return (
                <article
                  key={`${cloneRound}-${a.id}`}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  aria-hidden={!isMiddleCopy}
                  onClick={() => {
                    if (!isActive) scrollToIndex(i, "smooth");
                  }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`loop-item transition-opacity cursor-pointer border-b border-[var(--line)] ${
                    isActive ? "focused" : ""
                  }`}
                  style={{
                    opacity,
                    transitionDuration: "0.38s",
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    padding: "32px 48px",
                    paddingRight: "56px",
                  }}
                >
                  <div className="max-w-[760px]">
                    <div className="meta font-mono text-xs text-[var(--gold)] mb-2 flex items-center justify-between">
                      <span>
                        {a.id} · {a.frontmatter.date}
                      </span>
                      {a.frontmatter.author && a.frontmatter.author !== "NA" && (
                        <span className="md:hidden font-mono text-[10px] text-[var(--secondary)]">
                          {a.frontmatter.author}
                        </span>
                      )}
                    </div>

                    <h2 className="font-thai text-xl md:text-3xl font-medium leading-[1.4] text-[var(--text)]">
                      <Thai>{a.frontmatter.title_th}</Thai>
                    </h2>

                    {/* Active growing gold line (36px) */}
                    <div
                      className="h-[1px] bg-[var(--gold)] mt-3 transition-transform duration-380 origin-left"
                      style={{
                        width: "36px",
                        transform: isActive ? "scaleX(1)" : "scaleX(0)",
                        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />

                    {a.frontmatter.title_en && a.frontmatter.title_en !== a.frontmatter.title_th && (
                      <h3 className="font-serif italic text-sm md:text-base text-[var(--secondary)] line-clamp-1 mt-2">
                        {a.frontmatter.title_en}
                      </h3>
                    )}

                    {snippets.cardSnippet && (
                      <p className="font-thai text-sm text-[var(--secondary)] line-clamp-2 mt-3 leading-relaxed">
                        <Thai>{snippets.cardSnippet}</Thai>
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-4">
                      {isActive ? (
                        <Link
                          href={`/article/${a.id}`}
                          tabIndex={isMiddleCopy ? 0 : -1}
                          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors"
                        >
                          Read article <Icon name="arrow" size={12} />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
                          Read article <Icon name="arrow" size={12} />
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-[var(--muted)]">
                        {a.frontmatter.reading_time}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}

            <div ref={bottomSpacerRef} />
          </div>

          {/* Up/Down buttons (Right edge of centre column, vertically centred) */}
          <div className="loop-controls hidden md:flex flex-col gap-2 absolute right-3 top-1/2 -translate-y-1/2 z-20">
            <button
              type="button"
              aria-label="Previous article"
              onClick={() => scrollToIndex(activeIdxRef.current - 1, "smooth")}
              className="w-8 h-8 rounded-xs border border-[var(--line)] bg-[var(--bg)]/90 hover:border-[var(--gold)] text-[var(--gold)] flex items-center justify-center transition-colors shadow-md"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Next article"
              onClick={() => scrollToIndex(activeIdxRef.current + 1, "smooth")}
              className="w-8 h-8 rounded-xs border border-[var(--line)] bg-[var(--bg)]/90 hover:border-[var(--gold)] text-[var(--gold)] flex items-center justify-center transition-colors shadow-md"
            >
              ↓
            </button>
          </div>
        </div>

        {/* ── Right Metadata Panel (Desktop) ────────────────────────────── */}
        <aside className="detail-rail hidden md:flex flex-col gap-5 p-6 border-l border-[var(--line)] overflow-y-auto thin-scrollbar">
          <AnimatePresence mode="wait">
            {activeArticle && (
              <motion.div
                key={activeArticle.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-5 h-full"
              >
                <div className="meta font-mono text-xs text-[var(--muted)]">
                  {activeArticle.frontmatter.reading_time} ·{" "}
                  {activeArticle.frontmatter.author && activeArticle.frontmatter.author !== "NA"
                    ? activeArticle.frontmatter.author
                    : "Midnight University"}
                </div>

                {activeArticle.frontmatter.tags.length > 0 && (
                  <div className="tag-list flex flex-wrap gap-2">
                    {activeArticle.frontmatter.tags.map((tag) => {
                      const cat = getCategoryForTag(tag);
                      return (
                        <Link
                          key={tag}
                          href={`/keyword/${encodeURIComponent(tag)}`}
                          className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider border rounded-xs transition-colors hover:border-[var(--gold)]"
                          style={{ borderColor: `${cat.color}40`, color: cat.color }}
                        >
                          <span className="opacity-70 mr-1">{cat.glyph}</span>
                          {tag}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {activeSnippets.detailSnippet && (
                  <p className="font-thai text-xs text-[var(--secondary)] leading-relaxed">
                    <Thai>{activeSnippets.detailSnippet}</Thai>
                  </p>
                )}

                <div className="mt-auto pt-6 border-t border-[var(--line)]">
                  <Link
                    href={`/article/${activeArticle.id}`}
                    className="text-link flex items-center justify-between text-sm font-mono text-[var(--gold)] hover:text-[var(--gold-bright)] uppercase tracking-wider"
                  >
                    <span>Read Article</span>
                    <Icon name="arrow" size={14} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </section>

      {/* ══ MOBILE BOTTOM BAR ═══════════════════════════════════════════════ */}
      <footer className="mobile-bottom-bar md:hidden border-t border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shrink-0 z-20">
        <div className="flex items-center justify-between font-mono text-[10px] text-[var(--gold)] mb-2">
          <span className="truncate max-w-[180px]">
            {activeArticle?.frontmatter.author && activeArticle.frontmatter.author !== "NA"
              ? activeArticle.frontmatter.author
              : "MIDNIGHT UNIVERSITY"}
          </span>
          <span className="text-[var(--muted)]">
            {(activeArticle?.frontmatter.tags[0] || "").toUpperCase()} ·{" "}
            {activeArticle?.frontmatter.reading_time?.toUpperCase()}
          </span>
        </div>

        {/* Progress Bar & Dots */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-[var(--line)] relative overflow-hidden rounded-full">
            <div
              className="h-full bg-[var(--gold)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: dotCount }).map((_, i) => {
              const isActiveDot = i === (realIndex % dotCount);
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Jump to article ${i + 1}`}
                  onClick={() => scrollToIndex(MIDDLE_START + i, "smooth")}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    isActiveDot ? "w-3 bg-[var(--gold)]" : "w-1 bg-[var(--line-strong)]"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
