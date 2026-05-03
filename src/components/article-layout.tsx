import { ReactNode } from "react";
import { Article } from "@/lib/content";
import { Backlink } from "@/lib/backlinks";
import { BacklinksPanel } from "./backlinks-panel";
import Link from "next/link";
import { CursorLight } from "./cursor-light";
import { EmberParticles } from "./ember-particles";
import { ReadingProgress } from "./reading-progress";

interface ArticleLayoutProps {
  article: Article;
  backlinks: Backlink[];
  children: ReactNode;
}

export function ArticleLayout({ article, backlinks, children }: ArticleLayoutProps) {
  const { frontmatter } = article;
  const author = (frontmatter as any).author || "NA";

  return (
    <article className="min-h-screen bg-[#1A1A1A] text-white pb-32 overflow-hidden relative">
      <CursorLight />
      <EmberParticles />
      <ReadingProgress />
      {/* Header */}
      <header className="pt-32 pb-16 px-6 md:px-16 max-w-4xl mx-auto border-b border-white/10">
        <div className="flex flex-col gap-4 mb-10">
          {/* Metadata strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-mono text-[10px] tracking-[0.22em] text-white/35 uppercase">
              {frontmatter.id}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/35">
              {frontmatter.date}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
              {frontmatter.reading_time}
            </span>
            {author !== "NA" && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
                <span className="font-mono text-[10px] tracking-[0.14em] text-accent">
                  {author}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="font-thai text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.3] tracking-tight text-white mt-4">
            {frontmatter.title_th}
          </h1>

          {/* English title */}
          {frontmatter.title_en && frontmatter.title_en !== frontmatter.title_th && (
            <p className="font-serif text-lg md:text-xl text-white/50 italic leading-snug">
              {frontmatter.title_en}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {frontmatter.tags.map((tag) => (
            <Link
              key={tag}
              href={`/keyword/${encodeURIComponent(tag)}`}
              className="px-3 py-1.5 border border-white/15 text-accent font-mono text-[10px] tracking-[0.15em] hover:bg-white/5 hover:border-white/30 transition-colors uppercase"
            >
              {tag}
            </Link>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 md:px-16 mt-14">
        <div className="article-prose">
          {children}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-32 pt-16 border-t border-white/10 flex flex-col md:flex-row gap-6">
          <Link 
            href="/"
            className="flex-1 px-8 py-10 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent/40 transition-all group"
          >
            <div className="font-mono text-[10px] tracking-[0.3em] text-white/30 mb-4 uppercase">Return To</div>
            <div className="text-xl md:text-2xl font-mono tracking-widest text-white group-hover:text-accent transition-colors">ARCHIVE</div>
          </Link>
          <Link 
            href="/loc"
            className="flex-1 px-8 py-10 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent/40 transition-all group"
          >
            <div className="font-mono text-[10px] tracking-[0.3em] text-white/30 mb-4 uppercase">Explore</div>
            <div className="text-xl md:text-2xl font-mono tracking-widest text-white group-hover:text-accent transition-colors">CONTENTS</div>
          </Link>
        </div>

        {/* Backlinks */}
        <BacklinksPanel backlinks={backlinks} />
      </div>
    </article>
  );
}
