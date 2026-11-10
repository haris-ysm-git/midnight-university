"use client";

import React, { useEffect, useState, useRef } from "react";
import { useReadingSettings, ColumnWidth, LineHeight } from "@/lib/reading-settings";
import { ThemeMode } from "@/lib/design-tokens";
import { Icon } from "@/components/icons";
import { AnimatePresence, motion } from "motion/react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_PREVIEWS: Record<ThemeMode, { bg: string; text: string; label: string }> = {
  midnight: { bg: "#1B1B1A", text: "#ECE8E1", label: "Midnight" },
  ink: { bg: "#050505", text: "#ECE8E1", label: "Ink" },
  candlelight: { bg: "#241D18", text: "#EEE2D5", label: "Candlelight" },
  dawn: { bg: "#EEE6D8", text: "#27221D", label: "Dawn" },
};

export function ReadingSettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, resetSettings } = useReadingSettings();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Spark / Smoke animation phases: 'steady' | 'igniting' | 'snuffing'
  const [phase, setPhase] = useState<"steady" | "igniting" | "snuffing">("steady");
  const [sparks, setSparks] = useState<{ id: number; dx: string; dy: string; delay: number }[]>([]);
  const hasMountedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus restoration to Aa button on close
  useEffect(() => {
    if (isOpen) {
      hasMountedRef.current = true;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
          const aaBtn = document.querySelector(".aa-button") as HTMLElement | null;
          aaBtn?.focus();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleToggleAmbience = () => {
    const nextVal = !settings.ambience;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (nextVal) {
      // Igniting: generate 4 sparks with random dx (-8px to 8px), dy (-14px to -26px)
      const newSparks = [0, 40, 80, 120].map((delay, i) => ({
        id: Date.now() + i,
        dx: `${(Math.random() * 16 - 8).toFixed(1)}px`,
        dy: `${-(14 + Math.random() * 12).toFixed(1)}px`,
        delay,
      }));
      setSparks(newSparks);
      setPhase("igniting");
      timeoutRef.current = setTimeout(() => {
        setPhase("steady");
      }, 700);
    } else {
      // Snuffing
      setPhase("snuffing");
      timeoutRef.current = setTimeout(() => {
        setPhase("steady");
      }, 900);
    }

    updateSettings({ ambience: nextVal });
  };

  if (!isOpen) return null;

  const currentStep = settings.fontSizeStep + 1; // 1 to 5

  return (
    <AnimatePresence>
      <div className="reading-settings-wrapper">
        {/* Mobile invisible dismiss backdrop (article stays visible) */}
        <div
          className="fixed inset-0 z-[190] md:hidden bg-transparent"
          onClick={onClose}
        />

        {/* Desktop Drawer (right side) & Mobile Bottom Sheet */}
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="Reading appearance settings"
          initial={{ opacity: 0, x: 24, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed z-[200] bg-[var(--raised)] border border-[var(--line)] shadow-2xl flex flex-col 
            /* Desktop placement */
            md:right-6 md:top-[96px] md:w-[min(420px,calc(100vw-32px))] md:max-h-[calc(100dvh-120px)] md:p-7 md:rounded-none
            /* Mobile bottom sheet */
            max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:max-h-[72dvh] max-md:p-5 max-md:pb-[calc(24px+env(safe-area-inset-bottom))] max-md:border-t max-md:border-x-0 max-md:border-b-0 max-md:rounded-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, color-mix(in srgb, var(--gold) 6%, transparent), transparent 70%)",
          }}
        >
          {/* Mobile Drag Handle */}
          <div className="md:hidden flex justify-center mb-3">
            <div className="w-9 h-1 rounded-full bg-[var(--muted)] opacity-40" />
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] shrink-0">
            <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--gold)] uppercase font-semibold">
              Appearance
            </span>
            <button
              type="button"
              aria-label="Close settings"
              className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2"
              onClick={() => {
                onClose();
                const aaBtn = document.querySelector(".aa-button") as HTMLElement | null;
                aaBtn?.focus();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain pr-1 py-4 flex flex-col gap-6 [scrollbar-width:thin]">
            {/* ══ 01 TYPE SIZE ══════════════════════════════════════════════ */}
            <section className="flex flex-col gap-3 pb-5 border-b border-[var(--line)]">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--secondary)]">
                  <span className="text-[var(--gold)] mr-2">01</span>
                  Type Size
                </div>
                <span className="font-mono text-[11px] text-[var(--gold)]">
                  {currentStep} / 5
                </span>
              </div>

              <div className="flex items-center gap-4 py-1">
                <span className="font-serif text-[14px] text-[var(--muted)] select-none">
                  A
                </span>

                {/* Slider track container */}
                <div className="relative flex-1 h-8 flex items-center">
                  {/* Decorative line under input */}
                  <div
                    className="absolute left-[10px] right-[10px] h-[2px] bg-[var(--line)] pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Gold active fill */}
                  <div
                    className="absolute left-[10px] h-[2px] bg-[var(--gold)] pointer-events-none transition-all duration-150"
                    style={{
                      width: `calc((100% - 20px) * ${(currentStep - 1) / 4})`,
                    }}
                    aria-hidden="true"
                  />

                  {/* 5 Fixed Dots */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const isFilled = i <= settings.fontSizeStep;
                    return (
                      <div
                        key={i}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full pointer-events-none transition-colors duration-150 ${
                          isFilled
                            ? "bg-[var(--gold)]"
                            : "border border-[var(--muted)] bg-[var(--raised)]"
                        }`}
                        style={{
                          left: `calc(10px + (100% - 20px) * ${i / 4})`,
                        }}
                        aria-hidden="true"
                      />
                    );
                  })}

                  {/* Native Range Input on Top */}
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={currentStep}
                    aria-label="Type size"
                    aria-valuetext={`Size ${currentStep} of 5`}
                    className="type-size-range"
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) - 1;
                      updateSettings({ fontSizeStep: val });
                    }}
                  />
                </div>

                <span className="font-serif text-[26px] text-[var(--text)] select-none">
                  A
                </span>
              </div>

              {/* 5 Clickable Numbers */}
              <div className="relative h-4 px-[10px]">
                {[1, 2, 3, 4, 5].map((num, i) => {
                  const isSelected = num === currentStep;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateSettings({ fontSizeStep: i })}
                      className={`absolute top-0 -translate-x-1/2 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${
                        isSelected
                          ? "text-[var(--gold)] font-bold scale-110"
                          : "text-[var(--muted)] hover:text-[var(--secondary)]"
                      }`}
                      style={{
                        left: `calc(10px + (100% - 20px) * ${i / 4})`,
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ══ 02 TYPEFACE ═══════════════════════════════════════════════ */}
            <section className="flex flex-col gap-3 pb-5 border-b border-[var(--line)]">
              <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--secondary)]">
                <span className="text-[var(--gold)] mr-2">02</span>
                Typeface
              </div>

              <div
                role="radiogroup"
                aria-label="Reading typeface"
                className="grid grid-cols-2 gap-3"
              >
                {/* Serif Card */}
                <label
                  className={`relative p-3 border transition-all duration-160 cursor-pointer flex flex-col justify-between h-[88px] focus-within:outline-2 focus-within:outline-[var(--gold)] focus-within:outline-offset-2 ${
                    settings.typeface === "serif"
                      ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] text-[var(--text)]"
                      : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--gold)_50%,transparent)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="reading-typeface"
                    value="serif"
                    checked={settings.typeface === "serif"}
                    onChange={() => updateSettings({ typeface: "serif" })}
                    className="sr-only"
                  />
                  {settings.typeface === "serif" && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--gold)]" />
                  )}
                  <div
                    className="text-[24px] font-medium leading-none"
                    style={{ fontFamily: "var(--font-reading-serif)" }}
                  >
                    Serif
                  </div>
                  <div
                    className="text-[16px] leading-[1.6]"
                    style={{ fontFamily: "var(--font-reading-serif)" }}
                  >
                    อักษรไทย
                  </div>
                  <div className="font-mono text-[10px] text-[var(--muted)] truncate">
                    Source Serif 4 + Noto Serif Thai
                  </div>
                </label>

                {/* Sans Card */}
                <label
                  className={`relative p-3 border transition-all duration-160 cursor-pointer flex flex-col justify-between h-[88px] focus-within:outline-2 focus-within:outline-[var(--gold)] focus-within:outline-offset-2 ${
                    settings.typeface === "sans"
                      ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] text-[var(--text)]"
                      : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--gold)_50%,transparent)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="reading-typeface"
                    value="sans"
                    checked={settings.typeface === "sans"}
                    onChange={() => updateSettings({ typeface: "sans" })}
                    className="sr-only"
                  />
                  {settings.typeface === "sans" && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--gold)]" />
                  )}
                  <div
                    className="text-[24px] font-medium leading-none"
                    style={{ fontFamily: "var(--font-reading-sans)" }}
                  >
                    Sans
                  </div>
                  <div
                    className="text-[16px] leading-[1.6]"
                    style={{ fontFamily: "var(--font-reading-sans)" }}
                  >
                    อักษรไทย
                  </div>
                  <div className="font-mono text-[10px] text-[var(--muted)] truncate">
                    IBM Plex Sans + Plex Thai Looped
                  </div>
                </label>
              </div>
            </section>

            {/* ══ 03 LINE SPACING ═══════════════════════════════════════════ */}
            <section className="flex flex-col gap-3 pb-5 border-b border-[var(--line)]">
              <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--secondary)]">
                <span className="text-[var(--gold)] mr-2">03</span>
                Line Spacing
              </div>

              <div
                role="radiogroup"
                aria-label="Line spacing"
                className="grid grid-cols-3 gap-2.5"
              >
                {[
                  { id: "normal" as LineHeight, label: "Normal", lh: 1.7 },
                  { id: "comfortable" as LineHeight, label: "Comfort", lh: 1.85 },
                  { id: "spacious" as LineHeight, label: "Spacious", lh: 2.05 },
                ].map((item) => {
                  const isSelected = settings.lineHeight === item.id;
                  const pitch = 6 + (item.lh - 1) * 14; // Exact pitch formula

                  return (
                    <label
                      key={item.id}
                      className={`relative p-3 border transition-all duration-160 cursor-pointer flex flex-col justify-between h-[84px] focus-within:outline-2 focus-within:outline-[var(--gold)] focus-within:outline-offset-2 ${
                        isSelected
                          ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] text-[var(--text)]"
                          : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--gold)_50%,transparent)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reading-line-height"
                        value={item.id}
                        checked={isSelected}
                        onChange={() => updateSettings({ lineHeight: item.id })}
                        className="sr-only"
                      />

                      {/* 4 Preview Horizontal Bars */}
                      <div className="flex flex-col justify-start pt-1">
                        {[100, 92, 96, 60].map((widthPct, idx) => (
                          <div
                            key={idx}
                            className={`h-[3px] transition-colors duration-160 ${
                              isSelected ? "bg-[var(--gold)]" : "bg-[var(--muted)]"
                            }`}
                            style={{
                              width: `${widthPct}%`,
                              marginTop: idx === 0 ? "0px" : `${pitch - 3}px`,
                            }}
                          />
                        ))}
                      </div>

                      <div className="font-mono text-[10px] text-center mt-auto truncate uppercase tracking-wider">
                        {item.label}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* ══ 04 COLUMN WIDTH (Hidden on mobile < 700px) ════════════════ */}
            <section className="hidden min-[700px]:flex flex-col gap-3 pb-5 border-b border-[var(--line)]">
              <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--secondary)]">
                <span className="text-[var(--gold)] mr-2">04</span>
                Column Width
              </div>

              <div
                role="radiogroup"
                aria-label="Column width"
                className="grid grid-cols-3 gap-2.5"
              >
                {[
                  { id: "narrow" as ColumnWidth, px: "620", widthPct: 62 },
                  { id: "normal" as ColumnWidth, px: "720", widthPct: 72 },
                  { id: "wide" as ColumnWidth, px: "850", widthPct: 85 },
                ].map((item) => {
                  const isSelected = settings.columnWidth === item.id;

                  return (
                    <label
                      key={item.id}
                      className={`relative p-2.5 border transition-all duration-160 cursor-pointer flex flex-col justify-between h-[84px] focus-within:outline-2 focus-within:outline-[var(--gold)] focus-within:outline-offset-2 ${
                        isSelected
                          ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] text-[var(--text)]"
                          : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--gold)_50%,transparent)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reading-column-width"
                        value={item.id}
                        checked={isSelected}
                        onChange={() => updateSettings({ columnWidth: item.id })}
                        className="sr-only"
                      />

                      {/* Screen Frame with centered content block */}
                      <div className="h-[44px] w-full border border-[var(--line)] p-1 flex items-center justify-center">
                        <div
                          className="flex flex-col gap-[5px]"
                          style={{ width: `${item.widthPct}%` }}
                        >
                          <div
                            className={`h-[3px] w-full ${
                              isSelected ? "bg-[var(--gold)]" : "bg-[var(--muted)]"
                            }`}
                          />
                          <div
                            className={`h-[3px] w-full ${
                              isSelected ? "bg-[var(--gold)]" : "bg-[var(--muted)]"
                            }`}
                          />
                          <div
                            className={`h-[3px] w-[55%] ${
                              isSelected ? "bg-[var(--gold)]" : "bg-[var(--muted)]"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="font-mono text-[10px] text-center mt-auto tracking-wider">
                        {item.px}
                        <span className="text-[9px] opacity-70">px</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* ══ 05 COLOR ATMOSPHERE ═══════════════════════════════════════ */}
            <section className="flex flex-col gap-3 pb-5 border-b border-[var(--line)]">
              <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--secondary)]">
                <span className="text-[var(--gold)] mr-2">
                  <span className="min-[700px]:hidden">04</span>
                  <span className="hidden min-[700px]:inline">05</span>
                </span>
                Color Atmosphere
              </div>

              <div
                role="radiogroup"
                aria-label="Color atmosphere"
                className="grid grid-cols-2 gap-2.5"
              >
                {(
                  [
                    "midnight",
                    "ink",
                    "candlelight",
                    "dawn",
                  ] as ThemeMode[]
                ).map((themeKey) => {
                  const info = THEME_PREVIEWS[themeKey];
                  const isSelected = settings.theme === themeKey;

                  return (
                    <label
                      key={themeKey}
                      className={`relative p-2.5 border transition-all duration-160 cursor-pointer flex items-center gap-3 h-[56px] focus-within:outline-2 focus-within:outline-[var(--gold)] focus-within:outline-offset-2 ${
                        isSelected
                          ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] text-[var(--text)]"
                          : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--gold)_50%,transparent)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reading-theme"
                        value={themeKey}
                        checked={isSelected}
                        onChange={() => updateSettings({ theme: themeKey })}
                        className="sr-only"
                      />

                      {/* Swatch 40x28 */}
                      <div
                        className="w-[40px] h-[28px] border border-[var(--line)] flex flex-col justify-center px-1.5 gap-1 shrink-0 relative overflow-hidden"
                        style={{ backgroundColor: info.bg }}
                      >
                        <div
                          className="h-[2px] w-[75%] rounded-xs"
                          style={{ backgroundColor: info.text }}
                        />
                        <div
                          className="h-[2px] w-[50%] rounded-xs"
                          style={{ backgroundColor: info.text }}
                        />
                        <div className="absolute bottom-1 right-1 w-[5px] h-[5px] rounded-full bg-[var(--gold)]" />
                      </div>

                      <span className="font-mono text-[12px] uppercase tracking-wider truncate">
                        {info.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* ══ AMBIENT EMBERS & LIGHT SWITCH ═════════════════════════════ */}
            <section className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span
                  className={`font-serif text-[18px] md:text-[20px] transition-all duration-200 ${
                    settings.ambience
                      ? "text-[var(--text)] [text-shadow:0_0_12px_rgba(255,170,70,0.35)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Ambient Embers & Light
                </span>
                <span className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
                  Embers + Cursor Light
                </span>
              </div>

              {/* Glowing Ember Circle Button */}
              <div className="relative flex items-center gap-2.5">
                <span
                  className={`font-mono text-[10px] tracking-wider transition-colors duration-200 ${
                    settings.ambience ? "text-[var(--gold)] font-bold" : "text-[var(--muted)]"
                  }`}
                >
                  {settings.ambience ? "LIT" : "OUT"}
                </span>

                <button
                  type="button"
                  aria-pressed={settings.ambience}
                  aria-label="Ambient embers and light"
                  onClick={handleToggleAmbience}
                  className={`relative w-9 h-9 rounded-full border transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2 overflow-visible flex items-center justify-center ${
                    settings.ambience ? "ember-flicker-anim" : ""
                  }`}
                  style={{
                    borderColor: settings.ambience
                      ? "rgba(201, 168, 124, 0.6)"
                      : "var(--line)",
                    background: settings.ambience
                      ? "radial-gradient(circle at 35% 35%, #ffe2a8, #ffb347 55%, #e0701c 100%)"
                      : "#555555",
                    boxShadow: settings.ambience
                      ? "0 0 10px 2px rgba(255, 170, 70, 0.65), 0 0 24px 6px rgba(255, 140, 50, 0.35)"
                      : "none",
                  }}
                >
                  {/* Sparks on Ignite */}
                  {phase === "igniting" &&
                    sparks.map((spark) => (
                      <span
                        key={spark.id}
                        className="absolute left-1/2 top-1/2 w-[4px] h-[4px] rounded-full bg-[#ffe2a8] pointer-events-none"
                        style={
                          {
                            "--dx": spark.dx,
                            "--dy": spark.dy,
                            animation: `ember-spark 0.65s cubic-bezier(0.25, 1, 0.5, 1) ${spark.delay}ms forwards`,
                          } as React.CSSProperties
                        }
                      />
                    ))}

                  {/* Smoke Wisp on Snuff */}
                  {phase === "snuffing" && (
                    <span
                      className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-[18px] bg-[#d0c9bc] rounded-full pointer-events-none blur-[1.5px]"
                      style={{
                        animation: "ember-smoke 0.9s ease-out forwards",
                      }}
                    />
                  )}
                </button>
              </div>
            </section>
          </div>

          {/* Sticky Footer Row */}
          <div className="sticky bottom-0 bg-[var(--raised)] pt-4 border-t border-[var(--line)] flex justify-between items-center shrink-0 z-20">
            <button
              type="button"
              className="text-[10px] font-mono tracking-widest text-[var(--muted)] hover:text-[var(--text)] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-[var(--gold)]"
              onClick={resetSettings}
            >
              Reset Defaults
            </button>
            <button
              type="button"
              className="text-[10px] font-mono tracking-widest text-[var(--gold)] hover:text-[var(--gold-bright)] uppercase font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--gold)]"
              onClick={() => {
                onClose();
                const aaBtn = document.querySelector(".aa-button") as HTMLElement | null;
                aaBtn?.focus();
              }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
