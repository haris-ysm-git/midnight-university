"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Article, TagHubNote } from "@/lib/content";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

interface RandomMosaicProps {
  initialArticles: Article[];
  tagNotes: TagHubNote[];
}

export function RandomMosaic({ initialArticles, tagNotes }: RandomMosaicProps) {
  const [edition, setEdition] = useState(1);
  const [seed, setSeed] = useState(0);

  // Pick 3 random articles for excerpts
  const articlesCount = initialArticles.length;
  const aIdx1 = (seed * 7 + 1) % articlesCount;
  const aIdx2 = (seed * 13 + 5) % articlesCount;
  const aIdx3 = (seed * 19 + 11) % articlesCount;

  const exc1 = initialArticles[aIdx1] || initialArticles[0];
  const exc2 = initialArticles[aIdx2] || initialArticles[1] || exc1;
  const exc3 = initialArticles[aIdx3] || initialArticles[2] || exc1;

  // Pick 4 random keywords from tag notes
  const tagsCount = tagNotes.length || 1;
  const kw1 = tagNotes[(seed * 3 + 2) % tagsCount]?.title || "Sacred Space";
  const kw2 = tagNotes[(seed * 5 + 7) % tagsCount]?.title || "Deconstruction";
  const kw3 = tagNotes[(seed * 11 + 3) % tagsCount]?.title || "Nationalism";
  const kw4 = tagNotes[(seed * 17 + 9) % tagsCount]?.title || "Pattani";

  const handleReshuffle = () => {
    setEdition((prev) => prev + 1);
    setSeed((prev) => prev + Math.floor(Math.random() * 50) + 1);
  };

  return (
    <div className="random-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="page-title mb-10">
        <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-3">
          Edition {String(edition).padStart(2, "0")} · fragments recomposed
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[var(--text)] tracking-tight mb-4">
          Random Assembly
        </h1>
        <p className="font-thai text-lg sm:text-xl text-[var(--secondary)] font-normal leading-relaxed">
          <Thai>ความคิดที่พบกันโดยบังเอิญในห้องอ่านยามค่ำคืน</Thai>
        </p>
      </div>

      {/* ══ BENTO MOSAIC GRID ═══════════════════════════════════════════════ */}
      <div className="mosaic">
        {/* Tile 1: Excerpt (wide) */}
        {exc1 && (
          <Link href={`/article/${exc1.id}`} className="tile excerpt wide group">
            <div className="meta font-mono text-xs text-[var(--gold)] tracking-wider mb-2">
              NO. {exc1.id}
            </div>
            <blockquote className="font-thai italic text-base sm:text-lg text-[var(--text)] leading-relaxed group-hover:text-[var(--gold-bright)] transition-colors line-clamp-4">
              <Thai>{exc1.frontmatter.description || exc1.frontmatter.title_th}</Thai>
            </blockquote>
            <span className="font-serif italic text-xs text-[var(--muted)] mt-auto pt-4 truncate">
              {exc1.frontmatter.title_en || exc1.frontmatter.title_th}
            </span>
            <i className="corner" />
          </Link>
        )}

        {/* Tile 2: Glyph Stamp */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif text-4xl text-[var(--gold)]">♜</div>
        </div>

        {/* Tile 3: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw1)}`}
          className="tile keyword group hover:bg-[var(--raised)] transition-colors p-4"
        >
          <span className="group-hover:text-[var(--gold-bright)] transition-colors">
            {kw1}
          </span>
        </Link>

        {/* Tile 4: Dither visual tile */}
        <div className="tile relative overflow-hidden" aria-hidden="true">
          <div className="dither dither-1 inset-0 absolute opacity-70" />
          <span className="absolute bottom-2.5 left-3 font-mono text-[8px] text-[var(--gold-pale)] uppercase tracking-wider z-10">
            Dither 1×1
          </span>
        </div>

        {/* Tile 5: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw2)}`}
          className="tile keyword group hover:bg-[var(--raised)] transition-colors p-4"
        >
          <span className="group-hover:text-[var(--gold-bright)] transition-colors">
            {kw2}
          </span>
        </Link>

        {/* Tile 6: Excerpt (tall) */}
        {exc2 && (
          <Link href={`/article/${exc2.id}`} className="tile excerpt tall group">
            <div className="meta font-mono text-xs text-[var(--gold)] tracking-wider mb-2">
              NO. {exc2.id}
            </div>
            <blockquote className="font-thai italic text-base sm:text-lg text-[var(--text)] leading-relaxed group-hover:text-[var(--gold-bright)] transition-colors line-clamp-6">
              <Thai>{exc2.frontmatter.description || exc2.frontmatter.title_th}</Thai>
            </blockquote>
            <span className="font-serif italic text-xs text-[var(--muted)] mt-auto pt-4 truncate">
              {exc2.frontmatter.title_en || exc2.frontmatter.title_th}
            </span>
            <i className="corner" />
          </Link>
        )}

        {/* Tile 7: Moon Glyph */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif text-4xl text-[var(--gold)]">☾</div>
        </div>

        {/* Tile 8: Dither visual tile (wide) */}
        <div className="tile wide relative overflow-hidden" aria-hidden="true">
          <div className="dither dither-3 inset-0 absolute opacity-70" />
          <span className="absolute bottom-2.5 left-3 font-mono text-[8px] text-[var(--gold-pale)] uppercase tracking-wider z-10">
            Dither 2×1
          </span>
        </div>

        {/* Tile 9: Subtle Blank tile */}
        <div className="tile blank" aria-hidden="true">
          <i className="corner" />
        </div>

        {/* Tile 10: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw3)}`}
          className="tile keyword group hover:bg-[var(--raised)] transition-colors p-4"
        >
          <span className="group-hover:text-[var(--gold-bright)] transition-colors">
            {kw3}
          </span>
        </Link>

        {/* Tile 11: Scales Glyph */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif text-4xl text-[var(--gold)]">⚖</div>
        </div>

        {/* Tile 12: Excerpt (wide) */}
        {exc3 && (
          <Link href={`/article/${exc3.id}`} className="tile excerpt wide group">
            <div className="meta font-mono text-xs text-[var(--gold)] tracking-wider mb-2">
              NO. {exc3.id}
            </div>
            <blockquote className="font-thai italic text-base sm:text-lg text-[var(--text)] leading-relaxed group-hover:text-[var(--gold-bright)] transition-colors line-clamp-4">
              <Thai>{exc3.frontmatter.description || exc3.frontmatter.title_th}</Thai>
            </blockquote>
            <span className="font-serif italic text-xs text-[var(--muted)] mt-auto pt-4 truncate">
              {exc3.frontmatter.title_en || exc3.frontmatter.title_th}
            </span>
            <i className="corner" />
          </Link>
        )}

        {/* Tile 13: Dither tile */}
        <div className="tile relative overflow-hidden" aria-hidden="true">
          <div className="dither dither-2 inset-0 absolute opacity-70" />
          <span className="absolute bottom-2.5 left-3 font-mono text-[8px] text-[var(--gold-pale)] uppercase tracking-wider z-10">
            Dither 1×1
          </span>
        </div>

        {/* Tile 14: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw4)}`}
          className="tile keyword group hover:bg-[var(--raised)] transition-colors p-4"
        >
          <span className="group-hover:text-[var(--gold-bright)] transition-colors">
            {kw4}
          </span>
        </Link>

        {/* Tile 15: Book / Geometry Glyph */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif text-4xl text-[var(--gold)]">✦</div>
        </div>
      </div>

      {/* ══ FOOTER RESHUFFLE ═══════════════════════════════════════════════ */}
      <footer className="edition-footer flex items-center justify-between border-t border-[var(--line)] py-8 mt-12">
        <div className="meta font-mono text-xs text-[var(--muted)] tracking-wider">
          End of edition · Reload or click Reshuffle for new fragments
        </div>
        <button
          type="button"
          onClick={handleReshuffle}
          className="outline-button flex items-center gap-2 border border-[var(--line)] px-5 py-2.5 font-mono text-xs text-[var(--gold)] hover:border-[var(--gold)] hover:bg-[var(--raised)] transition-colors uppercase tracking-wider"
        >
          <Icon name="shuffle" size={14} /> Reshuffle
        </button>
      </footer>
    </div>
  );
}
