"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { initSearchIndex, performSearch, SearchResultsPayload } from "@/lib/search-index";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultsPayload>({
    articles: [],
    keywords: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      initSearchIndex().then(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
      });
    } else {
      setQuery("");
      setResults({ articles: [], keywords: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length > 0) {
      setResults(performSearch(query));
    } else {
      setResults({ articles: [], keywords: [] });
    }
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasArticles = results.articles.length > 0;
  const hasKeywords = results.keywords.length > 0;
  const hasResults = hasArticles || hasKeywords;

  const navigateTo = (url: string) => {
    router.push(url);
    onClose();
  };

  const recentChips = [
    "ชายแดนใต้",
    "Nationalism",
    "สิทธิมนุษยชน",
    "Derrida",
    "ประวัติศาสตร์",
  ];

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="search-overlay fixed inset-0 z-[200] flex justify-center items-start pt-[10vh]"
    >
      {/* Background Dim Scrim */}
      <div
        className="search-scrim fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Search Modal Panel */}
      <div className="search-panel relative w-full max-w-2xl bg-[var(--raised)] border border-[var(--line-strong)] shadow-2xl rounded-xs overflow-hidden mx-4 z-10 max-h-[76vh] flex flex-col">
        {/* Search Input Bar */}
        <div className="search-input flex items-center gap-4 px-5 py-3 border-b border-[var(--line-strong)] bg-[var(--bg)]">
          <Icon name="search" size={18} className="text-[var(--gold)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาในคลัง / Search the archive..."
            className="flex-1 bg-transparent text-base md:text-lg text-[var(--text)] placeholder-[var(--muted)] outline-none font-thai py-2"
          />
          <kbd className="font-mono text-[10px] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-2xs uppercase">
            ESC
          </kbd>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {!query.trim() ? (
            /* Empty State: Recent searches & hint */
            <div className="search-empty space-y-4">
              <div className="meta font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                Recent searches
              </div>
              <div className="recent flex flex-wrap gap-2">
                {recentChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setQuery(chip)}
                    className="border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--secondary)] hover:border-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors rounded-xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <p className="font-thai text-sm text-[var(--muted)] pt-3 border-t border-[var(--line)] leading-relaxed">
                ค้นได้ทั้งชื่อเรื่อง ผู้เขียน บุคคล และคำสำคัญ (ทั้งภาษาไทยและอังกฤษ)
              </p>
            </div>
          ) : hasResults ? (
            /* Results State */
            <div className="search-results space-y-6">
              {/* Articles Section */}
              {hasArticles && (
                <div>
                  <div className="meta font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] mb-3">
                    Articles · {results.articles.length}
                  </div>
                  <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
                    {results.articles.map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => navigateTo(`/article/${art.id}`)}
                        className="w-full text-left py-3.5 px-2 flex items-center justify-between hover:bg-[var(--sunken)]/60 transition-colors group"
                      >
                        <div className="flex items-baseline gap-4 pr-4">
                          <span className="result-id font-mono text-xs text-[var(--gold)] font-semibold shrink-0">
                            {art.id}
                          </span>
                          <div>
                            <strong className="font-thai text-sm md:text-base font-normal text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors block leading-snug">
                              <Thai>{art.title_th}</Thai>
                            </strong>
                            {art.title_en && (
                              <em className="font-serif italic text-xs text-[var(--secondary)] block mt-0.5 truncate max-w-lg">
                                {art.title_en}
                              </em>
                            )}
                          </div>
                        </div>
                        <Icon
                          name="arrow"
                          size={12}
                          className="text-[var(--muted)] group-hover:text-[var(--gold)] shrink-0 transition-transform group-hover:translate-x-0.5"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords Section */}
              {hasKeywords && (
                <div>
                  <div className="meta font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] mb-3">
                    Keywords & people
                  </div>
                  <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
                    {results.keywords.map((kw) => (
                      <button
                        key={kw.id}
                        type="button"
                        onClick={() => navigateTo(`/keyword/${encodeURIComponent(kw.id)}`)}
                        className="w-full text-left py-3 px-2 flex items-center justify-between hover:bg-[var(--sunken)]/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="result-id text-[var(--gold)] text-sm shrink-0">
                            ◇
                          </span>
                          <div>
                            <strong className="font-serif text-sm font-normal text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors block">
                              {kw.title_th}
                            </strong>
                            <em className="font-mono text-[10px] text-[var(--muted)] block">
                              Keyword archive
                            </em>
                          </div>
                        </div>
                        <Icon
                          name="arrow"
                          size={12}
                          className="text-[var(--muted)] group-hover:text-[var(--gold)] shrink-0"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No Results State */
            <div className="no-results text-center py-12 space-y-3">
              <span className="font-serif text-5xl text-[var(--gold)] opacity-70 block mb-2">
                ○
              </span>
              <h3 className="font-thai text-xl text-[var(--text)] font-normal">
                ไม่พบข้อความที่ตรงกัน
              </h3>
              <p className="font-thai text-xs sm:text-sm text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                ลองค้นหาด้วยคำที่กว้างขึ้น ตรวจการสะกด หรือค้นหาด้วยชื่อผู้เขียนหรือรหัสบทความ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
