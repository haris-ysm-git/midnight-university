import { getAllArticles, getAllTagNotes } from "./content";
import { CATEGORIES, getCategoryForTag } from "./categories";

export interface GraphNode {
  id: string;
  name: string;
  type: "article" | "tag";
  category: string;
  color: string;
  degree: number;
  articleId?: string;
  date?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface HubNodeData {
  id: string;
  name: string;
  count: number;
  category: string;
  color: string;
  glyph: string;
  x: number;
  y: number;
  articles: Array<{
    id: string;
    title: string;
    date: string;
  }>;
}

export interface GraphDataset {
  nodes: GraphNode[];
  links: GraphLink[];
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

  // Also include tag notes with references
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

  // Build Graph Nodes and Links for Obsidian-style force-graph
  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  // 1. Tag nodes
  for (const [tag, taggedArticles] of tagMap.entries()) {
    const cat = getCategoryForTag(tag);
    nodeMap.set(tag, {
      id: tag,
      name: tag,
      type: "tag",
      category: cat.name,
      color: cat.color,
      degree: taggedArticles.length,
    });
  }

  // 2. Article nodes and Article -> Tag links
  for (const a of articles) {
    const primaryCat = a.frontmatter.tags[0] ? getCategoryForTag(a.frontmatter.tags[0]) : CATEGORIES.Other;
    nodeMap.set(a.id, {
      id: a.id,
      name: `${a.id}: ${a.frontmatter.title_th}`,
      type: "article",
      category: primaryCat.name,
      color: primaryCat.color,
      degree: a.frontmatter.tags.length,
      articleId: a.id,
      date: a.frontmatter.date,
    });

    for (const tag of a.frontmatter.tags) {
      const cleanTag = tag.trim();
      if (nodeMap.has(cleanTag)) {
        links.push({
          source: a.id,
          target: cleanTag,
        });
      }
    }
  }

  const nodes = Array.from(nodeMap.values());

  // Hub list for list-view
  const sortedTags = Array.from(tagMap.entries()).sort((a, b) => b[1].length - a[1].length);
  const hubs: HubNodeData[] = sortedTags.map(([tag, taggedArticles], index) => {
    const cat = getCategoryForTag(tag);
    const count = taggedArticles.length;
    return {
      id: tag,
      name: tag,
      count,
      category: cat.name,
      color: cat.color,
      glyph: cat.glyph,
      x: 50,
      y: 50,
      articles: taggedArticles.slice(0, 10),
    };
  });

  const categories = Object.values(CATEGORIES).map((c) => ({
    name: c.name,
    color: c.color,
    glyph: c.glyph,
  }));

  return {
    nodes,
    links,
    hubs,
    categories,
  };
}
