"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { ThemeMode } from "./design-tokens";

export type ColumnWidth = "narrow" | "normal" | "wide";
export type LineHeight = "normal" | "comfortable" | "spacious";
export type Typeface = "serif" | "sans";

export interface ReadingSettings {
  fontSizeStep: number; // 0 to 4 (default 2)
  lineHeight: LineHeight;
  columnWidth: ColumnWidth;
  typeface: Typeface;
  theme: ThemeMode;
  ambience: boolean;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSizeStep: 2,
  lineHeight: "comfortable",
  columnWidth: "normal",
  typeface: "serif",
  theme: "midnight",
  ambience: true,
};

interface ReadingSettingsContextType {
  settings: ReadingSettings;
  updateSettings: (newSettings: Partial<ReadingSettings>) => void;
  resetSettings: () => void;
}

const ReadingSettingsContext = createContext<ReadingSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
});

const STORAGE_KEY = "midnight_reading_settings";

function applySettingsToDOM(settings: ReadingSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Apply theme
  root.setAttribute("data-theme", settings.theme);
  root.setAttribute("data-ambience", settings.ambience ? "on" : "off");

  // Reader CSS variables
  root.style.setProperty("--reader-step", String(settings.fontSizeStep));
  
  const lhMap: Record<LineHeight, string> = {
    normal: "1.7",
    comfortable: "1.85",
    spacious: "2.05",
  };
  root.style.setProperty("--reader-line-height", lhMap[settings.lineHeight] || "1.85");

  const widthMap: Record<ColumnWidth, string> = {
    narrow: "620px",
    normal: "720px",
    wide: "850px",
  };
  root.style.setProperty("--reader-width", widthMap[settings.columnWidth] || "720px");

  const fontMap: Record<Typeface, string> = {
    serif: "var(--thai-serif)",
    sans: "var(--sans)",
  };
  root.style.setProperty("--reader-font", fontMap[settings.typeface] || "var(--thai-serif)");

  if (settings.theme === "dawn") {
    root.classList.add("theme-dawn");
  } else {
    root.classList.remove("theme-dawn");
  }
}

export function ReadingSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [, startTransition] = useTransition();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        applySettingsToDOM(merged);
      } else {
        applySettingsToDOM(DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.warn("Failed to load reading settings from localStorage", e);
      applySettingsToDOM(DEFAULT_SETTINGS);
    }
  }, []);

  const updateSettings = (newSettings: Partial<ReadingSettings>) => {
    startTransition(() => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to save reading settings", e);
        }
        applySettingsToDOM(updated);
        return updated;
      });
    });
  };

  const resetSettings = () => {
    updateSettings(DEFAULT_SETTINGS);
  };

  return (
    <ReadingSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ReadingSettingsContext.Provider>
  );
}

export function useReadingSettings() {
  return useContext(ReadingSettingsContext);
}
