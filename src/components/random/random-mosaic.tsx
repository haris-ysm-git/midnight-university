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
    <main className="random-page">
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="page-title">
        <div className="meta">
          Edition {String(edition).padStart(2, "0")} · fragments recomposed
        </div>
        <h1>Random Assembly</h1>
        <p>
          <Thai>ความคิดที่พบกันโดยบังเอิญในห้องอ่านยามค่ำคืน</Thai>
        </p>
      </div>

      {/* ══ BENTO MOSAIC GRID ═══════════════════════════════════════════════ */}
      <div className="mosaic">
        {/* Tile 1: Excerpt (wide) */}
        {exc1 && (
          <Link href={`/article/${exc1.id}`} className="tile excerpt wide">
            <div className="meta">NO. {exc1.id}</div>
            <blockquote>
              <Thai>{exc1.frontmatter.description || exc1.frontmatter.title_th}</Thai>
            </blockquote>
            <span>{exc1.frontmatter.title_en || exc1.frontmatter.title_th}</span>
            <i className="corner" />
          </Link>
        )}

        {/* Tile 2: Glyph Stamp */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif">♜<i /></div>
        </div>

        {/* Tile 3: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw1)}`}
          className="tile keyword"
        >
          {kw1}
        </Link>

        {/* Tile 4: Dither visual tile */}
        <div className="tile" aria-hidden="true">
          <div className="dither dither-1">
            <span>Dither 1×1</span>
          </div>
        </div>

        {/* Tile 5: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw2)}`}
          className="tile keyword"
        >
          {kw2}
        </Link>

        {/* Tile 6: Excerpt (tall) */}
        {exc2 && (
          <Link href={`/article/${exc2.id}`} className="tile excerpt tall">
            <div className="meta">NO. {exc2.id}</div>
            <blockquote>
              <Thai>{exc2.frontmatter.description || exc2.frontmatter.title_th}</Thai>
            </blockquote>
            <span>{exc2.frontmatter.title_en || exc2.frontmatter.title_th}</span>
            <i className="corner" />
          </Link>
        )}

        {/* Tile 7: Moon Glyph */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif">☾</div>
        </div>

        {/* Tile 8: Dither visual tile (wide) */}
        <div className="tile wide" aria-hidden="true">
          <div className="dither dither-3">
            <span>Dither 2×1</span>
          </div>
        </div>

        {/* Tile 9: Subtle Blank tile */}
        <div className="tile blank" aria-hidden="true">
          <i className="corner" />
        </div>

        {/* Tile 10: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw3)}`}
          className="tile keyword"
        >
          {kw3}
        </Link>

        {/* Tile 11: Scales Glyph */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif">⚖</div>
        </div>

        {/* Tile 12: Excerpt (wide) */}
        {exc3 && (
          <Link href={`/article/${exc3.id}`} className="tile excerpt wide">
            <div className="meta">NO. {exc3.id}</div>
            <blockquote>
              <Thai>{exc3.frontmatter.description || exc3.frontmatter.title_th}</Thai>
            </blockquote>
            <span>{exc3.frontmatter.title_en || exc3.frontmatter.title_th}</span>
            <i className="corner" />
          </Link>
        )}

        {/* Tile 13: Dither tile */}
        <div className="tile" aria-hidden="true">
          <div className="dither dither-2">
            <span>Dither 1×1</span>
          </div>
        </div>

        {/* Tile 14: Keyword Hub link */}
        <Link
          href={`/keyword/${encodeURIComponent(kw4)}`}
          className="tile keyword"
        >
          {kw4}
        </Link>

        {/* Tile 15: Book / Geometry Glyph */}
        <div className="tile glyph" aria-hidden="true">
          <div className="stamp font-serif">▱</div>
        </div>
      </div>

      {/* ══ FOOTER RESHUFFLE ═══════════════════════════════════════════════ */}
      <footer className="edition-footer">
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
    </main>
  );
}
