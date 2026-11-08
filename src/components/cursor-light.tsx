"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReadingSettings } from "@/lib/reading-settings";

export function CursorLight() {
  const pathname = usePathname();
  const { settings } = useReadingSettings();
  const isArticlePage = pathname?.startsWith("/article");

  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const flickerTarget = useRef(0.2);
  const flickerCurrent = useRef(0.2);

  useEffect(() => {
    // Candle light effect is exclusively on article pages
    if (!isArticlePage) return;
    if (!settings.ambience) return;
    if (typeof window === "undefined") return;

    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || prefersReducedMotion) return;

    let rafId: number | null = null;
    let targetX = -200;
    let targetY = -200;
    let currentX = -200;
    let currentY = -200;

    // Organic candle flicker interval (random bright up/down without extinguishing)
    const flickerInterval = setInterval(() => {
      // Base candle flicker between 0.14 and 0.28
      flickerTarget.current = 0.14 + Math.random() * 0.14;
    }, 180);

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      // Check if hovering a link or clickable element
      const target = e.target as HTMLElement | null;
      const hoverLink = !!target?.closest("a, button, [role='link'], .wikilink, .speaker-label");
      setIsHoveringLink(hoverLink);

      if (rafId === null) {
        rafId = requestAnimationFrame(updateCursor);
      }
    };

    const updateCursor = () => {
      // Smooth position lerp
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      // Smooth flicker lerp
      flickerCurrent.current += (flickerTarget.current - flickerCurrent.current) * 0.1;

      document.documentElement.style.setProperty("--mx", `${currentX.toFixed(1)}px`);
      document.documentElement.style.setProperty("--my", `${currentY.toFixed(1)}px`);

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        rafId = requestAnimationFrame(updateCursor);
      } else {
        rafId = null;
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      clearInterval(flickerInterval);
      window.removeEventListener("mousemove", onMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isArticlePage, settings.ambience]);

  if (!isArticlePage || !settings.ambience) return null;

  const opacity = isHoveringLink ? 0.55 : flickerCurrent.current;
  const radius = isHoveringLink ? 420 : 310;

  return (
    <div
      aria-hidden="true"
      className="cursor-light-glow fixed inset-0 pointer-events-none transition-all duration-150 ease-out"
      style={{
        zIndex: 15,
        mixBlendMode: "screen",
        background: `radial-gradient(${radius}px circle at var(--mx) var(--my), rgba(227, 197, 143, ${opacity.toFixed(3)}), transparent 72%)`,
      }}
    />
  );
}
