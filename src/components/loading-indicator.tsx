"use client";

import { motion } from "framer-motion";

export function LoadingIndicator() {
  return (
    <div className="fixed bottom-8 right-8 z-[10000] flex items-center gap-3 pointer-events-none">
      <div className="font-mono text-[10px] tracking-[0.3em] text-[#C8A882] uppercase opacity-40">
        Syncing
      </div>
      <div className="relative flex h-2 w-2">
        <motion.span 
          animate={{
            scale: [1, 2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inline-flex h-full w-full rounded-full bg-[#C8A882] opacity-75"
        />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8A882]" />
      </div>
    </div>
  );
}
