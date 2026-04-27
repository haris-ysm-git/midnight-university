"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";
import { searchArticles, SearchResult, initSearchIndex } from "@/lib/search-index";
import { useRouter } from "next/navigation";
import { ACCENT, BG, EASE } from "@/lib/design-tokens";

export function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle search dynamically
  useEffect(() => {
    if (query.trim().length > 0) {
      setResults(searchArticles(query));
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  // Handle keyboard shortcuts (Cmd+K / Ctrl+K to open handled in parent)
  useEffect(() => {
    if (isOpen) {
      initSearchIndex().then(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        router.push(`/article/${results[selectedIndex].id}`);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto max-w-3xl w-[90vw] bg-[#1A1A1A] border border-white/10 shadow-2xl rounded-sm overflow-hidden"
            style={{ backgroundColor: BG }}
          >
            {/* Search Input */}
            <div className="flex items-center px-6 py-4 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40 mr-4" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by title, keyword, or content... (Thai & English)"
                className="flex-1 bg-transparent text-white font-thai text-xl md:text-2xl outline-none placeholder:text-white/20"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query && results.length === 0 ? (
                <div className="py-16 text-center text-white/40 font-mono text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={result.id}
                        className={`px-6 py-4 mx-2 rounded-sm cursor-pointer transition-colors ${
                          isSelected ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                        onClick={() => {
                          router.push(`/article/${result.id}`);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-[10px] tracking-[0.2em] text-accent mt-1.5 min-w-[36px]">
                            {result.id}
                          </div>
                          <div>
                            <div className={`font-thai text-xl mb-1 ${isSelected ? "text-white" : "text-white/90"}`}>
                              {result.title_th}
                            </div>
                            <div className="font-serif text-sm text-white/50 italic mb-2 line-clamp-1">
                              {result.title_en}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {result.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[9px] tracking-widest text-white/30 uppercase">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/5 bg-black/20 flex justify-between items-center text-[10px] font-mono tracking-widest text-white/30">
              <div className="flex gap-4">
                <span><kbd className="font-sans px-1.5 py-0.5 rounded border border-white/10 bg-white/5 mr-1">↑</kbd><kbd className="font-sans px-1.5 py-0.5 rounded border border-white/10 bg-white/5 mr-1">↓</kbd> to navigate</span>
                <span><kbd className="font-sans px-1.5 py-0.5 rounded border border-white/10 bg-white/5 mr-1">↵</kbd> to select</span>
                <span><kbd className="font-sans px-1.5 py-0.5 rounded border border-white/10 bg-white/5 mr-1">ESC</kbd> to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
