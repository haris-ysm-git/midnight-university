"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue, animate } from "framer-motion";

export function CursorLight() {
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Smooth the movement
  const springX = useSpring(cursorX, { stiffness: 500, damping: 50, mass: 0.5 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 50, mass: 0.5 });

  const [flicker, setFlicker] = useState(1);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        setIsHoveringLink(true);
      } else {
        setIsHoveringLink(false);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  // Candle flicker effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const runFlicker = () => {
      // Randomly change brightness/size
      const nextFlicker = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      setFlicker(nextFlicker);
      
      const nextInterval = 50 + Math.random() * 150; // fast random intervals
      timeoutId = setTimeout(runFlicker, nextInterval);
    };

    runFlicker();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-screen"
      style={{
        x: springX,
        y: springY,
      }}
    >
      <motion.div
        animate={{
          scale: isHoveringLink ? 1.5 : flicker,
          opacity: isHoveringLink ? 0.9 : flicker * 0.6,
        }}
        transition={{
          scale: { type: "spring", stiffness: 250, damping: 25 },
          opacity: { duration: 0.1 }
        }}
        className="w-48 h-48 -ml-24 -mt-24 rounded-full blur-[60px]"
        style={{
          background: "radial-gradient(circle, rgba(200, 168, 130, 0.6) 0%, rgba(200, 168, 130, 0.2) 50%, transparent 80%)",
        }}
      />
    </motion.div>
  );
}
