import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { articles } from "../data/articles";

// ─── Design Tokens ────────────────────────────────────────────
const ACCENT  = "#C8A882";
const BG      = "#1A1A1A";
const SERIF   = '"Playfair Display", Georgia, serif';
const MONO    = '"Roboto Mono", "Courier New", monospace';
const EASE: [number, number, number, number] = [0.2, 0.8, 0.4, 1];

// ─── Infinite-loop constants ──────────────────────────────────
const TOTAL = articles.length;   // 12
const N     = TOTAL * 3;         // 36  — [clone | real | clone]

// ─── Unified Mobile Article Item ──────────────────────────────
interface ItemProps {
  article: (typeof articles)[0];
  isActive: boolean;
  onClick: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

function ArticleItem({ article, isActive, onClick, itemRef }: ItemProps) {
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

        {/* ROW 1 — index · vol // date */}
        <motion.div
          animate={{ opacity: isActive ? 0.55 : 0.1 }}
          transition={{ duration: 0.38, ease: EASE }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontFamily: MONO }}
        >
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#ffffff" }}>{article.index}</span>
          <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "#ffffff" }}>{article.volume}&nbsp;//&nbsp;{article.date}</span>
        </motion.div>

        {/* ROW 2 — author */}
        <motion.div
          animate={{ opacity: isActive ? 1 : 0.07 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: ACCENT, marginBottom: 8 }}
        >
          {article.author}
        </motion.div>

        {/* ROW 3 — title (the "driver") */}
        <motion.div
          animate={{ opacity: isActive ? 1 : 0.18 }}
          transition={{ duration: 0.38, ease: EASE }}
          style={{ fontFamily: SERIF, fontSize: 38, lineHeight: 1.0, letterSpacing: "-0.022em", color: "#ffffff" }}
        >
          {article.title}
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
            {article.genres.map((genre, gi) => (
              <motion.span
                key={genre}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ delay: isActive ? gi * 0.07 : 0, duration: 0.3, ease: EASE }}
                style={{ padding: "5px 10px", border: `1px solid ${ACCENT}60`, borderRadius: 2, color: ACCENT, fontSize: 8, letterSpacing: "0.18em", fontFamily: MONO }}
              >
                {genre.toUpperCase()}
              </motion.span>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)" }}>
              {article.readTime.toUpperCase()}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>
              READ&nbsp;<span style={{ color: ACCENT, fontSize: 12 }}>→</span>
            </span>
          </div>
        </motion.div>

      </div>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.055)" }} />
    </div>
  );
}

// ─── Main Mobile Archive ──────────────────────────────────────
export function MobileArchive() {
  const looped = useMemo(() => [...articles, ...articles, ...articles], []);

  const [activeIndex, setActiveIndex] = useState(TOTAL); // start in middle zone

  const scrollRef       = useRef<HTMLDivElement>(null);
  const itemRefs        = useRef<(HTMLDivElement | null)[]>([]);
  const topSpacerRef    = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const isTeleporting   = useRef(false);
  const activeIdxRef    = useRef(TOTAL);
  const touchStartY     = useRef(0);

  useEffect(() => { activeIdxRef.current = activeIndex; }, [activeIndex]);

  const realIndex     = activeIndex % TOTAL;
  const activeArticle = articles[realIndex];
  const progress      = (realIndex + 1) / TOTAL;

  // ── Layout: spacers + initial scroll ─────────────────────────
  const applyLayout = useCallback((targetIdx: number) => {
    const container    = scrollRef.current;
    const refItem      = itemRefs.current[TOTAL];
    const topSpacer    = topSpacerRef.current;
    const bottomSpacer = bottomSpacerRef.current;
    if (!container || !refItem || !topSpacer || !bottomSpacer) return;

    const ch  = container.clientHeight;
    const ih  = refItem.offsetHeight;
    const pad = Math.max(20, ch / 2 - ih / 2);

    topSpacer.style.height    = `${pad}px`;
    bottomSpacer.style.height = `${pad}px`;

    const target = itemRefs.current[targetIdx];
    if (target) {
      container.scrollTo({ top: target.offsetTop - ch / 2 + target.offsetHeight / 2 });
    }
  }, []);

  useLayoutEffect(() => {
    applyLayout(TOTAL);
    const onResize = () => applyLayout(activeIdxRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyLayout]);

  // ── Scroll detection ─────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (isTeleporting.current) return;
    const container = scrollRef.current;
    if (!container) return;
    const rect    = container.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    let closest = TOTAL, minDist = Infinity;
    itemRefs.current.forEach((item, i) => {
      if (!item) return;
      const ir   = item.getBoundingClientRect();
      const dist = Math.abs(ir.top + ir.height / 2 - centerY);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // ── Seamless teleport ─────────────────────────────────────────
  useEffect(() => {
    if (activeIndex >= TOTAL && activeIndex < TOTAL * 2) return; // in middle zone

    const targetIdx = TOTAL + (activeIndex % TOTAL);
    const container = scrollRef.current;
    const item      = itemRefs.current[targetIdx];
    if (!container || !item) return;

    isTeleporting.current = true;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2 });
    setActiveIndex(targetIdx);
    setTimeout(() => { isTeleporting.current = false; }, 100);
  }, [activeIndex]);

  // ── Navigation ────────────────────────────────────────────────
  const navigate = useCallback((delta: number) => {
    const targetIdx = activeIdxRef.current + delta;
    if (targetIdx < 0 || targetIdx >= N) return;
    const item      = itemRefs.current[targetIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, []);

  const scrollToReal = useCallback((realIdx: number) => {
    const item      = itemRefs.current[TOTAL + realIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, []);

  // Touch swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
  }, [navigate]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); navigate(1); }
      else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); navigate(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: BG, fontFamily: MONO, userSelect: "none" }}
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
          style={{ height: "100%", overflowY: "scroll", scrollbarWidth: "none" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Spacers injected directly by applyLayout() */}
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

        {/* Active article meta */}
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
              {activeArticle.author.toUpperCase()}
            </span>
            <span style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
              {activeArticle.tag.toUpperCase()}&nbsp;·&nbsp;{activeArticle.readTime.toUpperCase()}
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
            {articles.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === realIndex ? 14 : 3, backgroundColor: i === realIndex ? ACCENT : "rgba(255,255,255,0.2)" }}
                transition={{ duration: 0.35, ease: EASE }}
                style={{ height: 3, borderRadius: 2, cursor: "pointer" }}
                onClick={() => scrollToReal(i)}
              />
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
