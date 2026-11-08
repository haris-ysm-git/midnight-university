"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Article, TagHubNote, RandomParagraph } from "@/lib/content";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";
import { RandomScroll } from "@/components/random-scroll";

interface RandomMosaicProps {
  initialArticles: Article[];
  tagNotes: TagHubNote[];
}

// Cultural & academic symbols relevant to History, Philosophy, Architecture, Anthropology
const ACADEMIC_EMOJIS = [
  { symbol: "📜", label: "History · วรรณกรรมและบันทึก" },
  { symbol: "🕯️", label: "Philosophy · แสงสว่างยามเที่ยงคืน" },
  { symbol: "🏛️", label: "Architecture · โครงสร้างและสถาปัตย์" },
  { symbol: "📖", label: "Anthropology · มนุษยวิทยาและสังคม" },
  { symbol: "⚖️", label: "Justice · นิติธรรมและสิทธิ" },
  { symbol: "🧭", label: "Epistemology · เข็มทิศทางปัญญา" },
  { symbol: "🏺", label: "Archaeology · โบราณคดีและมรดก" },
  { symbol: "⏳", label: "Chronicle · กาลเวลาและประวัติศาสตร์" },
  { symbol: "✒️", label: "Critique · น้ำหมึกและบทวิพากษ์" },
  { symbol: "🗝️", label: "Archive · กุญแจสู่คลังความรู้" },
];

