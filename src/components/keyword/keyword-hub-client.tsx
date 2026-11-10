"use client";

import React from "react";
import Link from "next/link";
import { HubData } from "@/lib/backlinks";
import { TagHubNote } from "@/lib/content";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";
import { LocalGraph } from "@/components/keyword/local-graph";

interface KeywordHubClientProps {
  hubData: HubData;
  note?: TagHubNote | null;
  renderedNoteBody?: React.ReactNode;
}

export function KeywordHubClient({
  hubData,
  note,
  renderedNoteBody,
}: KeywordHubClientProps) {
  const { keyword, articles, contextSnippets, coOccurringKeywords } = hubData;
  const topCoOccurring = coOccurringKeywords.slice(0, 5);

  return (
    <div className="standard-page keyword-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ══ BACK BUTTON ═════════════════════════════════════════════════════ */}
      <Link
        href="/index-az"
        className="back-button inline-flex items-center gap-2 text-xs font-mono text-[var(--gold)] hover:underline uppercase tracking-wider mb-8"
      >
        <Icon name="back" size={14} /> Back to index
      </Link>

      {/* ══ PAGE TITLE ══════════════════════════════════════════════════════ */}
      <div className="page-title mb-10">
        <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-3">
          Keyword archive · {articles.length} {articles.length === 1 ? "article" : "articles"}
          {note?.type && (
            <span className="ml-2 px-2 py-0.5 border border-[var(--gold)]/40 rounded-xs text-[var(--gold-bright)]">
              {note.type}
            </span>
          )}
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[var(--text)] tracking-tight mb-4 capitalize">
          {note?.title || keyword}
        </h1>
        {note?.aliases && note.aliases.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {note.aliases.map((alias) => (
              <span
                key={alias}
                className="font-mono text-xs text-[var(--muted)] border border-[var(--line)] px-2.5 py-0.5 rounded-xs"
              >
                aka {alias}
              </span>
            ))}
          </div>
        )}
        <p className="font-thai text-lg sm:text-xl text-[var(--secondary)] font-normal leading-relaxed">
          <Thai>แนวคิดและข้อความที่เชื่อมโยงกันในคลังมหาวิทยาลัยเที่ยงคืน</Thai>
        </p>
      </div>

      {/* ══ OPTIONAL NOTE BODY (if not empty) ═══════════════════════════════ */}
      {renderedNoteBody && (
        <div className="my-8 p-6 border border-[var(--line)] bg-[var(--raised)]/40 rounded-xs font-serif text-[var(--text)] leading-relaxed">
          {renderedNoteBody}
        </div>
      )}

      {/* ══ 2-COLUMN LAYOUT: RELATED ARTICLES + ASIDE LOCAL GRAPH ═════════════ */}
      <div className="keyword-layout grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 border-t border-[var(--line)] pt-8">
        {/* Left: Related Articles Grid */}
        <section>
          <div className="meta font-mono text-xs uppercase tracking-widest text-[var(--muted)] mb-6">
            Related articles ({articles.length})
          </div>
          {articles.length === 0 ? (
            <div className="p-8 border border-dashed border-[var(--line)] text-center font-mono text-xs text-[var(--muted)]">
              No direct article links recorded for this keyword yet.
            </div>
          ) : (
            <div className="related-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((a) => (
                <Link
                  key={a.sourceId}
                  href={`/article/${a.sourceId}`}
                  className="article-card block p-6 border border-[var(--line)] bg-[var(--raised)] hover:border-[var(--gold)] transition-colors group rounded-xs"
                >
                  <div className="meta font-mono text-xs text-[var(--gold)] tracking-wider mb-2">
                    NO. {a.sourceId}
                  </div>
                  <h3 className="font-thai text-lg font-medium text-[var(--text)] group-hover:text-[var(--gold-bright)] transition-colors leading-snug mb-2 line-clamp-2">
                    <Thai>{a.sourceTitle}</Thai>
                  </h3>
                  {a.sourceTitleEn && (
                    <em className="font-serif italic text-xs text-[var(--secondary)] block mb-4 truncate">
                      {a.sourceTitleEn}
                    </em>
                  )}
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase text-[var(--gold)] mt-auto pt-4 border-t border-[var(--line)]">
                    Read article <Icon name="arrow" size={10} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Right: Local Mini-Graph & Co-occurring Keywords */}
        <aside className="space-y-8 min-w-0 overflow-hidden">
          <div>
            <div className="meta font-mono text-xs uppercase tracking-widest text-[var(--muted)] mb-4">
              Local graph
            </div>
            <LocalGraph
              keyword={keyword}
              articles={articles.slice(0, 40)}
              relatedKeywords={coOccurringKeywords.slice(0, 12)}
            />
          </div>

          {topCoOccurring.length > 0 && (
            <div>
              <div className="meta font-mono text-xs uppercase tracking-widest text-[var(--muted)] mb-3">
                Related keywords
              </div>
              <div className="tag-list flex flex-wrap gap-2">
                {topCoOccurring.map((item) => (
                  <Link
                    key={item.tag}
                    href={`/keyword/${encodeURIComponent(item.tag)}`}
                    className="font-mono text-xs border border-[var(--line)] px-2.5 py-1 text-[var(--secondary)] hover:border-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors rounded-xs"
                  >
                    {item.tag} <span className="text-[var(--muted)]">({item.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ══ MENTIONED IN CONTEXT SNIPPETS ═══════════════════════════════════ */}
      {contextSnippets.length > 0 && (
        <section className="contexts border-t border-[var(--line)] pt-8 mt-16">
          <div className="meta font-mono text-xs uppercase tracking-widest text-[var(--muted)] mb-6">
            Mentioned in context ({contextSnippets.length})
          </div>
          <div className="space-y-6">
            {contextSnippets.map((ctx, idx) => (
              <blockquote
                key={idx}
                className="p-6 border-l-2 border-[var(--gold)] bg-[var(--raised)]/40 rounded-r-xs font-serif italic text-base sm:text-lg text-[var(--secondary)] leading-relaxed"
              >
                <Thai>
                  &ldquo;{ctx.snippet}&rdquo;
                </Thai>
                <cite className="font-mono text-xs text-[var(--muted)] not-italic block mt-3 uppercase tracking-wider">
                  <Link
                    href={`/article/${ctx.articleId}`}
                    className="text-[var(--gold)] hover:underline mr-2"
                  >
                    NO. {ctx.articleId}
                  </Link>
                  · {ctx.articleTitle}
                </cite>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
