"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Article } from "@/lib/content";
import { ACCENT, BG, EASE, MONO, SERIF } from "@/lib/design-tokens";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", marginBottom: "7px", fontFamily: MONO }}>
    {children}
  </div>
);

export function EndlessScroll({ articles }: { articles: Article[] }) {
  const router = useRouter();
  
  const TOTAL = articles.length;
  const CLONES = Math.max(3, Math.ceil(24 / TOTAL)); 
  const N = TOTAL * CLONES; 
  const MIDDLE_ZONE_START = TOTAL * Math.floor(CLONES / 2);
  
  const looped = useMemo(() => {
    let arr: Article[] = [];
    for (let i = 0; i < CLONES; i++) {
      arr = [...arr, ...articles];
    }
    return arr;
  }, [articles, CLONES]);

  const [activeIndex, setActiveIndex] = useState(MIDDLE_ZONE_START);
  const [hoveredRealIdx, setHoveredRealIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const isTeleporting = useRef(false);
  const activeIdxRef = useRef(MIDDLE_ZONE_START);
  const touchStartY = useRef(0);

  useEffect(() => { activeIdxRef.current = activeIndex; }, [activeIndex]);

  const realIndex = activeIndex % TOTAL;
  const activeArticle = articles[realIndex];
  const progress = (realIndex + 1) / TOTAL;

  const applyLayout = useCallback((targetIdx: number) => {
    const container = scrollRef.current;
    const refItem = itemRefs.current[MIDDLE_ZONE_START];
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
  }, [MIDDLE_ZONE_START]);

  useLayoutEffect(() => {
    setTimeout(() => applyLayout(MIDDLE_ZONE_START), 50);
    const onResize = () => applyLayout(activeIdxRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyLayout, MIDDLE_ZONE_START]);

  const handleScroll = useCallback(() => {
    if (isTeleporting.current) return;
    const container = scrollRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    let closest = MIDDLE_ZONE_START, minDist = Infinity;
    itemRefs.current.forEach((item, i) => {
      if (!item) return;
      const ir = item.getBoundingClientRect();
      const dist = Math.abs(ir.top + ir.height / 2 - centerY);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveIndex(closest);
  }, [MIDDLE_ZONE_START]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const ZONE_START = MIDDLE_ZONE_START;
    const ZONE_END = MIDDLE_ZONE_START + TOTAL;
    if (activeIndex >= ZONE_START && activeIndex < ZONE_END) return;

    const targetIdx = ZONE_START + (activeIndex % TOTAL);
    const container = scrollRef.current;
    const item = itemRefs.current[targetIdx];
    if (!container || !item) return;

    isTeleporting.current = true;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2 });
    setActiveIndex(targetIdx);

    setTimeout(() => { isTeleporting.current = false; }, 100);
  }, [activeIndex, TOTAL, MIDDLE_ZONE_START]);

  const navigate = useCallback((delta: number) => {
    const targetIdx = activeIdxRef.current + delta;
    if (targetIdx < 0 || targetIdx >= N) return;
    const item = itemRefs.current[targetIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, [N]);

  const scrollToReal = useCallback((realIdx: number) => {
    const item = itemRefs.current[MIDDLE_ZONE_START + realIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, [MIDDLE_ZONE_START]);

  // Touch swipe for mobile
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
  }, [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); navigate(1); }
      else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); navigate(-1); }
      else if (e.key === "Enter") { 
        e.preventDefault(); 
        const currentReal = activeIdxRef.current % TOTAL;
        router.push(`/article/${articles[currentReal].id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, TOTAL, articles, router]);

  const allTags = articles.flatMap(a => a.frontmatter.tags);
  const uniqueTags = Array.from(new Set(allTags)).slice(0, 10);

  const handleTagClick = useCallback((tag: string) => {
    const indices = articles.map((a, i) => a.frontmatter.tags.includes(tag) ? i : -1).filter(i => i >= 0);
    const currentReal = activeIdxRef.current % TOTAL;
    const pos = indices.indexOf(currentReal);
    scrollToReal(pos >= 0 ? indices[(pos + 1) % indices.length] : indices[0]);
  }, [articles, scrollToReal, TOTAL]);

  if (!activeArticle) return null;

  return (
    <div className="w-full h-[80vh] min-h-[600px] flex flex-col overflow-hidden border-b border-white/10 relative" style={{ backgroundColor: BG, fontFamily: MONO, userSelect: "none" }}>
      
      {/* ══ MOBILE HEADER ═══════════════════════════════════════════════ */}
      <header className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/5 md:hidden relative z-20 bg-[#1A1A1A]">
        <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.5)" }}>CRITICAL&nbsp;FUTURES</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={realIndex}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)" }}
          >
            {String(realIndex + 1).padStart(3, "0")}&nbsp;·&nbsp;{String(TOTAL).padStart(3, "0")}
          </motion.div>
        </AnimatePresence>
      </header>

      {/* ══ DESKTOP HEADER ═══════════════════════════════════════════════ */}
      <header className="shrink-0 items-center justify-between px-10 py-4 border-b border-white/5 hidden md:flex relative z-20 bg-[#1A1A1A]">
        <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.45)" }}>CRITICAL&nbsp;FUTURES</div>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.22)" }}>ARTICLE&nbsp;ARCHIVE</div>
        <motion.div
          key={realIndex}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.45)" }}
        >
          {String(realIndex + 1).padStart(3, "0")}&nbsp;/&nbsp;{String(TOTAL).padStart(3, "0")}
        </motion.div>
      </header>

      {/* ══ LAYOUT ═══════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        
        {/* Crosshair at 50% (Desktop) */}
        <div className="absolute inset-x-0 pointer-events-none z-20 hidden md:block" style={{ top: "50%", borderTop: "1px solid rgba(255,255,255,0.04)" }} />
        
        {/* Crosshair at 50% (Mobile) */}
        <div className="absolute inset-x-0 pointer-events-none z-20 md:hidden" style={{ top: "50%", borderTop: "1px solid rgba(255,255,255,0.05)" }} />

        {/* Edge vignettes (Mobile) */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#1A1A1A] to-transparent z-10 pointer-events-none md:hidden" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1A1A1A] to-transparent z-10 pointer-events-none md:hidden" />

        {/* ── COL 1 · TAGS 15% (Desktop Only) ──────────────────────────────── */}
        <div className="shrink-0 hidden md:flex flex-col justify-center border-r border-white/5" style={{ width: "15%", padding: "0 36px" }}>
          <Label>TOPICS</Label>
          <div className="topics-scroll" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px", maxHeight: "60vh", overflowY: "auto", msOverflowStyle: "none", scrollbarWidth: "none" } as React.CSSProperties}>
            {uniqueTags.map((tag) => {
              const isActive = activeArticle.frontmatter.tags.includes(tag);
              const count = articles.filter(a => a.frontmatter.tags.includes(tag)).length;
              return (
                <motion.div
                  key={tag}
                  animate={{ opacity: isActive ? 1 : 0.2 }}
                  whileHover={{ opacity: isActive ? 1 : 0.55 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  onClick={() => handleTagClick(tag)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "11px", letterSpacing: "0.05em", color: isActive ? ACCENT : "#ffffff", marginBottom: "4px" }}>
                    {tag}
                  </div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)" }}>
                    {count}&nbsp;{count === 1 ? "article" : "articles"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── COL 2 · METADATA 15% (Desktop Only) ─────────────────────────────── */}
        <div className="shrink-0 hidden lg:flex flex-col justify-center border-r border-white/5" style={{ width: "15%", padding: "0 36px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.42, ease: EASE }}
            >
              <div style={{ marginBottom: "36px" }}>
                <Label>ID</Label>
                <div style={{ fontFamily: SERIF, fontSize: "40px", color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {activeArticle.id}
                </div>
              </div>
              <div style={{ marginBottom: "22px" }}>
                <Label>DATE</Label>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", lineHeight: 1.7 }}>
                  {activeArticle.frontmatter.date}
                </div>
              </div>
              <div style={{ marginBottom: "22px" }}>
                <Label>READ TIME</Label>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>
                  {activeArticle.frontmatter.reading_time}
                </div>
              </div>
              <div style={{ marginBottom: "22px" }}>
                <Label>AUTHOR</Label>
                <div style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.06em" }}>
                  {(activeArticle.frontmatter as any).author || "NA"}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── COL 3 · SCROLLABLE TITLES 50% ────────────────────── */}
        <div className="relative shrink-0 w-full md:w-[70%] lg:w-[50%] flex flex-col">
          {/* Vertical progress bar (Desktop) */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-white/5 z-10">
            <motion.div animate={{ height: `${progress * 100}%` }} transition={{ duration: 0.55, ease: EASE }} style={{ width: "1px", backgroundColor: ACCENT }} />
          </div>

          <div 
            ref={scrollRef} 
            style={{ height: "100%", overflowY: "scroll", scrollbarWidth: "none", msOverflowStyle: "none" }} 
            className="scrollbar-hide"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div ref={topSpacerRef} />

            {looped.map((article, i) => {
              const isActive = i === activeIndex;
              const realI = i % TOTAL;
              const isHovered = hoveredRealIdx === realI && !isActive;
              const author = (article.frontmatter as any).author || "NA";

              return (
                <div
                  key={i}
                  ref={el => { itemRefs.current[i] = el; }}
                  onClick={() => navigate(i - activeIdxRef.current)}
                  className="relative cursor-pointer md:px-12 md:py-8"
                  onMouseEnter={() => setHoveredRealIdx(realI)}
                  onMouseLeave={() => setHoveredRealIdx(null)}
                >
                  {/* --- MOBILE RENDER --- */}
                  <div className="md:hidden relative px-5 py-6">
                    <motion.div
                      animate={{ scaleY: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                      initial={false}
                      transition={{ duration: 0.42, ease: EASE }}
                      style={{ position: "absolute", left: 0, top: 24, bottom: 24, width: 2, backgroundColor: ACCENT, transformOrigin: "top", borderRadius: 1 }}
                    />
                    
                    <motion.div
                      animate={{ opacity: isActive ? 0.55 : 0.1 }}
                      transition={{ duration: 0.38, ease: EASE }}
                      className="flex justify-between items-center mb-3.5 font-mono text-[9px] tracking-widest text-white"
                    >
                      <span>{article.id}</span>
                      <span className="tracking-[0.14em]">{article.frontmatter.date}</span>
                    </motion.div>

                    <motion.div
                      animate={{ opacity: isActive ? 1 : 0.07 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="font-mono text-[11px] tracking-[0.1em] text-accent mb-2"
                    >
                      {author}
                    </motion.div>

                    <motion.div
                      animate={{ opacity: isActive ? 1 : 0.18 }}
                      transition={{ duration: 0.38, ease: EASE }}
                      className="font-thai text-4xl leading-none tracking-tight text-white line-clamp-2"
                    >
                      {article.frontmatter.title_th}
                    </motion.div>

                    <motion.div
                      animate={{ width: isActive ? 28 : 0, opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.38, ease: EASE }}
                      className="h-px bg-accent mt-2.5"
                    />

                    <motion.div
                      animate={{ opacity: isActive ? 1 : 0.06 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="mt-4"
                    >
                      <div className="flex justify-end flex-wrap gap-1.5">
                        {article.frontmatter.tags.slice(0, 3).map((tag, gi) => (
                          <motion.span
                            key={tag}
                            initial={false}
                            animate={{ opacity: isActive ? 1 : 0 }}
                            transition={{ delay: isActive ? gi * 0.07 : 0, duration: 0.3, ease: EASE }}
                            className="px-2.5 py-1 border border-accent/60 rounded-sm text-accent text-[8px] tracking-[0.18em] font-mono uppercase"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-3.5">
                        <span className="font-mono text-[9px] tracking-[0.14em] text-white/40 uppercase">
                          {article.frontmatter.reading_time}
                        </span>
                        <Link href={`/article/${article.id}`} className="font-mono text-[9px] tracking-[0.2em] text-white flex items-center gap-1.5">
                          READ <span className="text-accent text-xs">→</span>
                        </Link>
                      </div>
                    </motion.div>

                    <div className="absolute bottom-0 left-5 right-5 h-px bg-white/5" />
                  </div>

                  {/* --- DESKTOP RENDER --- */}
                  <motion.div
                    animate={{ opacity: isActive ? 1 : isHovered ? 0.5 : 0.17 }}
                    transition={{ duration: 0.38, ease: EASE }}
                    className="hidden md:block"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-[10px] tracking-widest text-white/35 pt-2 min-w-[28px] shrink-0">
                        {article.id}
                      </div>
                      <div>
                        <div className="font-thai font-medium text-4xl lg:text-5xl leading-[1.2] tracking-tight text-white mb-2 line-clamp-2">
                          {article.frontmatter.title_th}
                        </div>
                        <div className="font-serif text-lg text-white/60 italic">
                          {article.frontmatter.title_en}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 36 }}
                        transition={{ duration: 0.38, ease: EASE }}
                        style={{ height: "1px", backgroundColor: ACCENT, marginTop: "16px", marginLeft: "44px" }}
                      />
                    )}
                  </motion.div>
                </div>
              );
            })}

            <div ref={bottomSpacerRef} />
          </div>
        </div>

        {/* ── COL 4 · ACTION 20% (Desktop Only) ───────────────────────────────── */}
        <div className="shrink-0 hidden lg:flex flex-col justify-center border-l border-white/5" style={{ width: "20%", padding: "0 40px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.42, ease: EASE }}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Label>TAGS</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {activeArticle.frontmatter.tags.slice(0, 3).map((tag, gi) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.08, duration: 0.35, ease: EASE }}
                    style={{ padding: "6px 10px", border: `1px solid ${ACCENT}55`, borderRadius: "2px", color: ACCENT, fontSize: "9px", letterSpacing: "0.16em" }}
                  >
                    {tag.toUpperCase()}
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.35 }}
                style={{ marginTop: "60px" }}
              >
                <Link href={`/article/${activeArticle.id}`} className="block">
                  <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>READ ARTICLE</span>
                    <span style={{ color: ACCENT }}>→</span>
                  </div>
                  <motion.div
                    style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.18)", marginTop: "8px" }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
                  />
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ══ MOBILE FOOTER ═══════════════════════════════════════════════ */}
      <footer className="md:hidden shrink-0 border-t border-white/5 relative z-20 bg-[#1A1A1A]">
        <AnimatePresence mode="wait">
          <motion.div
            key={realIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="px-5 pt-2.5 flex justify-between items-center"
          >
            <span className="text-[9px] tracking-[0.14em] text-accent font-mono uppercase">
              {(activeArticle.frontmatter as any).author || "NA"}
            </span>
            <span className="text-[9px] tracking-[0.12em] text-white/30 font-mono uppercase">
              {activeArticle.frontmatter.tags[0]}&nbsp;·&nbsp;{activeArticle.frontmatter.reading_time}
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="px-5 py-2.5 pb-3.5 flex items-center gap-2.5">
          <div className="flex-1 relative h-0.5 bg-white/10 rounded-sm">
            <motion.div
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute left-0 top-0 h-full bg-accent rounded-sm"
            />
          </div>
          <div className="flex gap-[3px]">
            {articles.slice(0, 12).map((_, i) => ( // Show max 12 dots for space
              <motion.div
                key={i}
                animate={{ width: i === (realIndex % 12) ? 14 : 3, backgroundColor: i === (realIndex % 12) ? ACCENT : "rgba(255,255,255,0.2)" }}
                transition={{ duration: 0.35, ease: EASE }}
                className="h-[3px] rounded-sm cursor-pointer"
                onClick={() => scrollToReal(i)}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
