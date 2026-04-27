"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RandomParagraph } from "@/lib/content";
import { ACCENT, BG, EASE, MONO, SERIF } from "@/lib/design-tokens";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", marginBottom: "7px", fontFamily: MONO }}>
    {children}
  </div>
);

export function RandomScroll({ paragraphs }: { paragraphs: RandomParagraph[] }) {
  const router = useRouter();
  
  const TOTAL = paragraphs.length;
  const CLONES = 4; 
  const N = TOTAL * CLONES; 
  const MIDDLE_ZONE_START = TOTAL * Math.floor(CLONES / 2);
  
  const looped = useMemo(() => {
    let arr: RandomParagraph[] = [];
    for (let i = 0; i < CLONES; i++) {
      arr = [...arr, ...paragraphs];
    }
    return arr;
  }, [paragraphs, CLONES]);

  const [activeIndex, setActiveIndex] = useState(MIDDLE_ZONE_START);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const isTeleporting = useRef(false);
  const activeIdxRef = useRef(MIDDLE_ZONE_START);

  useEffect(() => { activeIdxRef.current = activeIndex; }, [activeIndex]);

  const activePara = paragraphs[activeIndex % TOTAL];

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); navigate(1); }
      else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); navigate(-1); }
      else if (e.key === "Enter") { 
        e.preventDefault(); 
        router.push(`/article/${activePara.articleId}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, activePara, router]);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden relative" style={{ backgroundColor: BG, fontFamily: MONO, userSelect: "none" }}>
      
      <header className="shrink-0 flex items-center justify-between px-10 py-6 border-b border-white/5 relative z-20 bg-[#1A1A1A]">
        <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "#C8A882" }}>RANDOM&nbsp;READ</div>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.22)" }}>FRAGMENTED&nbsp;KNOWLEDGE</div>
        <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.45)" }}>
          {String((activeIndex % TOTAL) + 1).padStart(3, "0")}&nbsp;/&nbsp;{String(TOTAL).padStart(3, "0")}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Progress Line */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/5 z-10">
          <motion.div 
            animate={{ height: `${(((activeIndex % TOTAL) + 1) / TOTAL) * 100}%` }} 
            className="w-full bg-[#C8A882]" 
          />
        </div>

        {/* Center Crosshair */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-white/5 h-[400px] pointer-events-none z-0" />

        <div 
          ref={scrollRef} 
          style={{ height: "100%", overflowY: "scroll", scrollbarWidth: "none", msOverflowStyle: "none" }} 
          className="w-full scrollbar-hide z-10"
        >
          <div ref={topSpacerRef} />

          {looped.map((para, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                ref={el => { itemRefs.current[i] = el; }}
                onClick={() => navigate(i - activeIdxRef.current)}
                className="py-20 flex justify-center px-6 md:px-0"
              >
                <motion.div
                  animate={{ 
                    opacity: isActive ? 1 : 0.05,
                    scale: isActive ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="max-w-2xl w-full"
                >
                  <div className="mb-8 flex items-center gap-4">
                    <div className="h-px w-8 bg-[#C8A882]/50" />
                    <div className="text-[10px] tracking-[0.25em] text-[#C8A882] uppercase">
                      From: {para.articleId}
                    </div>
                  </div>

                  <div className="font-thai text-lg md:text-xl lg:text-2xl leading-[1.7] text-white/90 mb-10 italic font-light">
                    "{para.text}"
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-thai text-sm text-[#C8A882]">
                      {para.articleTitle}
                    </div>
                    <div className="flex justify-between items-center text-[10px] tracking-widest text-white/30 uppercase">
                      <span>{para.author}</span>
                      <span>{para.date}</span>
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-12"
                    >
                      <Link 
                        href={`/article/${para.articleId}`}
                        className="inline-flex items-center gap-3 text-[10px] tracking-[0.3em] text-white hover:text-[#C8A882] transition-colors"
                      >
                        READ FULL ENTRY <span className="text-accent text-sm">→</span>
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })}

          <div ref={bottomSpacerRef} />
        </div>
      </div>
      
      <footer className="shrink-0 p-10 border-t border-white/5 flex justify-center md:justify-between items-center bg-[#1A1A1A] z-20">
        <div className="hidden md:block text-[9px] tracking-[0.2em] text-white/20">
          PRESS [ENTER] TO EXPLORE
        </div>
        <div className="text-[9px] tracking-[0.2em] text-[#C8A882]">
          SCROLL TO UNCOVER RANDOM FRAGMENTS
        </div>
      </footer>
    </div>
  );
}
