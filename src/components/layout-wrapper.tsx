"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SearchOverlay } from "@/components/search-overlay";
import { CursorLight } from "@/components/cursor-light";
import { ReadingSettingsProvider } from "@/lib/reading-settings";
import { useState, useEffect } from "react";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // '/' when not inside an input, textarea, or contentEditable
      if (e.key === "/" && !searchOpen) {
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName !== "input" && tagName !== "textarea" && !target?.isContentEditable) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  return (
    <ReadingSettingsProvider>
      <CursorLight />
      <div className="app-shell flex flex-col min-h-screen relative z-10">
        <Navbar onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </ReadingSettingsProvider>
  );
}
