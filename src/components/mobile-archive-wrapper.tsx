"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Article } from "@/lib/content";
import { useRouter } from "next/navigation";

const ACCENT = "#C8A882";
const BG = "#1A1A1A";
const SERIF = '"Playfair Display", Georgia, serif';
const MONO = '"Roboto Mono", "Courier New", monospace';
const EASE: [number, number, number, number] = [0.2, 0.8, 0.4, 1];

interface ItemProps {
  article: Article;
  isActive: boolean;
  onClick: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

function ArticleItem({ article, isActive, onClick, itemRef }: ItemProps) {
  const router = useRouter();
  const author = (article.frontmatter as any).author || "";

  return (
    <div ref={itemRef} onClick={onClick} style={{ position: "relative", cursor: "pointer", padding: "0 20px" }}>

      {/* Left-edge accent bar */}
      <motion.div
        animate={{ scaleY: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
        initial={false}
        transition={{ duration: 0.42, ease: EASE }}
        style={{ position: "absolute", left: 0, top: 24, bottom: 24, width: 2, backgroundColor: ACCENT, transformOrigin: "top", borderRadius: 1 }}
      />

      <div style={{ paddingTop: 24, paddingBottom: 28 }}>

        {/* ROW 1 — index // date */}
        <motion.div
          animate={{ opacity: isActive ? 0.55 : 0.1 }}
          transition={{ duration: 0.38, ease: EASE }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontFamily: MONO }}
        >
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#ffffff" }}>{article.id}</span>
          <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "#ffffff" }}>{article.frontmatter.date}</span>
        </motion.div>

        {/* ROW 2 — author */}
        {author && author !== "NA" && (
          <motion.div
            animate={{ opacity: isActive ? 1 : 0.07 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: ACCENT, marginBottom: 8 }}
          >
            {author}
          </motion.div>
        )}

        {/* ROW 3 — title */}
        <motion.div
          animate={{ opacity: isActive ? 1 : 0.18 }}
          transition={{ duration: 0.38, ease: EASE }}
          style={{ fontFamily: SERIF, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.018em", color: "#ffffff" }}
        >
          {article.frontmatter.title_th}
        </motion.div>

        {/* Active underline */}
        <motion.div
          animate={{ width: isActive ? 28 : 0, opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.38, ease: EASE }}
          style={{ height: 1, backgroundColor: ACCENT, marginTop: 10 }}
        />

        {/* ROW 4 — tags + CTA */}
        <motion.div
          animate={{ opacity: isActive ? 1 : 0.06 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ marginTop: 18 }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 6 }}>
            {article.frontmatter.tags.slice(0, 3).map((tag, gi) => (
              <motion.span
                key={tag}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ delay: isActive ? gi * 0.07 : 0, duration: 0.3, ease: EASE }}
                style={{ padding: "5px 10px", border: `1px solid ${ACCENT}60`, borderRadius: 2, color: ACCENT, fontSize: 8, letterSpacing: "0.18em", fontFamily: MONO }}
              >
                {tag.toUpperCase()}
              </motion.span>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)" }}>
              {(article.frontmatter.reading_time || "").toUpperCase()}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/article/${article.id}`); }}
              style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", color: "#ffffff", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}
            >
              READ&nbsp;<span style={{ color: ACCENT, fontSize: 12 }}>→</span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.055)" }} />
    </div>
  );
}

export function MobileArchiveWrapper({ articles }: { articles: Article[] }) {
  const TOTAL = articles.length;
  const N = TOTAL * 3;

  const looped = useMemo(() => [...articles, ...articles, ...articles], [articles]);

  const [activeIndex, setActiveIndex] = useState(TOTAL);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const isTeleporting = useRef(false);
  const activeIdxRef = useRef(TOTAL);
  const touchStartY = useRef(0);

  useEffect(() => { activeIdxRef.current = activeIndex; }, [activeIndex]);

  const realIndex = activeIndex % TOTAL;
  const activeArticle = articles[realIndex];
  const progress = (realIndex + 1) / TOTAL;

  // ── Layout ────────────────────────────────────────────────────
  const applyLayout = useCallback((targetIdx: number) => {
    const container = scrollRef.current;
    const refItem = itemRefs.current[TOTAL];
    const topSpacer = topSpacerRef.current;
    const bottomSpacer = bottomSpacerRef.current;
    if (!container || !refItem || !topSpacer || !bottomSpacer) return;

    const ch = container.clientHeight;
    const ih = refItem.offsetHeight;
    const pad = Math.max(20, ch / 2 - ih / 2);

    topSpacer.style.height = `${pad}px`;
    bottomSpacer.style.height = `${pad}px`;

    const target = itemRefs.current[targetIdx];
    if (target) {
      container.scrollTo({ top: target.offsetTop - ch / 2 + target.offsetHeight / 2 });
    }
  }, [TOTAL]);

  useLayoutEffect(() => {
    setTimeout(() => applyLayout(TOTAL), 50);
    const onResize = () => applyLayout(activeIdxRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyLayout, TOTAL]);

  // ── Scroll detection ──────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (isTeleporting.current) return;
    const container = scrollRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    let closest = TOTAL, minDist = Infinity;
    itemRefs.current.forEach((item, i) => {
      if (!item) return;
      const ir = item.getBoundingClientRect();
      const dist = Math.abs(ir.top + ir.height / 2 - centerY);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveIndex(closest);
  }, [TOTAL]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // ── Seamless teleport ─────────────────────────────────────────
  useEffect(() => {
    if (activeIndex >= TOTAL && activeIndex < TOTAL * 2) return;

    const targetIdx = TOTAL + (activeIndex % TOTAL);
    const container = scrollRef.current;
    const item = itemRefs.current[targetIdx];
    if (!container || !item) return;

    isTeleporting.current = true;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2 });
    setActiveIndex(targetIdx);
    setTimeout(() => { isTeleporting.current = false; }, 100);
  }, [activeIndex, TOTAL]);

  // ── Navigation ────────────────────────────────────────────────
  const navigate = useCallback((delta: number) => {
    const targetIdx = activeIdxRef.current + delta;
    if (targetIdx < 0 || targetIdx >= N) return;
    const item = itemRefs.current[targetIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, [N]);

  const scrollToReal = useCallback((realIdx: number) => {
    const item = itemRefs.current[TOTAL + realIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, [TOTAL]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
  }, [navigate]);

  const dotCount = Math.min(TOTAL, 12);

  if (!activeArticle) return null;

  return (
    <div
      className="w-full flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 64px)", backgroundColor: BG, fontFamily: MONO, userSelect: "none" }}
    >
      {/* ══ HEADER ═══════════════════════════════════════════ */}
      <header
        className="shrink-0 flex items-center justify-between"
        style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "rgba(255,255,255,0.5)" }}>
          CRITICAL&nbsp;FUTURES
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={realIndex}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)" }}
          >
            {String(realIndex + 1).padStart(3, "0")}&nbsp;·&nbsp;{String(TOTAL).padStart(3, "0")}
          </motion.div>
        </AnimatePresence>
      </header>

      {/* ══ SCROLLABLE LIST ══════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden">

        {/* Center crosshair */}
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px solid rgba(255,255,255,0.05)", zIndex: 20, pointerEvents: "none" }} />

        {/* Edge vignettes */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, ${BG}, transparent)`, zIndex: 10, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to top, ${BG}, transparent)`, zIndex: 10, pointerEvents: "none" }} />

        <div
          ref={scrollRef}
          style={{ height: "100%", overflowY: "scroll", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div ref={topSpacerRef} />

          {looped.map((article, i) => (
            <ArticleItem
              key={i}
              article={article}
              isActive={i === activeIndex}
              onClick={() => navigate(i - activeIdxRef.current)}
              itemRef={el => { itemRefs.current[i] = el; }}
            />
          ))}

          <div ref={bottomSpacerRef} />
        </div>
      </div>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        <AnimatePresence mode="wait">
          <motion.div
            key={realIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ padding: "10px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ fontSize: 9, letterSpacing: "0.14em", color: ACCENT }}>
              {((activeArticle.frontmatter as any).author || "").toUpperCase()}
            </span>
            <span style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
              {(activeArticle.frontmatter.tags[0] || "").toUpperCase()}&nbsp;·&nbsp;{activeArticle.frontmatter.reading_time?.toUpperCase()}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar + dot scrubber */}
        <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, position: "relative", height: 2, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
            <motion.div
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.45, ease: EASE }}
              style={{ position: "absolute", left: 0, top: 0, height: "100%", backgroundColor: ACCENT, borderRadius: 2 }}
            />
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: dotCount }).map((_, i) => {
              const dotReal = realIndex % dotCount;
              return (
                <motion.div
                  key={i}
                  animate={{ width: i === dotReal ? 14 : 3, backgroundColor: i === dotReal ? ACCENT : "rgba(255,255,255,0.2)" }}
                  transition={{ duration: 0.35, ease: EASE }}
                  style={{ height: 3, borderRadius: 2, cursor: "pointer" }}
                  onClick={() => scrollToReal(i)}
                />
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
