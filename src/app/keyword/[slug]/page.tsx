import { getHubArticles } from "@/lib/backlinks";
import { getAllTagNotes, getAllArticles, slugify, resolveObsidianLinks } from "@/lib/content";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { KeywordHubClient } from "@/components/keyword/keyword-hub-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tagNotes = getAllTagNotes();
  const articles = getAllArticles();
  const tagSet = new Set<string>();

  for (const n of tagNotes) {
    tagSet.add(n.slug);
  }
  for (const a of articles) {
    for (const t of a.frontmatter.tags) {
      tagSet.add(slugify(t));
    }
  }

  return Array.from(tagSet).map((slug) => ({ slug }));
}

export default async function KeywordHubPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).replace(/-/g, " ");

  const hubData = getHubArticles(decodedSlug);
  const tagNotes = getAllTagNotes();
  const allArticles = getAllArticles();

  // Find corresponding tag note if exists
  const note = tagNotes.find(
    (n) =>
      n.slug.toLowerCase() === slug.toLowerCase() ||
      n.filename.toLowerCase() === decodedSlug.toLowerCase() ||
      n.aliases.some((a) => a.toLowerCase() === decodedSlug.toLowerCase())
  );

  let renderedNoteBody: React.ReactNode = null;
  if (note && note.body && note.body.trim().length > 0) {
    const resolved = resolveObsidianLinks(note.body, allArticles);
    renderedNoteBody = (
      <MDXRemote
        source={resolved}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    );
  }

  // If both articles and note body are empty and not found
  if (hubData.articles.length === 0 && !note) {
    // We still render the hub page showing empty state rather than 404
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <KeywordHubClient
        hubData={hubData}
        note={note}
        renderedNoteBody={renderedNoteBody}
      />
    </main>
  );
}