export function RandomMosaic({ initialArticles, tagNotes }: RandomMosaicProps) {
  const [edition, setEdition] = useState(1);
  const [seed, setSeed] = useState(0);
  const [viewMode, setViewMode] = useState<"newspaper" | "scroll">("newspaper");

  // Get current reading date formatted for the newspaper header
  const todayFormatted = useMemo(() => {
    const now = new Date();
    const thaiDate = now.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const engDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return { thaiDate, engDate };
  }, []);

  // Pick random articles for the newspaper edition
  const articlesCount = initialArticles.length;
  const pickedArticles = useMemo(() => {
    if (articlesCount === 0) return [];
    const picks: Article[] = [];
    const primes = [3, 7, 11, 17, 23, 29, 37];
    for (let i = 0; i < 6; i++) {
      const idx = (seed * primes[i] + i * 5) % articlesCount;
      const art = initialArticles[idx] || initialArticles[i % articlesCount];
      if (!picks.some((p) => p.id === art.id)) {
        picks.push(art);
      }
    }
    return picks;
  }, [initialArticles, seed, articlesCount]);

  // Pick random keywords from tag notes (folder 03.tag)
  const tagsCount = tagNotes.length || 1;
  const pickedTags = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 8; i++) {
      const idx = (seed * 13 + i * 7 + 3) % tagsCount;
      const tag = tagNotes[idx]?.title || "Philosophy";
      if (!list.includes(tag)) list.push(tag);
    }
    return list;
  }, [tagNotes, seed, tagsCount]);

  // Pick random cultural/academic symbols
  const pickedEmojis = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const idx = (seed + i * 3) % ACADEMIC_EMOJIS.length;
      return ACADEMIC_EMOJIS[idx];
    });
  }, [seed]);

  const handleReshuffle = () => {
    setEdition((prev) => prev + 1);
    setSeed((prev) => prev + Math.floor(Math.random() * 80) + 1);
  };

  // Convert articles to paragraphs for continuous scroll fallback
  const scrollParagraphs: RandomParagraph[] = useMemo(() => {
    return initialArticles.slice(0, 15).map((a) => ({
      text: a.frontmatter.description || a.content.slice(0, 200),
      fullText: a.content.slice(0, 500),
      articleId: a.id,
      articleTitle: a.frontmatter.title_th,
      author: a.frontmatter.author || "Midnight University",
      date: a.frontmatter.date,
    }));
  }, [initialArticles]);

  return (
    <main className="random-page standard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ══ VINTAGE NEWSPAPER MASTHEAD ═══════════════════════════════════════ */}
      <header className="newspaper-masthead border-b-2 border-double border-[var(--line-strong)] pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] mb-3 border-b border-[var(--line)] pb-2">
          <span>MIDNIGHT UNIVERSITY ARCHIVE · EST. 1997</span>
          <span>{todayFormatted.engDate} · {todayFormatted.thaiDate}</span>
          <span>EDITION {String(edition).padStart(2, "0")} · ISSUE NO. {seed + 101}</span>
        </div>

        <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 pt-2">
          <div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-[var(--text)] tracking-tight">
              The Midnight Gazette
            </h1>
            <p className="font-thai text-sm sm:text-base text-[var(--secondary)] mt-1">
              <Thai>หนังสือพิมพ์มหาวิทยาลัยเที่ยงคืน · กลางวันมืด กลางคืนกลับสว่าง</Thai>
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="border border-[var(--line)] flex text-[10px] font-mono uppercase">
              <button
                type="button"
                className={`px-3 py-1.5 transition-colors ${
                  viewMode === "newspaper"
                    ? "bg-[var(--gold)] text-[var(--bg)] font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
                onClick={() => setViewMode("newspaper")}
              >
                Newspaper
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 border-l border-[var(--line)] transition-colors ${
                  viewMode === "scroll"
                    ? "bg-[var(--gold)] text-[var(--bg)] font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
                onClick={() => setViewMode("scroll")}
              >
                Scroll
              </button>
            </div>

            <button
              type="button"
              onClick={handleReshuffle}
              className="outline-button flex items-center gap-1.5 border border-[var(--line)] px-3 py-1.5 font-mono text-[11px] text-[var(--gold)] hover:border-[var(--gold)] hover:bg-[var(--raised)] transition-colors uppercase tracking-wider"
            >
              <Icon name="shuffle" size={13} /> Reshuffle
            </button>
          </div>
        </div>
      </header>

      {/* ══ VIEW: CONTINUOUS SCROLL MODE (PRESERVED) ════════════════════════ */}
      {viewMode === "scroll" ? (
        <div className="py-6">
          <RandomScroll paragraphs={scrollParagraphs} />
        </div>
      ) : (
        /* ══ VIEW: NEWSPAPER BENTO MOSAIC (6-COL DESKTOP / 2-COL MOBILE INTERLEAVED) ══ */
        <>
          <div className="mosaic">
            {/* Block 1: Lead Story (Wide 3-col x 2-row on Desktop) */}
            {pickedArticles[0] && (
              <Link
                href={`/article/${pickedArticles[0].id}`}
                className="tile excerpt wide tall bg-[var(--raised)] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="meta font-mono text-[10px] text-[var(--gold)] uppercase tracking-wider">
                      ★ LEAD STORY · NO. {pickedArticles[0].id}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--muted)]">
                      {pickedArticles[0].frontmatter.date}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors leading-tight mb-3">
                    <Thai>{pickedArticles[0].frontmatter.title_th}</Thai>
                  </h2>
                  <blockquote className="font-thai text-sm sm:text-base text-[var(--secondary)] line-clamp-4 leading-relaxed italic">
                    <Thai>{pickedArticles[0].frontmatter.description || pickedArticles[0].content.slice(0, 240)}</Thai>
                  </blockquote>
                </div>
                <div className="pt-3 border-t border-[var(--line)] flex justify-between items-center text-xs font-serif text-[var(--muted)]">
                  <span>{pickedArticles[0].frontmatter.author || "Midnight University"}</span>
                  <span className="font-mono text-[10px] text-[var(--gold)] uppercase">Read Article →</span>
                </div>
              </Link>
            )}

            {/* Block 2: 1x1 Keyword Tile from 03.tag */}
            <Link
              href={`/keyword/${encodeURIComponent(pickedTags[0] || "Philosophy")}`}
              className="tile keyword"
              title={`Explore keyword: ${pickedTags[0]}`}
            >
              <span className="font-mono text-[9px] text-[var(--gold)] block mb-1 uppercase tracking-wider">KEYWORD</span>
              <span className="font-serif text-sm text-[var(--text)] underline underline-offset-2">
                {pickedTags[0]}
              </span>
            </Link>

            {/* Block 3: Cultural/Academic Emoji Symbol */}
            <div className="tile glyph" title={pickedEmojis[0]?.label} aria-label={pickedEmojis[0]?.label}>
              <div className="stamp text-3xl select-none" role="img">{pickedEmojis[0]?.symbol}</div>
              <span className="font-mono text-[8px] text-[var(--muted)] mt-1 uppercase text-center truncate max-w-full">
                {pickedEmojis[0]?.label.split("·")[0]}
              </span>
            </div>

            {/* Block 4: Dither visual tile */}
            <div className="tile" aria-hidden="true">
              <div className="dither dither-1">
                <span>Dither 1×1</span>
              </div>
            </div>

            {/* Block 5: 1x1 Keyword Tile */}
            <Link
              href={`/keyword/${encodeURIComponent(pickedTags[1] || "History")}`}
              className="tile keyword"
              title={`Explore keyword: ${pickedTags[1]}`}
            >
              <span className="font-mono text-[9px] text-[var(--gold)] block mb-1 uppercase tracking-wider">KEYWORD</span>
              <span className="font-serif text-sm text-[var(--text)] underline underline-offset-2">
                {pickedTags[1]}
              </span>
            </Link>

            {/* Block 6: Secondary Article (Wide 2-col) */}
            {pickedArticles[1] && (
              <Link
                href={`/article/${pickedArticles[1].id}`}
                className="tile excerpt wide group"
              >
                <div className="meta">NO. {pickedArticles[1].id} · {pickedArticles[1].frontmatter.date}</div>
                <h3 className="font-serif text-lg font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors mb-2">
                  <Thai>{pickedArticles[1].frontmatter.title_th}</Thai>
                </h3>
                <blockquote>
                  <Thai>{pickedArticles[1].frontmatter.description || pickedArticles[1].frontmatter.title_th}</Thai>
                </blockquote>
                <span>{pickedArticles[1].frontmatter.title_en || pickedArticles[1].frontmatter.author}</span>
                <i className="corner" />
              </Link>
            )}

            {/* Block 7: Cultural/Academic Emoji Symbol */}
            <div className="tile glyph" title={pickedEmojis[1]?.label} aria-label={pickedEmojis[1]?.label}>
              <div className="stamp text-3xl select-none" role="img">{pickedEmojis[1]?.symbol}</div>
              <span className="font-mono text-[8px] text-[var(--muted)] mt-1 uppercase text-center truncate max-w-full">
                {pickedEmojis[1]?.label.split("·")[0]}
              </span>
            </div>

            {/* Block 8: 1x1 Keyword Tile */}
            <Link
              href={`/keyword/${encodeURIComponent(pickedTags[2] || "Culture")}`}
              className="tile keyword"
              title={`Explore keyword: ${pickedTags[2]}`}
            >
              <span className="font-mono text-[9px] text-[var(--gold)] block mb-1 uppercase tracking-wider">KEYWORD</span>
              <span className="font-serif text-sm text-[var(--text)] underline underline-offset-2">
                {pickedTags[2]}
              </span>
            </Link>

            {/* Block 9: Third Article (Wide 2-col) */}
            {pickedArticles[2] && (
              <Link
                href={`/article/${pickedArticles[2].id}`}
                className="tile excerpt wide group"
              >
                <div className="meta">NO. {pickedArticles[2].id} · {pickedArticles[2].frontmatter.reading_time}</div>
                <h3 className="font-serif text-lg font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors mb-2">
                  <Thai>{pickedArticles[2].frontmatter.title_th}</Thai>
                </h3>
                <blockquote>
                  <Thai>{pickedArticles[2].frontmatter.description || pickedArticles[2].frontmatter.title_th}</Thai>
                </blockquote>
                <span>{pickedArticles[2].frontmatter.title_en || pickedArticles[2].frontmatter.author}</span>
                <i className="corner" />
              </Link>
            )}

            {/* Block 10: Dither Visual Tile (Wide 2-col) */}
            <div className="tile wide" aria-hidden="true">
              <div className="dither dither-3">
                <span>Dither 2×1</span>
              </div>
            </div>

            {/* Block 11: Cultural/Academic Emoji Symbol */}
            <div className="tile glyph" title={pickedEmojis[2]?.label} aria-label={pickedEmojis[2]?.label}>
              <div className="stamp text-3xl select-none" role="img">{pickedEmojis[2]?.symbol}</div>
              <span className="font-mono text-[8px] text-[var(--muted)] mt-1 uppercase text-center truncate max-w-full">
                {pickedEmojis[2]?.label.split("·")[0]}
              </span>
            </div>

            {/* Block 12: Fourth Article (Middle / Tall) */}
            {pickedArticles[3] && (
              <Link
                href={`/article/${pickedArticles[3].id}`}
                className="tile excerpt wide group"
              >
                <div className="meta">NO. {pickedArticles[3].id} · {pickedArticles[3].frontmatter.date}</div>
                <h3 className="font-serif text-lg font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors mb-2">
                  <Thai>{pickedArticles[3].frontmatter.title_th}</Thai>
                </h3>
                <blockquote>
                  <Thai>{pickedArticles[3].frontmatter.description || pickedArticles[3].frontmatter.title_th}</Thai>
                </blockquote>
                <span>{pickedArticles[3].frontmatter.title_en || pickedArticles[3].frontmatter.author}</span>
                <i className="corner" />
              </Link>
            )}

            {/* Block 13: 1x1 Keyword Tile */}
            <Link
              href={`/keyword/${encodeURIComponent(pickedTags[3] || "Anthropology")}`}
              className="tile keyword"
              title={`Explore keyword: ${pickedTags[3]}`}
            >
              <span className="font-mono text-[9px] text-[var(--gold)] block mb-1 uppercase tracking-wider">KEYWORD</span>
              <span className="font-serif text-sm text-[var(--text)] underline underline-offset-2">
                {pickedTags[3]}
              </span>
            </Link>

            {/* Block 14: Cultural/Academic Emoji Symbol */}
            <div className="tile glyph" title={pickedEmojis[3]?.label} aria-label={pickedEmojis[3]?.label}>
              <div className="stamp text-3xl select-none" role="img">{pickedEmojis[3]?.symbol}</div>
              <span className="font-mono text-[8px] text-[var(--muted)] mt-1 uppercase text-center truncate max-w-full">
                {pickedEmojis[3]?.label.split("·")[0]}
              </span>
            </div>

            {/* Block 15: Fifth Article */}
            {pickedArticles[4] && (
              <Link
                href={`/article/${pickedArticles[4].id}`}
                className="tile excerpt wide group"
              >
                <div className="meta">NO. {pickedArticles[4].id} · {pickedArticles[4].frontmatter.date}</div>
                <h3 className="font-serif text-lg font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors mb-2">
                  <Thai>{pickedArticles[4].frontmatter.title_th}</Thai>
                </h3>
                <blockquote>
                  <Thai>{pickedArticles[4].frontmatter.description || pickedArticles[4].frontmatter.title_th}</Thai>
                </blockquote>
                <span>{pickedArticles[4].frontmatter.title_en || pickedArticles[4].frontmatter.author}</span>
                <i className="corner" />
              </Link>
            )}

            {/* Block 16: 1x1 Keyword Tile */}
            <Link
              href={`/keyword/${encodeURIComponent(pickedTags[4] || "Society")}`}
              className="tile keyword"
              title={`Explore keyword: ${pickedTags[4]}`}
            >
              <span className="font-mono text-[9px] text-[var(--gold)] block mb-1 uppercase tracking-wider">KEYWORD</span>
              <span className="font-serif text-sm text-[var(--text)] underline underline-offset-2">
                {pickedTags[4]}
              </span>
            </Link>

            {/* Block 17: Cultural/Academic Emoji Symbol */}
            <div className="tile glyph" title={pickedEmojis[4]?.label} aria-label={pickedEmojis[4]?.label}>
              <div className="stamp text-3xl select-none" role="img">{pickedEmojis[4]?.symbol}</div>
              <span className="font-mono text-[8px] text-[var(--muted)] mt-1 uppercase text-center truncate max-w-full">
                {pickedEmojis[4]?.label.split("·")[0]}
              </span>
            </div>

            {/* Block 18: Sixth Article */}
            {pickedArticles[5] && (
              <Link
                href={`/article/${pickedArticles[5].id}`}
                className="tile excerpt wide group"
              >
                <div className="meta">NO. {pickedArticles[5].id} · {pickedArticles[5].frontmatter.date}</div>
                <h3 className="font-serif text-lg font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors mb-2">
                  <Thai>{pickedArticles[5].frontmatter.title_th}</Thai>
                </h3>
                <blockquote>
                  <Thai>{pickedArticles[5].frontmatter.description || pickedArticles[5].frontmatter.title_th}</Thai>
                </blockquote>
                <span>{pickedArticles[5].frontmatter.title_en || pickedArticles[5].frontmatter.author}</span>
                <i className="corner" />
              </Link>
            )}
          </div>

          {/* ══ FOOTER RESHUFFLE ═══════════════════════════════════════════════ */}
          <footer className="edition-footer mt-12 pt-8 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="meta">
              End of edition · Reload or click Reshuffle for new fragments
            </div>
            <button
              type="button"
              onClick={handleReshuffle}
              className="outline-button"
            >
              <Icon name="shuffle" /> Reshuffle
            </button>
          </footer>
        </>
      )}
    </main>
  );
}
