"use client";

import { motion } from "motion/react";
import { ACCENT, EASE } from "@/lib/design-tokens";
import { useEffect, useState } from "react";

export function HeroStatement() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full flex flex-col justify-center px-8 md:px-16 py-24 min-h-[50vh] relative z-10 border-b border-white/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="max-w-4xl"
      >
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white leading-tight mb-6" style={{ letterSpacing: "-0.02em" }}>
          Midnight University
          <br />
          <span className="text-white/80 font-thai text-2xl md:text-4xl lg:text-5xl mt-4 block leading-[1.6]">
            กลางวันมืด กลางคืนกลับสว่าง
          </span>
        </h1>
        
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          className="h-px w-24 md:w-48 bg-accent origin-left mb-8"
          style={{ backgroundColor: ACCENT }}
        />
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-white/50 font-mono text-xs md:text-sm tracking-widest uppercase leading-relaxed"
        >
          กลางวันคือการเริ่มต้นเดินทางไปสู่ความมืด ส่วนกลางคืนคือจุดเริ่มต้นไปสู่ความสว่าง • เที่ยงวันคือจุดที่สว่างสุดแต่จะมืดลง เที่ยงคืนคือจุดที่มืดสุดแต่จะสว่างขึ้น
        </motion.p>
      </motion.div>
    </div>
  );
}
