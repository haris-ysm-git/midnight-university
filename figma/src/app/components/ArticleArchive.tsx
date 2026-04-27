import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { articles, uniqueAuthors } from "../data/articles";

// ─── Design Tokens ────────────────────────────────────────────
const ACCENT = "#C8A882";
const BG     = "#1A1A1A";
const EASE: [number, number, number, number] = [0.2, 0.8, 0.4, 1];
const SERIF  = '"Playfair Display", Georgia, serif';
const MONO   = '"Roboto Mono", "Courier New", monospace';

// ─── Infinite-loop constants ──────────────────────────────────
const TOTAL = articles.length;          // 12  – real article count
const N     = TOTAL * 3;                // 36  – looped array length
// Middle zone: indices [TOTAL … TOTAL*2-1] = [12 … 23]

// ─── Helpers ──────────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", marginBottom: "7px", fontFamily: MONO }}>
    {children}
  </div>
);

// ─── Component ────────────────────────────────────────────────
export function ArticleArchive() {
  const looped = useMemo(() => [...articles, ...articles, ...articles], []);

  // activeIndex lives in [0 … N-1]; display driven by activeIndex % TOTAL
  const [activeIndex, setActiveIndex]     = useState(TOTAL);
  const [hoveredRealIdx, setHoveredRealIdx] = useState<number | null>(null);

  const scrollRef       = useRef<HTMLDivElement>(null);
  const itemRefs        = useRef<(HTMLDivElement | null)[]>([]);
  const topSpacerRef    = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const isTeleporting   = useRef(false);
  const activeIdxRef    = useRef(TOTAL); // always up-to-date, safe in callbacks

  // Keep ref in sync with state
  useEffect(() => { activeIdxRef.current = activeIndex; }, [activeIndex]);

  const realIndex     = activeIndex % TOTAL;
  const activeArticle = articles[realIndex];
  const progress      = (realIndex + 1) / TOTAL;

  // ── Spacer-based layout + initial scroll ─────────────────────
  // We set spacer heights directly on the DOM (no state) so the
  // measurement → apply → scroll pipeline is fully synchronous.
  const applyLayout = useCallback((targetIdx: number) => {
    const container   = scrollRef.current;
    const refItem     = itemRefs.current[TOTAL]; // measure height from middle zone
    const topSpacer   = topSpacerRef.current;
    const bottomSpacer = bottomSpacerRef.current;
    if (!container || !refItem || !topSpacer || !bottomSpacer) return;

    const ch      = container.clientHeight;
    const ih      = refItem.offsetHeight;
    const pad     = Math.max(40, ch / 2 - ih / 2);

    topSpacer.style.height    = `${pad}px`;
    bottomSpacer.style.height = `${pad}px`;

    // Reading offsetTop after style change forces a synchronous reflow
    const target = itemRefs.current[targetIdx];
    if (target) {
      container.scrollTo({ top: target.offsetTop - ch / 2 + target.offsetHeight / 2 });
    }
  }, []);

  useLayoutEffect(() => {
    applyLayout(TOTAL); // start centered on article 0 of middle zone
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

  // ── Seamless teleport when entering clone zones ───────────────
  useEffect(() => {
    // Middle zone → nothing to do
    if (activeIndex >= TOTAL && activeIndex < TOTAL * 2) return;

    const targetIdx = TOTAL + (activeIndex % TOTAL); // project to middle zone
    const container = scrollRef.current;
    const item      = itemRefs.current[targetIdx];
    if (!container || !item) return;

    isTeleporting.current = true;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2 });
    setActiveIndex(targetIdx);

    // Reset flag after scroll events from the instant jump have fired
    setTimeout(() => { isTeleporting.current = false; }, 100);
  }, [activeIndex]);

  // ── Navigation helpers ────────────────────────────────────────
  // Delta-based (allows crossing clone-zone boundaries → triggers teleport)
  const navigate = useCallback((delta: number) => {
    const targetIdx = activeIdxRef.current + delta;
    if (targetIdx < 0 || targetIdx >= N) return;
    const item      = itemRefs.current[targetIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, []);

  // Jump to a real article index (always uses middle zone)
  const scrollToReal = useCallback((realIdx: number) => {
    const item      = itemRefs.current[TOTAL + realIdx];
    const container = scrollRef.current;
    if (!item || !container) return;
    container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); navigate(1); }
      else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); navigate(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Author click: cycle through their articles
  const handleAuthorClick = useCallback((author: string) => {
    const indices   = articles.map((a, i) => a.author === author ? i : -1).filter(i => i >= 0);
    const currentReal = activeIdxRef.current % TOTAL;
    const pos       = indices.indexOf(currentReal);
    scrollToReal(pos >= 0 ? indices[(pos + 1) % indices.length] : indices[0]);
  }, [scrollToReal]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: BG, fontFamily: MONO, userSelect: "none" }}
    >

      {/* ══ HEADER ═══════════════════════════════════════════════ */}
      <header
        className="shrink-0 flex items-center justify-between"
        style={{ padding: "18px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.45)" }}>
          CRITICAL&nbsp;FUTURES
        </div>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.22)" }}>
          ARTICLE&nbsp;ARCHIVE
        </div>
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

      {/* ══ FOUR-COLUMN LAYOUT ═══════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Crosshair at 50% */}
        <div
          className="absolute inset-x-0 pointer-events-none z-20"
          style={{ top: "50%", borderTop: "1px solid rgba(255,255,255,0.04)" }}
        />

        {/* ── COL 1 · AUTHORS 15% ──────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col justify-center"
          style={{ width: "15%", padding: "0 36px", borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Label>CONTRIBUTORS</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: "22px", marginTop: "10px" }}>
            {uniqueAuthors.map((author) => {
              const isActive = activeArticle.author === author;
              const count    = articles.filter(a => a.author === author).length;
              return (
                <motion.div
                  key={author}
                  animate={{ opacity: isActive ? 1 : 0.2 }}
                  whileHover={{ opacity: isActive ? 1 : 0.55 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  onClick={() => handleAuthorClick(author)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", letterSpacing: "0.05em", color: isActive ? ACCENT : "#ffffff", marginBottom: "4px" }}>
                    {author}
                  </div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)" }}>
                    {count}&nbsp;{count === 1 ? "article" : "articles"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── COL 2 · METADATA 15% ─────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col justify-center"
          style={{ width: "15%", padding: "0 36px", borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.42, ease: EASE }}
            >
              <div style={{ marginBottom: "36px" }}>
                <Label>INDEX</Label>
                <div style={{ fontFamily: SERIF, fontSize: "44px", color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {activeArticle.index}
                </div>
              </div>
              <div style={{ marginBottom: "22px" }}>
                <Label>PUBLICATION</Label>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", lineHeight: 1.7 }}>
                  {activeArticle.volume}<br />{activeArticle.issue}
                </div>
              </div>
              <div style={{ marginBottom: "22px" }}>
                <Label>PUBLISHED</Label>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>
                  {activeArticle.date}
                </div>
              </div>
              <div style={{ marginBottom: "22px" }}>
                <Label>READ TIME</Label>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>
                  {activeArticle.readTime}
                </div>
              </div>
              <div>
                <Label>TYPE</Label>
                <div style={{ display: "inline-block", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "2px", fontSize: "9px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.55)" }}>
                  {activeArticle.tag.toUpperCase()}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── COL 3 · SCROLLABLE TITLES 50% ────────────────────── */}
        <div className="relative shrink-0" style={{ width: "50%" }}>

          {/* Vertical progress bar */}
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "1px", backgroundColor: "rgba(255,255,255,0.06)", zIndex: 10 }}>
            <motion.div
              animate={{ height: `${progress * 100}%` }}
              transition={{ duration: 0.55, ease: EASE }}
              style={{ width: "1px", backgroundColor: ACCENT }}
            />
          </div>

          <div
            ref={scrollRef}
            style={{ height: "100%", overflowY: "scroll", scrollbarWidth: "none" }}
          >
            {/* Spacers — height injected directly by applyLayout() */}
            <div ref={topSpacerRef} />

            {looped.map((article, i) => {
              const isActive  = i === activeIndex;
              const realI     = i % TOTAL;
              const isHovered = hoveredRealIdx === realI && !isActive;

              return (
                <motion.div
                  key={i}
                  ref={el => { itemRefs.current[i] = el; }}
                  animate={{ opacity: isActive ? 1 : isHovered ? 0.5 : 0.17 }}
                  transition={{ duration: 0.38, ease: EASE }}
                  style={{ padding: "26px 48px", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredRealIdx(realI)}
                  onMouseLeave={() => setHoveredRealIdx(null)}
                  onClick={() => navigate(i - activeIdxRef.current)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", paddingTop: "10px", minWidth: "28px", flexShrink: 0 }}>
                      {article.index}
                    </div>
                    <div style={{ fontFamily: SERIF, fontSize: "60px", lineHeight: 1.0, letterSpacing: "-0.025em", color: "#ffffff" }}>
                      {article.title}
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: 36 }}
                      transition={{ duration: 0.38, ease: EASE }}
                      style={{ height: "1px", backgroundColor: ACCENT, marginTop: "10px", marginLeft: "42px" }}
                    />
                  )}
                </motion.div>
              );
            })}

            <div ref={bottomSpacerRef} />
          </div>
        </div>

        {/* ── COL 4 · GENRES 20% ───────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col justify-center"
          style={{ width: "20%", padding: "0 40px", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.42, ease: EASE }}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Label>THEMES</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                {activeArticle.genres.map((genre, gi) => (
                  <motion.div
                    key={genre}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.08, duration: 0.35, ease: EASE }}
                    style={{ padding: "8px 14px", border: `1px solid ${ACCENT}55`, borderRadius: "2px", color: ACCENT, fontSize: "10px", letterSpacing: "0.16em", display: "inline-block", alignSelf: "flex-start" }}
                  >
                    {genre.toUpperCase()}
                  </motion.div>
                ))}
              </div>
              <div style={{ marginTop: "36px" }}>
                <Label>WRITTEN BY</Label>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em" }}>
                  {activeArticle.author}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.35 }}
                style={{ marginTop: "40px" }}
              >
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
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer
        className="shrink-0 flex items-center justify-between"
        style={{ padding: "13px 40px", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div style={{ fontSize: "9px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.2)" }}>
          ↑ ↓ &nbsp;TO NAVIGATE
        </div>

        {/* Dot scrubber — keyed to real 12 articles */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {articles.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === realIndex ? 18 : 3,
                backgroundColor: i === realIndex ? ACCENT : "rgba(255,255,255,0.18)",
              }}
              transition={{ duration: 0.38, ease: EASE }}
              style={{ height: "3px", borderRadius: "2px", cursor: "pointer" }}
              onClick={() => scrollToReal(i)}
            />
          ))}
        </div>

        <motion.div
          key={realIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{ fontSize: "9px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.2)" }}
        >
          {activeArticle.author.toUpperCase()}
        </motion.div>
      </footer>

    </div>
  );
}
