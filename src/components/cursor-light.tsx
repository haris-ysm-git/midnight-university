"use client";

import { useEffect } from "react";
import { useReadingSettings } from "@/lib/reading-settings";

export function CursorLight() {
  const { settings } = useReadingSettings();

  useEffect(() => {
    // Check if touch device, reduced motion, or ambience disabled
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

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateCursor);
      }
    };

    const updateCursor = () => {
      // Smooth lerp
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

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
      window.removeEventListener("mousemove", onMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [settings.ambience]);

  if (!settings.ambience) return null;

  return (
    <div
      aria-hidden="true"
      className="cursor-light-glow"
      style={{
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
