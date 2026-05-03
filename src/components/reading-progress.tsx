"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      {/* Mobile: Horizontal bar at the bottom */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-1.5 bg-[#C8A882] z-[60] origin-left md:hidden"
        style={{ scaleX }}
      />

      {/* Desktop: Vertical bar on the side (right) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 h-64 w-px bg-white/10 hidden md:block z-[60]">
        <motion.div
          className="w-full bg-[#C8A882] origin-top"
          style={{ height: "100%", scaleY }}
        />
        <div className="absolute top-0 -left-1 font-mono text-[8px] text-white/20 tracking-tighter -rotate-90 origin-left translate-y-[-10px]">
          READING PROGRESS
        </div>
      </div>
    </>
  );
}
