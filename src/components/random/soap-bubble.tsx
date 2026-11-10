"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface BubbleData {
  rect: DOMRect;
  pointerX: number;
  id?: string;
  title: string;
  isKeyword?: boolean;
}

interface SoapBubbleProps {
  bubble: BubbleData | null;
  onPopComplete?: () => void;
}

export function SoapBubble({ bubble }: SoapBubbleProps) {
  const [activeBubble, setActiveBubble] = useState<BubbleData | null>(null);
  const [contentBubble, setContentBubble] = useState<BubbleData | null>(null);
  const [isPopping, setIsPopping] = useState(false);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Prefers reduced motion check
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  useEffect(() => {
    if (bubble) {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      setIsPopping(false);
      setActiveBubble(bubble);
      setContentBubble(bubble);
    } else {
      // Leaves only after 180ms off all eligible tiles
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = setTimeout(() => {
        setIsPopping(true);
        const popTimer = setTimeout(() => {
          setActiveBubble(null);
          setContentBubble(null);
          setIsPopping(false);
        }, 140);
        return () => clearTimeout(popTimer);
      }, 180);
    }

    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, [bubble]);

  if (!activeBubble || !contentBubble) return null;

  const { rect, pointerX } = activeBubble;
  const bubbleWidth = Math.min(280, Math.max(168, 220));

  // Anchor above tile (22px gap); x follows pointer, clamped 24px inside tile edges
  const minX = rect.left + 24;
  const maxX = rect.right - 24;
  const targetX = Math.max(minX, Math.min(maxX, pointerX || rect.left + rect.width / 2));
  const left = Math.max(12, Math.min(window.innerWidth - bubbleWidth - 12, targetX - bubbleWidth / 2));

  const placeBelow = rect.top < 90;
  const top = placeBelow ? rect.bottom + 22 : rect.top - 105;

  return (
    <div
      className="fixed z-90 pointer-events-none"
      style={{
        left,
        top,
        width: bubbleWidth,
      }}
    >
      <AnimatePresence mode="wait">
        {!isPopping ? (
          <motion.div
            key="soap-bubble-group"
            initial={reducedMotion ? { opacity: 0 } : { scale: 0.2, opacity: 0 }}
            animate={
              reducedMotion
                ? { opacity: 1 }
                : {
                    scale: 1,
                    opacity: 1,
                    y: [-3, 3, -3],
                    transition: {
                      scale: { type: "spring", stiffness: 220, damping: 16 },
                      opacity: { duration: 0.16 },
                      y: { repeat: Infinity, duration: 3.6, ease: "easeInOut" },
                    },
                  }
            }
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0.12 } }
                : {
                    scale: 1.08,
                    opacity: 0,
                    transition: { duration: 0.14, ease: "easeOut" },
                  }
            }
            className="relative flex flex-col items-center"
          >
            {/* ── MAIN BUBBLE ─────────────────────────────────────────────── */}
            <div
              className={`soap-bubble-blob relative w-full text-center px-6 py-5 select-none ${
                reducedMotion ? "" : "animate-soap-wobble"
              }`}
              style={{
                minWidth: 168,
                maxWidth: 280,
                background: `
                  radial-gradient(circle at 28% 22%, rgba(255,255,255,0.28) 0, rgba(255,255,255,0) 26%),
                  radial-gradient(circle at 72% 82%, rgba(255,200,130,0.12), transparent 55%),
                  color-mix(in srgb, var(--raised) 78%, transparent)
                `,
                border: "1px solid rgba(255,235,200,0.35)",
                boxShadow: `
                  inset 0 0 22px rgba(255,220,170,0.14),
                  inset 0 0 2px rgba(255,255,255,0.35),
                  0 10px 32px rgba(0,0,0,0.45)
                `,
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                borderRadius: "58% 42% 55% 45% / 50% 55% 45% 50%",
                overflow: "hidden",
              }}
            >
              {/* Iridescent Rotating Sheen */}
              {!reducedMotion && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.07] animate-sheen-spin"
                  style={{
                    background:
                      "conic-gradient(from var(--sheen-angle, 0deg) at 50% 50%, #4dd0e1, #f48fb1, #ffb74d, #4dd0e1)",
                  }}
                />
              )}

              {/* Centred Text with 120ms Crossfade */}
              <motion.div
                key={contentBubble.id || contentBubble.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                <div className="font-mono text-[10px] text-[var(--gold)] uppercase tracking-wider font-semibold">
                  {contentBubble.isKeyword ? "KEYWORD" : `NO. ${contentBubble.id}`}
                </div>
                <div className="font-thai text-[14px] text-[var(--text)] font-medium leading-[1.5] line-clamp-2 max-w-[220px]">
                  {contentBubble.title}
                </div>
              </motion.div>
            </div>

            {/* ── 3 SMALL BUBBLES ON GENTLE CURVE (22px, 14px, 8px) ────────── */}
            {!reducedMotion && (
              <div
                className={`absolute flex flex-col items-center ${
                  placeBelow ? "bottom-full mb-1 flex-col-reverse" : "top-full mt-1"
                }`}
                style={{ gap: "4px" }}
              >
                {/* 22px Bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.4 }}
                  animate={{
                    opacity: 1,
                    y: [-2, 2, -2],
                    scale: 1,
                    transition: {
                      delay: 0.12,
                      y: { repeat: Infinity, duration: 3.0, ease: "easeInOut" },
                    },
                  }}
                  className="rounded-full"
                  style={{
                    width: 22,
                    height: 22,
                    background:
                      "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.3) 0, transparent 40%), color-mix(in srgb, var(--raised) 75%, transparent)",
                    border: "1px solid rgba(255,235,200,0.35)",
                    boxShadow: "inset 0 0 8px rgba(255,220,170,0.15)",
                    backdropFilter: "blur(4px)",
                  }}
                />

                {/* 14px Bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.4 }}
                  animate={{
                    opacity: 1,
                    y: [2, -2, 2],
                    scale: 1,
                    transition: {
                      delay: 0.06,
                      y: { repeat: Infinity, duration: 3.4, ease: "easeInOut" },
                    },
                  }}
                  className="rounded-full"
                  style={{
                    width: 14,
                    height: 14,
                    background:
                      "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.3) 0, transparent 40%), color-mix(in srgb, var(--raised) 75%, transparent)",
                    border: "1px solid rgba(255,235,200,0.35)",
                    boxShadow: "inset 0 0 6px rgba(255,220,170,0.15)",
                  }}
                />

                {/* 8px Bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.4 }}
                  animate={{
                    opacity: 1,
                    y: [-1, 1, -1],
                    scale: 1,
                    transition: {
                      delay: 0,
                      y: { repeat: Infinity, duration: 4.1, ease: "easeInOut" },
                    },
                  }}
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background:
                      "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.3) 0, transparent 40%), color-mix(in srgb, var(--raised) 75%, transparent)",
                    border: "1px solid rgba(255,235,200,0.35)",
                  }}
                />
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
