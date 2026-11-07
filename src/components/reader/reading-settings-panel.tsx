"use client";

import React from "react";
import { useReadingSettings, ColumnWidth, LineHeight, Typeface } from "@/lib/reading-settings";
import { ThemeMode } from "@/lib/design-tokens";
import { Icon } from "@/components/icons";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReadingSettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, resetSettings } = useReadingSettings();

  if (!isOpen) return null;

  const fontSizes = [0, 1, 2, 3, 4];
  const lineHeights: { id: LineHeight; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "comfortable", label: "Comfort" },
    { id: "spacious", label: "Spacious" },
  ];
  const widths: { id: ColumnWidth; label: string }[] = [
    { id: "narrow", label: "620px" },
    { id: "normal", label: "720px" },
    { id: "wide", label: "850px" },
  ];
  const themes: { id: ThemeMode; label: string; swatch: string }[] = [
    { id: "midnight", label: "Midnight", swatch: "#1B1B1A" },
    { id: "ink", label: "Ink", swatch: "#050505" },
    { id: "candlelight", label: "Candlelight", swatch: "#241D18" },
    { id: "dawn", label: "Dawn", swatch: "#EEE6D8" },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-70 bg-black/40 backdrop-blur-xs md:hidden"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-label="Reading appearance settings"
        className="settings-panel shadow-2xl fixed z-80"
      >
        <div className="settings-head">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest text-[var(--gold)] uppercase">
              Appearance
            </span>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            className="icon-button"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Font Size */}
        <label>
          <span>Type Size</span>
          <div className="size-picker">
            <small>A</small>
            <div className="flex gap-1 flex-1 justify-center">
              {fontSizes.map((step) => (
                <button
                  key={step}
                  type="button"
                  className={settings.fontSizeStep === step ? "active" : ""}
                  onClick={() => updateSettings({ fontSizeStep: step })}
                >
                  {step + 1}
                </button>
              ))}
            </div>
            <big>A</big>
          </div>
        </label>

        {/* Typeface Serif vs Sans */}
        <label>
          <span>Typeface</span>
          <div className="option-row">
            <button
              type="button"
              className={settings.typeface === "serif" ? "active" : ""}
              onClick={() => updateSettings({ typeface: "serif" })}
            >
              Serif (ทางการ/วรรณกรรม)
            </button>
            <button
              type="button"
              className={settings.typeface === "sans" ? "active" : ""}
              onClick={() => updateSettings({ typeface: "sans" })}
            >
              Sans (อ่านง่าย)
            </button>
          </div>
        </label>

        {/* Line Height */}
        <label>
          <span>Line Spacing</span>
          <div className="option-row">
            {lineHeights.map((lh) => (
              <button
                key={lh.id}
                type="button"
                className={settings.lineHeight === lh.id ? "active" : ""}
                onClick={() => updateSettings({ lineHeight: lh.id })}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </label>

        {/* Column Width */}
        <label>
          <span>Column Width</span>
          <div className="option-row">
            {widths.map((w) => (
              <button
                key={w.id}
                type="button"
                className={settings.columnWidth === w.id ? "active" : ""}
                onClick={() => updateSettings({ columnWidth: w.id })}
              >
                {w.label}
              </button>
            ))}
          </div>
        </label>

        {/* Theme */}
        <label>
          <span>Color Atmosphere</span>
          <div className="themes">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                className={settings.theme === t.id ? "active" : ""}
                onClick={() => updateSettings({ theme: t.id })}
              >
                <i style={{ backgroundColor: t.swatch }} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </label>

        {/* Ambience Toggle */}
        <label>
          <div className="flex items-center justify-between pt-2">
            <span className="!mb-0">Ambient Embers & Light</span>
            <button
              type="button"
              className={`chip ${settings.ambience ? "is-active" : ""}`}
              onClick={() => updateSettings({ ambience: !settings.ambience })}
            >
              {settings.ambience ? "ON" : "OFF"}
            </button>
          </div>
        </label>

        {/* Reset */}
        <div className="pt-4 border-t border-[var(--line)] mt-4 flex justify-between">
          <button
            type="button"
            className="text-[10px] font-mono tracking-widest text-[var(--muted)] hover:text-[var(--text)] uppercase"
            onClick={resetSettings}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            className="text-[10px] font-mono tracking-widest text-[var(--gold)] uppercase"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
