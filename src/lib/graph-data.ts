import { getAllArticles, getAllTagNotes } from "./content";
import { CATEGORIES, getCategoryForTag } from "./categories";

export interface HubNodeData {
  id: string;
  name: string;
  count: number;
  category: string;
  color: string;
  glyph: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  articles: Array<{
    id: string;
    title: string;
    date: string;
  }>;
}

export interface GraphDataset {
  hubs: HubNodeData[];
  categories: Array<{
    name: string;
    color: string;
    glyph: string;
  }>;
}

export function getGraphDataset(): GraphDataset {
  const articles = getAllArticles();
  const tagNotes = getAllTagNotes();

  // Aggregate articles per tag
  const tagMap = new Map<string, Array<{ id: string; title: string; date: string }>>();

  for (const a of articles) {
    for (const tag of a.frontmatter.tags) {
      const cleanTag = tag.trim();
      if (!tagMap.has(cleanTag)) {
        tagMap.set(cleanTag, []);
      }
      tagMap.get(cleanTag)!.push({
        id: a.id,
        title: a.frontmatter.title_th,
        date: a.frontmatter.date,
      });
    }
  }

  // Also include tag notes with at least 1 reference
  for (const note of tagNotes) {
    if (!tagMap.has(note.title)) {
      const matching = articles.filter(
        (a) =>
          a.content.includes(note.title) ||
          note.aliases.some((alias) => a.content.includes(alias))
      );
      if (matching.length > 0) {
        tagMap.set(
          note.title,
          matching.map((m) => ({
            id: m.id,
            title: m.frontmatter.title_th,
            date: m.frontmatter.date,
          }))
        );
      }
    }
  }

  // Sort by article count descending and take top 40-50 hubs
  const sortedTags = Array.from(tagMap.entries()).sort((a, b) => b[1].length - a[1].length);
  const topHubs = sortedTags.slice(0, 48);

  // Position nodes in an organic circular/spiral distribution
  const hubs: HubNodeData[] = topHubs.map(([tag, taggedArticles], index) => {
    const cat = getCategoryForTag(tag);
    const count = taggedArticles.length;

    // Golden angle spiral distribution
    const phi = index * 137.5 * (Math.PI / 180);
    const radius = 18 + Math.sqrt(index) * 8.5; // distributed between ~18% and ~45% radius
    const cx = 50 + radius * Math.cos(phi);
    const cy = 50 + radius * Math.sin(phi);

    // Clamp within 8% to 92%
    const x = Math.max(10, Math.min(90, Math.round(cx * 10) / 10));
    const y = Math.max(12, Math.min(88, Math.round(cy * 10) / 10));

    return {
      id: tag,
      name: tag,
      count,
      category: cat.name,
      color: cat.color,
      glyph: cat.glyph,
      x,
      y,
      articles: taggedArticles.slice(0, 8),
    };
  });

  const categories = Object.values(CATEGORIES).map((c) => ({
    name: c.name,
    color: c.color,
    glyph: c.glyph,
  }));

  return {
    hubs,
    categories,
  };
}
