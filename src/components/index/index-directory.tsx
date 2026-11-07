"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Article, TagHubNote } from "@/lib/content";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

interface IndexDirectoryProps {
  articles: Article[];
  tagNotes: TagHubNote[];
}

export function IndexDirectory({ articles, tagNotes }: IndexDirectoryProps) {
  const tabs = ["Keywords", "People", "Places", "Tags", "Titles"] as const;
  type TabType = (typeof tabs)[number];

  const [currentTab, setCurrentTab] = useState<TabType>("Keywords");
  const [query, setQuery] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Group tag notes by type
  const categorizedNotes = useMemo(() => {
    const people = tagNotes.filter((n) => n.type === "person");
    const places = tagNotes.filter((n) => n.type === "place");
    const concepts = tagNotes.filter((n) => n.type === "concept" || (!n.type && currentTab === "Keywords"));

    // Extract all tags from articles
    const allTagsMap = new Map<string, Article[]>();
    for (const a of articles) {
      for (const t of a.frontmatter.tags) {
        if (!allTagsMap.has(t)) allTagsMap.set(t, []);
        allTagsMap.get(t)!.push(a);
      }
    }

    return {
      people,
      places,
      concepts,
      allTagsMap,
    };
  }, [tagNotes, articles, currentTab]);

  // Thai consonant extractor ignoring leading vowels (เ แ โ ไ ใ)
  const getThaiInitialConsonant = (title: string): string => {
    const clean = title.trim();
    if (!clean) return "#";
    const first = clean.charAt(0);
    if (["เ", "แ", "โ", "ใ", "ไ"].includes(first) && clean.length > 1) {
      return clean.charAt(1);
    }
    return first;
  };

  // Build entries for active tab
  const entries = useMemo(() => {
    if (currentTab === "Titles") {
      return articles.map((a) => {
        const initial = getThaiInitialConsonant(a.frontmatter.title_th);
        return {
          key: a.id,
          label: a.frontmatter.title_th,
          subLabel: a.frontmatter.title_en,
          initial,
          articles: [a],
          href: `/article/${a.id}`,
        };
      });
    }

    if (currentTab === "Tags") {
      const result: Array<{
        key: string;
        label: string;
        subLabel?: string;
        initial: string;
        articles: Article[];
        href: string;
      }> = [];

      categorizedNotes.allTagsMap.forEach((arts, tag) => {
        const initial = tag.charAt(0).toUpperCase();
        result.push({
          key: tag,
          label: tag,
          initial,
          articles: arts,
          href: `/keyword/${encodeURIComponent(tag)}`,
        });
      });
      return result;
    }

    // Tag notes (Keywords / People / Places)
    let sourceNotes = tagNotes;
    if (currentTab === "People") {
      sourceNotes = categorizedNotes.people.length > 0 ? categorizedNotes.people : tagNotes.slice(0, 10);
    } else if (currentTab === "Places") {
      sourceNotes = categorizedNotes.places.length > 0 ? categorizedNotes.places : tagNotes.slice(5, 15);
    }

    return sourceNotes.map((note) => {
      const initial = note.title.charAt(0).toUpperCase();
      const matchingArticles = articles.filter(
        (a) =>
          a.frontmatter.tags.some((t) => t.toLowerCase() === note.title.toLowerCase()) ||
          a.content.includes(note.title)
      );

      return {
        key: note.slug,
        label: note.title,
        subLabel: note.aliases.length > 0 ? note.aliases.join(", ") : undefined,
        initial,
        articles: matchingArticles,
        href: `/keyword/${encodeURIComponent(note.slug)}`,
      };
    });
  }, [currentTab, articles, tagNotes, categorizedNotes]);

  // Filter entries by search query and optional letter filter
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesQuery =
        !query ||
        e.label.toLowerCase().includes(query.toLowerCase()) ||
        (e.subLabel && e.subLabel.toLowerCase().includes(query.toLowerCase()));

      const matchesLetter = !selectedLetter || e.initial === selectedLetter;
      return matchesQuery && matchesLetter;
    });
  }, [entries, query, selectedLetter]);

  // Group filtered entries by initial letter
  const groupedByLetter = useMemo(() => {
    const map = new Map<string, typeof filteredEntries>();
    for (const e of filteredEntries) {
      if (!map.has(e.initial)) {
        map.set(e.initial, []);
      }
      map.get(e.initial)!.push(e);
    }

    // Sort letters using Thai or English collator
    const isThai = currentTab === "Titles";
    const collator = new Intl.Collator(isThai ? "th" : "en");
    const sortedLetters = Array.from(map.keys()).sort((a, b) => collator.compare(a, b));

    return sortedLetters.map((letter) => ({
      letter,
      items: map.get(letter)!,
    }));
  }, [filteredEntries, currentTab]);

  const thaiAlphabet = "ก ข ค ง จ ฉ ช ซ ญ ด ต ถ ท ธ น บ ป ผ พ ภ ม ย ร ล ว ศ ส ห อ ฮ".split(" ");
  const latinAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="standard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="page-title mb-8">
        <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-3">
          A book-like directory · {entries.length} items
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[var(--text)] tracking-tight mb-4">
          Index
        </h1>
        <p className="font-thai text-lg sm:text-xl text-[var(--secondary)] font-normal leading-relaxed">
          <Thai>ดรรชนีบุคคล แนวคิด สถานที่ และชื่อเรื่องในคลัง</Thai>
        </p>
      </div>

      {/* ══ TABS & SEARCH BAR ═══════════════════════════════════════════════ */}
      <div className="index-tools flex flex-col sm:flex-row sm:items-center justify-between border-t border-b border-[var(--line)] mb-8">
        <div className="tabs flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
                currentTab === tab
                  ? "border-[var(--gold)] text-[var(--gold-bright)] font-semibold"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              onClick={() => {
                setCurrentTab(tab);
                setSelectedLetter(null);
                setExpandedKey(null);
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <label className="index-search flex items-center gap-3 px-4 py-2 border-t sm:border-t-0 sm:border-l border-[var(--line)]">
          <Icon name="search" size={16} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search within index..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none py-1.5 w-full sm:w-56"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
            >
              ✕
            </button>
          )}
        </label>
      </div>

      {/* ══ ALPHABET JUMP BAR ═══════════════════════════════════════════════ */}
      {currentTab === "Titles" ? (
        <div className="mb-8">
          <div className="alphabet thai-alphabet flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              className={`w-8 h-8 font-thai text-xs border rounded-xs transition-colors ${
                selectedLetter === null
                  ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)]"
                  : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)]"
              }`}
              onClick={() => setSelectedLetter(null)}
            >
              All
            </button>
            {thaiAlphabet.map((letter) => (
              <button
                key={letter}
                type="button"
                className={`w-8 h-8 font-thai text-xs border rounded-xs transition-colors ${
                  selectedLetter === letter
                    ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                }`}
                onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
              >
                {letter}
              </button>
            ))}
          </div>
          <p className="index-note font-mono text-[11px] text-[var(--muted)] leading-relaxed">
            เรียงตามพยัญชนะต้น โดยไม่นับสระนำ เ แ โ ไ ใ — เช่น “เสรีภาพ” จัดอยู่ในหมวด ส
          </p>
        </div>
      ) : (
        <div className="alphabet flex flex-wrap gap-1.5 mb-8">
          <button
            type="button"
            className={`w-8 h-8 font-mono text-xs border rounded-xs transition-colors ${
              selectedLetter === null
                ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)]"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)]"
            }`}
            onClick={() => setSelectedLetter(null)}
          >
            All
          </button>
          {latinAlphabet.map((letter) => (
            <button
              key={letter}
              type="button"
              className={`w-8 h-8 font-mono text-xs border rounded-xs transition-colors ${
                selectedLetter === letter
                  ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)]"
                  : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              }`}
              onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {/* ══ BOOK DIRECTORY ENTRIES ══════════════════════════════════════════ */}
      {groupedByLetter.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted)] font-mono text-sm">
          No index entries found matching &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="space-y-12">
          {groupedByLetter.map(({ letter, items }) => (
            <div
              key={letter}
              className="index-book grid grid-cols-1 md:grid-cols-[140px_1fr] border-t border-[var(--line)] pt-6 gap-6"
            >
              <div className="index-letter">
                <div className="font-thai text-5xl sm:text-6xl text-[var(--gold)] font-light">
                  {letter}
                </div>
                <div className="meta font-mono text-xs text-[var(--muted)] tracking-wider mt-2">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </div>
              </div>

              <div className="divide-y divide-[var(--line)]">
                {items.map((entry) => {
                  const isExpanded = expandedKey === entry.key;

                  return (
                    <article key={entry.key} className="index-entry">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between py-4 text-left group hover:text-[var(--gold-bright)] transition-colors"
                        onClick={() => setExpandedKey(isExpanded ? null : entry.key)}
                      >
                        <div>
                          <span className="font-serif text-xl sm:text-2xl text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors mr-3">
                            <Thai>{entry.label}</Thai>
                          </span>
                          <span className="font-mono text-xs text-[var(--muted)]">
                            ({entry.articles.length})
                          </span>
                          {entry.subLabel && (
                            <span className="font-serif italic text-xs text-[var(--secondary)] block mt-1">
                              {entry.subLabel}
                            </span>
                          )}
                        </div>
                        <Icon
                          name="chevron"
                          size={14}
                          className={`transition-transform duration-200 opacity-60 ${
                            isExpanded ? "rotate-180 text-[var(--gold)]" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="index-expansion border-l border-[var(--gold)] pl-5 py-3 my-2 space-y-3 bg-[var(--raised)]/30 rounded-r-xs">
                          {entry.articles.map((art) => (
                            <div
                              key={art.id}
                              className="flex items-baseline justify-between gap-4 py-1"
                            >
                              <div className="flex items-baseline gap-3">
                                <span className="font-mono text-xs text-[var(--gold)] font-semibold">
                                  {art.id}
                                </span>
                                <Link
                                  href={`/article/${art.id}`}
                                  className="font-thai text-sm text-[var(--text)] hover:text-[var(--gold-bright)] hover:underline leading-snug"
                                >
                                  <Thai>{art.frontmatter.title_th}</Thai>
                                </Link>
                              </div>
                              <span className="font-mono text-[10px] text-[var(--muted)] whitespace-nowrap">
                                {art.frontmatter.date}
                              </span>
                            </div>
                          ))}

                          {currentTab !== "Titles" && (
                            <div className="pt-2">
                              <Link
                                href={entry.href}
                                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase text-[var(--gold)] hover:underline tracking-wider"
                              >
                                Open keyword archive <Icon name="arrow" size={10} />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
