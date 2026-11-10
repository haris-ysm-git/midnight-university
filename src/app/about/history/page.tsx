import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { getMdxComponents } from "@/components/reader/mdx-components";
import { Thai } from "@/components/thai";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ประวัติความเป็นมา — History | Midnight University",
  description: "ประวัติความเป็นมาของมหาวิทยาลัยเที่ยงคืน ตั้งแต่ก่อตั้งจนถึงปัจจุบัน",
};

export default function HistoryPage() {
  const filePath = path.join(
    process.cwd(),
    "content",
    "pages",
    "0000 history.md"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(raw);

  const mdxComponents = getMdxComponents();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-6 pt-20 pb-32">
      <article
        className="max-w-[680px] mx-auto reader-article"
        style={{
          fontFamily: "var(--reader-font)",
          lineHeight: 1.85,
        }}
      >
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/about"
            className="font-mono text-xs uppercase tracking-widest text-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors no-underline"
          >
            ← ABOUT
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--gold)] mb-3">
            HISTORY · NO. {frontmatter.id || "0000"}
          </div>
          <h1
            className="font-serif font-bold text-[clamp(2rem,5vw,3.25rem)] text-[var(--text)] mb-2"
            style={{ lineHeight: 1.4 }}
          >
            <Thai>{frontmatter.title_th || "ประวัติความเป็นมา"}</Thai>
          </h1>
          {frontmatter.title_en && (
            <div className="font-serif italic text-lg text-[var(--muted)] mb-3">
              {frontmatter.title_en}
            </div>
          )}
          {frontmatter.author && (
            <div className="font-mono text-xs text-[var(--muted)] uppercase tracking-wider">
              <Thai>{frontmatter.author}</Thai>
            </div>
          )}
          <div className="w-12 h-0.5 bg-[var(--gold)] mt-6 mb-8" />
        </header>

        {/* Markdown Body */}
        <div className="prose article-prose max-w-none text-[var(--text)]">
          <MDXRemote
            source={content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm, remarkBreaks],
              },
            }}
          />
        </div>

        {/* Footer Navigation */}
        <footer className="mt-16 pt-10 border-t border-[var(--line)]">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs tracking-wider">
            <Link
              href="/about"
              className="text-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors no-underline uppercase"
            >
              ← ABOUT
            </Link>
            <Link
              href="/"
              className="text-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors no-underline uppercase"
            >
              ARCHIVE →
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
