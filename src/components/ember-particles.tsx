"use client";

import { useEffect, useRef } from "react";
import { useReadingSettings } from "@/lib/reading-settings";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function EmberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useReadingSettings();

  useEffect(() => {
    if (!settings.ambience) return;
    if (typeof window === "undefined") return;

    // Checks: Touch, Save-Data, Reduced Motion
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } })?.connection?.saveData;

    if (isTouch || prefersReducedMotion || saveData) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let isTabVisible = !document.hidden;

    const maxParticles = Math.min(36, Math.floor(window.innerWidth / 40));
    const particles: Particle[] = [];

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const createParticle = (): Particle => {
      const startFromBottom = Math.random() > 0.4;
      return {
        x: startFromBottom ? Math.random() * width : width + Math.random() * 20,
        y: startFromBottom ? height + Math.random() * 30 : Math.random() * height,
        size: 0.6 + Math.random() * 1.4,
        speedX: -(0.15 + Math.random() * 0.45),
        speedY: -(0.25 + Math.random() * 0.65),
        opacity: 0,
        life: 0,
        maxLife: 200 + Math.random() * 260,
      };
    };

    const init = () => {
      resize();
      particles.length = 0;
      for (let i = 0; i < maxParticles; i++) {
        const p = createParticle();
        // Stagger initial progress
        p.life = Math.random() * p.maxLife * 0.8;
        particles.push(p);
      }
    };

    let lastTime = performance.now();
    let slowFrameCount = 0;

    const render = (time: number) => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const delta = time - lastTime;
      lastTime = time;

      // Throttle if frame rate drops drastically (< 25fps)
      if (delta > 40) {
        slowFrameCount++;
        if (slowFrameCount > 60) {
          // Permanently stop if system is struggling
          return;
        }
      } else {
        slowFrameCount = Math.max(0, slowFrameCount - 1);
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX + Math.sin(p.life / 25) * 0.15;
        p.y += p.speedY;
        p.life++;

        // Fade in and out
        if (p.life < 50) {
          p.opacity = (p.life / 50) * 0.28;
        } else if (p.life > p.maxLife - 60) {
          p.opacity = ((p.maxLife - p.life) / 60) * 0.28;
        }

        if (p.life >= p.maxLife || p.x < -20 || p.y < -20) {
          particles[i] = createParticle();
        } else {
          ctx.fillStyle = `rgba(201, 168, 124, ${Math.max(0, p.opacity)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };

    init();
    animationFrameId = requestAnimationFrame(render);

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [settings.ambience]);

  if (!settings.ambience) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        opacity: 0.85,
      }}
    />
  );
}
