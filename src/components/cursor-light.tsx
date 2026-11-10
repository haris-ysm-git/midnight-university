"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReadingSettings } from "@/lib/reading-settings";

const BASE_R = 130;

export function CandleLight() {
  const pathname = usePathname();
  const { settings } = useReadingSettings();
  const isArticlePage = pathname?.startsWith("/article");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isArticlePage) return;
    if (!settings.ambience) return;
    if (typeof window === "undefined") return;

    // Device check: touch-only check
    const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasHover) return;

    // Check dawn theme
    const isDawn =
      settings.theme === "dawn" ||
      document.documentElement.getAttribute("data-theme") === "dawn" ||
      document.documentElement.classList.contains("theme-dawn");
    if (isDawn) return;

    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId: number | null = null;
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let hasMoved = false;

    // Gust logic: random intervals of 3 to 8 seconds, 250ms duration
    let nextGustTime = performance.now() / 1000 + 3 + Math.random() * 5;
    const gustDuration = 0.25;

    let lastTime = performance.now();
    const startTime = performance.now();

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        currentX = targetX;
        currentY = targetY;
        el.style.opacity = "1";
      }
    };

    const onPointerLeave = () => {
      el.style.opacity = "0";
    };

    const onPointerEnter = () => {
      if (hasMoved) {
        el.style.opacity = "1";
      }
    };

    const update = (now: number) => {
      if (document.hidden) {
        rafId = requestAnimationFrame(update);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = (now - startTime) / 1000;

      if (prefersReducedMotion) {
        // Reduced motion: keep following pointer with smooth lag, fixed radius BASE_R & intensity 1
        currentX += (targetX - currentX) * (1 - Math.exp(-dt * 14));
        currentY += (targetY - currentY) * (1 - Math.exp(-dt * 14));

        el.style.setProperty("--cx", `${currentX.toFixed(1)}px`);
        el.style.setProperty("--cy", `${currentY.toFixed(1)}px`);
        el.style.setProperty("--cr", `${BASE_R}px`);
        el.style.setProperty("--ci", "1.00");
      } else {
        // Organic sine flicker
        const n1 = Math.sin(t * 2.1);
        const n2 = Math.sin(t * 5.3 + 1.7);
        const n3 = Math.sin(t * 11.7 + 0.4);

        const f = 0.6 * n1 + 0.3 * n2 + 0.1 * n3;
        const radius = BASE_R * (1 + 0.06 * f);

        let intensity = 1 + 0.12 * (0.5 * n1 + 0.5 * n2);

        // Gust dip
        if (t >= nextGustTime && t <= nextGustTime + gustDuration) {
          const gustProgress = (t - nextGustTime) / gustDuration;
          const dip = Math.sin(gustProgress * Math.PI) * 0.15; // dip factor down to 0.85
          intensity *= (1 - dip);
        } else if (t > nextGustTime + gustDuration) {
          nextGustTime = t + 3 + Math.random() * 5;
        }

        // Position smoothing with lag
        currentX += (targetX - currentX) * (1 - Math.exp(-dt * 14));
        currentY += (targetY - currentY) * (1 - Math.exp(-dt * 14));

        const jitterX = 0.6 * n3;
        const jitterY = 0.6 * n3;

        el.style.setProperty("--cx", `${(currentX + jitterX).toFixed(1)}px`);
        el.style.setProperty("--cy", `${(currentY + jitterY).toFixed(1)}px`);
        el.style.setProperty("--cr", `${radius.toFixed(1)}px`);
        el.style.setProperty("--ci", intensity.toFixed(2));
      }

      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    document.addEventListener("mouseenter", onPointerEnter);

    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("mouseenter", onPointerEnter);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [mounted, isArticlePage, settings.ambience, settings.theme]);

  if (!mounted || !isArticlePage || !settings.ambience || settings.theme === "dawn") {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="candle-light-overlay fixed inset-0 pointer-events-none transition-opacity duration-300"
      style={{
        zIndex: 15,
        mixBlendMode: "screen",
        opacity: 0,
        background:
          "radial-gradient(circle var(--cr, 130px) at var(--cx, -500px) var(--cy, -500px), rgba(255, 196, 120, calc(0.20 * var(--ci, 1))) 0%, rgba(255, 170, 90, calc(0.10 * var(--ci, 1))) 35%, rgba(255, 150, 70, calc(0.035 * var(--ci, 1))) 70%, rgba(255, 150, 70, 0) 100%)",
      }}
    />
  );
}

// Backwards compatibility export
export const CursorLight = CandleLight;
