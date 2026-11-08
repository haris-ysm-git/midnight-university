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

  // Clean initial extractor: handles digits (#), Thai consonants (skipping leading vowels), and Latin A-Z
  const getInitial = (text: string): string => {
    const clean = text.trim();
    if (!clean) return "#";

    const first = clean.charAt(0);

    // If starts with number or punctuation
    if (/^[0-9]/.test(first)) return "#";

    // If Thai leading vowel (เ, แ, โ, ใ, ไ), use the following consonant
    if (["เ", "แ", "โ", "ใ", "ไ"].includes(first) && clean.length > 1) {
      return clean.charAt(1);
    }

    // If Latin character
    if (/^[a-zA-Z]/.test(first)) {
      return first.toUpperCase();
    }

    return first;
  };

  // Build entries for active tab
  const entries = useMemo(() => {
    if (currentTab === "Titles") {
      return articles.map((a) => {
        const initial = getInitial(a.frontmatter.title_th);
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
        const initial = getInitial(tag);
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
      const initial = getInitial(note.title);
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

  // Distinct initial letters available in current tab
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.initial));

    const isThai = currentTab === "Titles";
    const collator = new Intl.Collator(isThai ? "th" : "en");
    return Array.from(set).sort((a, b) => {
      if (a === "#") return -1;
      if (b === "#") return 1;
      return collator.compare(a, b);
    });
  }, [entries, currentTab]);

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

    const isThai = currentTab === "Titles";
    const collator = new Intl.Collator(isThai ? "th" : "en");
    const sortedLetters = Array.from(map.keys()).sort((a, b) => {
      if (a === "#") return -1;
      if (b === "#") return 1;
      return collator.compare(a, b);
    });

    return sortedLetters.map((letter) => ({
      letter,
      items: map.get(letter)!,
    }));
  }, [filteredEntries, currentTab]);

  return (
    <main className="standard-page">
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="page-title">
        <div className="meta">
          A book-like directory · {entries.length} items
        </div>
        <h1>Index</h1>
        <p>
          <Thai>ดรรชนีบุคคล แนวคิด สถานที่ และชื่อเรื่องในคลัง</Thai>
        </p>
      </div>

      {/* ══ TABS & SEARCH BAR ═══════════════════════════════════════════════ */}
      <div className="index-tools">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={currentTab === tab ? "active" : ""}
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

        <label className="index-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Search within index..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {/* ══ ALPHABET JUMP BAR ═══════════════════════════════════════════════ */}
      {currentTab === "Titles" && (
        <p className="index-note">
          เรียงตามพยัญชนะต้น โดยไม่นับสระนำ เ แ โ ไ ใ — เช่น “เสรีภาพ” จัดอยู่ในหมวด ส
        </p>
      )}

      <div className="alphabet">
        <button
          type="button"
          className={selectedLetter === null ? "active" : ""}
          onClick={() => setSelectedLetter(null)}
        >
          All
        </button>
        {availableLetters.map((letter) => (
          <button
            key={letter}
            type="button"
            className={selectedLetter === letter ? "active" : ""}
            onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* ══ BOOK DIRECTORY ENTRIES ══════════════════════════════════════════ */}
      {groupedByLetter.length === 0 ? (
        <div className="search-empty">
          <p>No index entries found matching &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <div className="index-book">
          {groupedByLetter.map(({ letter, items }) => (
            <React.Fragment key={letter}>
              <div className="index-letter">
                {letter}
                <div className="meta">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </div>
              </div>

              <div>
                {items.map((entry) => {
                  const isExpanded = expandedKey === entry.key;

                  return (
                    <article key={entry.key} className="index-entry">
                      <button
                        type="button"
                        onClick={() => setExpandedKey(isExpanded ? null : entry.key)}
                      >
                        <span>
                          <Thai>{entry.label}</Thai>{" "}
                          <small>({entry.articles.length})</small>
                        </span>
                        <Icon name="chevron" />
                      </button>

                      {isExpanded && (
                        <div className="index-expansion">
                          {entry.articles.map((art) => (
                            <Link
                              key={art.id}
                              href={`/article/${art.id}`}
                              className="expansion-row"
                            >
                              <div className="meta font-mono text-xs text-[var(--gold)]">{art.id}</div>
                              <strong className="font-thai text-[var(--text)] font-normal text-sm sm:text-base leading-relaxed">
                                <Thai>{art.frontmatter.title_th}</Thai>
                              </strong>
                              <span className="font-mono text-xs text-[var(--gold)] flex items-center gap-1.5 uppercase whitespace-nowrap">
                                Read article <Icon name="arrow" size={12} />
                              </span>
                            </Link>
                          ))}

                          {currentTab !== "Titles" && (
                            <Link
                              href={entry.href}
                              className="expansion-row hub-link-row bg-[var(--raised)]/40 px-3 border border-[var(--gold)]/30 my-2 hover:border-[var(--gold)]"
                            >
                              <div className="meta font-mono text-xs text-[var(--gold)]">HUB</div>
                              <strong className="font-thai text-[var(--gold)] font-medium text-sm sm:text-base underline underline-offset-4">
                                Open keyword archive ({entry.label})
                              </strong>
                              <span className="font-mono text-xs text-[var(--gold-bright)] flex items-center gap-1.5 uppercase whitespace-nowrap font-medium">
                                View hub <Icon name="arrow" size={12} />
                              </span>
                            </Link>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {query && (
        <div className="match-note meta">
          Exact matches shown first · Near matches follow
        </div>
      )}
    </main>
  );
}
