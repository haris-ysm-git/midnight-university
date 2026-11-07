"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Article } from "@/lib/content";
import { Backlink } from "@/lib/backlinks";
import { ParsedZoneData } from "@/lib/zone-parser";
import { BacklinksPanel } from "./backlinks-panel";
import { EmberParticles } from "./ember-particles";
import { ReadingProgress } from "./reading-progress";
import { ReaderTOC } from "./reader/reader-toc";
import { ReadingSettingsPanel } from "./reader/reading-settings-panel";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";
import { getCategoryForTag } from "@/lib/categories";

interface ArticleLayoutProps {
  article: Article;
  backlinks: Backlink[];
  zones: ParsedZoneData;
  prevArticle?: Article | null;
  nextArticle?: Article | null;
  children: React.ReactNode;
}

export function ArticleLayout({
  article,
  backlinks,
  zones,
  prevArticle,
  nextArticle,
  children,
}: ArticleLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { frontmatter } = article;
  const author = frontmatter.author && frontmatter.author !== "NA" ? frontmatter.author : null;

  return (
    <div className="reader relative min-h-screen">
      {/* Ambient background particles (strictly below content) */}
      <EmberParticles />

      {/* Reading Progress Line */}
      <ReadingProgress />

      {/* Reader Sticky Header Toolbar */}
      <header className="reader-toolbar">
        <div className="flex items-center gap-4">
          <Link href="/" className="back-button">
            <Icon name="back" size={16} />
            <span className="hidden sm:inline">Archive</span>
          </Link>
          <span className="font-mono text-xs text-[var(--gold)] border border-[var(--line)] px-2 py-0.5 rounded-xs">
            {frontmatter.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Raw Markdown view link */}
          <a
            href={`/api/raw/${article.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-button text-xs font-mono text-[var(--muted)] hover:text-[var(--gold-bright)]"
            title="View original Markdown (.md) preservation file"
          >
            <Icon name="link" size={16} />
            <span className="hidden sm:inline ml-1 text-[10px] uppercase">.md</span>
          </a>

          {/* Aa Appearance Settings Button */}
          <button
            type="button"
            aria-label="Reading appearance settings"
            className="icon-button aa-button font-serif text-sm font-semibold hover:text-[var(--gold)]"
            onClick={() => setSettingsOpen(true)}
          >
            Aa
          </button>
        </div>
      </header>

      {/* Appearance Settings Panel */}
      <ReadingSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Table of Contents Floating Rail */}
      <ReaderTOC items={zones.tableOfContents} />

      {/* Main Article Container */}
      <article
        className="reader-article relative z-10"
        style={{
          maxWidth: "var(--reader-width)",
          transition: "max-width 0.25s ease",
        }}
      >
        {/* ══ ZONE B: OPENING MATTER HERO ═══════════════════════════════════ */}
        <header className="article-header pb-12 mb-10 border-b border-[var(--line)]">
          {/* Metadata Top Bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
            <span className="font-mono text-xs text-[var(--gold-bright)] font-semibold tracking-wider">
              NO. {frontmatter.id}
            </span>
            <span className="text-[var(--line-strong)]">/</span>
            <time className="font-mono text-xs text-[var(--muted)] tracking-wider">
              {frontmatter.date}
            </time>
            <span className="text-[var(--line-strong)]">/</span>
            <span className="font-mono text-xs text-[var(--muted)] tracking-wider uppercase">
              {frontmatter.reading_time}
            </span>
            {author && (
              <>
                <span className="text-[var(--line-strong)]">/</span>
                <span className="font-mono text-xs text-[var(--gold)] tracking-wide">
                  {author}
                </span>
              </>
            )}
          </div>

          {/* Thai Title */}
          <h1 className="font-thai text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.35] tracking-tight text-[var(--text)] mb-4">
            <Thai>{frontmatter.title_th}</Thai>
          </h1>

          {/* Trailing credit byline (from H1 if present) */}
          {zones.openingMatter.creditByline && (
            <div className="text-sm font-mono text-[var(--gold)] mb-4 tracking-wide">
              {zones.openingMatter.creditByline}
            </div>
          )}

          {/* English Title */}
          {frontmatter.title_en && frontmatter.title_en !== frontmatter.title_th && (
            <h2 className="font-serif text-lg sm:text-xl text-[var(--secondary)] italic font-normal leading-snug">
              {frontmatter.title_en}
            </h2>
          )}

          {/* Tags */}
          {frontmatter.tags.length > 0 && (
            <div className="tag-list mt-8">
              {frontmatter.tags.map((tag) => {
                const cat = getCategoryForTag(tag);
                return (
                  <Link
                    key={tag}
                    href={`/keyword/${encodeURIComponent(tag)}`}
                    style={{ borderColor: `${cat.color}40`, color: cat.color }}
                  >
                    <span className="opacity-70 mr-1">{cat.glyph}</span>
                    {tag}
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        {/* ══ EPIGRAPH (Zone B) ═══════════════════════════════════════════ */}
        {zones.openingMatter.epigraph && (
          <aside
            aria-label="Epigraph"
            className="my-10 pl-6 border-l-2 border-[var(--gold)] bg-[var(--raised)] p-6 rounded-xs"
          >
            <blockquote className="font-serif text-lg italic text-[var(--text)] leading-relaxed">
              <Thai>{zones.openingMatter.epigraph.quote}</Thai>
            </blockquote>
            {zones.openingMatter.epigraph.attribution && (
              <div className="mt-3 font-mono text-xs text-[var(--gold)] tracking-wider">
                {zones.openingMatter.epigraph.attribution}
              </div>
            )}
          </aside>
        )}

        {/* ══ PROVENANCE / COLOPHON (Zone B) ═════════════════════════════ */}
        {zones.openingMatter.provenanceLines.length > 0 && (
          <section
            aria-label="Colophon"
            className="my-8 p-5 border border-[var(--line)] bg-[var(--sunken)]/60 rounded-xs text-xs font-mono text-[var(--muted)] leading-relaxed flex flex-col gap-2"
          >
            {zones.openingMatter.provenanceLines.map((line, idx) => (
              <div key={idx} className="flex items-baseline gap-2">
                <span className="text-[var(--gold)] opacity-60">·</span>
                <Thai className="flex-1">{line}</Thai>
              </div>
            ))}
          </section>
        )}

        {/* ══ LEAD INTRODUCTION (Zone B) ═════════════════════════════════ */}
        {zones.openingMatter.introduction.length > 0 && (
          <div className="my-8 flex flex-col gap-4 text-[1.12em] text-[var(--secondary)] leading-relaxed font-serif border-b border-[var(--line)] pb-8">
            {zones.openingMatter.introduction.map((para, idx) => (
              <p key={idx}>
                <Thai>{para}</Thai>
              </p>
            ))}
          </div>
        )}

        {/* ══ ZONE C: ARTICLE BODY ═══════════════════════════════════════ */}
        <div
          className="prose article-prose max-w-none text-[var(--text)]"
          style={{
            lineHeight: "var(--reader-line-height)",
            fontFamily: "var(--reader-font)",
          }}
        >
          {children}
        </div>

        {/* ══ ZONE D: BACK MATTER (Footnotes, Bibliography, Source) ═════ */}
        {zones.backMatter.hasBackMatter && (
          <footer className="mt-20 pt-12 border-t border-[var(--line)] flex flex-col gap-12">
            {/* Footnotes Area */}
            {zones.backMatter.footnotes.length > 0 && (
              <section id="footnotes-section" className="footnotes-block">
                <h3 className="font-mono text-xs tracking-widest text-[var(--gold)] uppercase mb-6 flex items-center gap-2">
                  <span className="w-4 h-px bg-[var(--gold)]" />
                  เชิงอรรถ (Footnotes)
                </h3>
                <ol className="space-y-4 font-serif text-sm text-[var(--secondary)] pl-4">
                  {zones.backMatter.footnotes.map((fn) => (
                    <li
                      key={fn.number}
                      id={`fn-${fn.number}`}
                      className="scroll-mt-24 list-decimal pl-2 leading-relaxed"
                    >
                      <span>
                        <Thai>{fn.text}</Thai>{" "}
                        <a
                          href={`#fnref-${fn.number}`}
                          aria-label={`Back to reference ${fn.number}`}
                          className="text-[var(--gold)] hover:underline ml-1 font-mono text-xs"
                        >
                          ↩
                        </a>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Bibliography Area */}
            {zones.backMatter.bibliography.length > 0 && (
              <section className="bibliography-block border-t border-[var(--line)] pt-8">
                <h3 className="font-mono text-xs tracking-widest text-[var(--gold)] uppercase mb-6 flex items-center gap-2">
                  <span className="w-4 h-px bg-[var(--gold)]" />
                  บรรณานุกรม (Bibliography)
                </h3>
                <ul className="space-y-3 text-xs text-[var(--secondary)] font-mono leading-relaxed">
                  {zones.backMatter.bibliography.map((entry, idx) => (
                    <li
                      key={idx}
                      className="pl-6 -indent-6 border-b border-[var(--line)] pb-2 break-words"
                    >
                      <Thai>{entry}</Thai>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Further Reading */}
            {zones.backMatter.furtherReading.length > 0 && (
              <section className="further-reading-block border-t border-[var(--line)] pt-8">
                <h3 className="font-mono text-xs tracking-widest text-[var(--gold)] uppercase mb-6 flex items-center gap-2">
                  <span className="w-4 h-px bg-[var(--gold)]" />
                  หนังสืออ่านเพิ่มเติม (Further Reading)
                </h3>
                <div className="space-y-3 text-sm text-[var(--secondary)] font-serif leading-relaxed">
                  {zones.backMatter.furtherReading.map((entry, idx) => (
                    <p key={idx}>
                      <Thai>{entry}</Thai>
                    </p>
                  ))}
                </div>
              </section>
            )}
          </footer>
        )}

        {/* ══ RAW SOURCE PRESERVATION LINK ═══════════════════════════════ */}
        <div className="mt-16 p-6 border border-[var(--line)] bg-[var(--sunken)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-widest text-[var(--gold)] uppercase mb-1">
              Preservability Principle
            </div>
            <div className="text-xs text-[var(--muted)]">
              This article is rendered dynamically from plain Markdown + YAML in our vault.
            </div>
          </div>
          <a
            href={`/api/raw/${article.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="outline-button !text-[9px] !min-h-[36px] !px-3"
          >
            <Icon name="link" size={14} />
            <span>View source (.md)</span>
          </a>
        </div>

        {/* ══ PREVIOUS & NEXT ARTICLE NAVIGATION ═════════════════════════ */}
        <nav
          aria-label="Previous and Next Articles"
          className="prev-next mt-16 border-t border-b border-[var(--line)] grid grid-cols-1 md:grid-cols-2"
        >
          {prevArticle ? (
            <Link
              href={`/article/${prevArticle.id}`}
              className="p-6 border-b md:border-b-0 md:border-r border-[var(--line)] hover:bg-[var(--raised)] transition-colors group block text-left"
            >
              <div className="font-mono text-[10px] tracking-widest text-[var(--muted)] uppercase mb-2 group-hover:text-[var(--gold)]">
                ← Previous · {prevArticle.id}
              </div>
              <div className="font-thai text-base text-[var(--text)] line-clamp-2 group-hover:text-[var(--gold-bright)] transition-colors font-medium">
                {prevArticle.frontmatter.title_th}
              </div>
            </Link>
          ) : (
            <div className="p-6 hidden md:block" />
          )}

          {nextArticle ? (
            <Link
              href={`/article/${nextArticle.id}`}
              className="p-6 hover:bg-[var(--raised)] transition-colors group block text-right"
            >
              <div className="font-mono text-[10px] tracking-widest text-[var(--muted)] uppercase mb-2 group-hover:text-[var(--gold)]">
                Next · {nextArticle.id} →
              </div>
              <div className="font-thai text-base text-[var(--text)] line-clamp-2 group-hover:text-[var(--gold-bright)] transition-colors font-medium">
                {nextArticle.frontmatter.title_th}
              </div>
            </Link>
          ) : (
            <div className="p-6 hidden md:block" />
          )}
        </nav>

        {/* ══ BACKLINKS PANEL ═════════════════════════════════════════════ */}
        <div className="mt-16">
          <BacklinksPanel backlinks={backlinks} />
        </div>
      </article>
    </div>
  );
}
