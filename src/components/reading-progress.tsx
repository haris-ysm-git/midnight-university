"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const scrolled = (window.scrollY / docHeight) * 100;
        setPercent(Math.min(100, Math.max(0, scrolled)));
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Mobile Top Thin Hairline */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2px] bg-transparent z-60 md:hidden pointer-events-none"
      >
        <div
          className="h-full bg-[var(--gold)] transition-all duration-100 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Desktop Vertical Right Bar */}
      <div
        aria-hidden="true"
        className="reader-progress hidden md:block"
        style={{
          height: `${percent}%`,
          top: 0,
          right: 0,
          position: "fixed",
          width: "2px",
          backgroundColor: "var(--gold)",
          zIndex: 61,
          transition: "height 0.1s ease-out",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
