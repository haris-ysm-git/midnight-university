import { CATEGORIES, CategoryMeta, getCategoryForTag } from "./categories";

export interface TagStyle {
  name: string;
  color: string;
  glyph: string;
}

export const TAG_STYLES: Record<string, TagStyle> = {
  "deep south": { name: "Deep South", color: "#d7a46d", glyph: "●" },
  history: { name: "History", color: "#a9b77c", glyph: "■" },
  philosophy: { name: "Philosophy", color: "#c29bc8", glyph: "◆" },
  islam: { name: "Islam", color: "#71b7ae", glyph: "▲" },
  education: { name: "Education", color: "#8ab4d6", glyph: "○" },
  nationalism: { name: "Nationalism", color: "#d37d70", glyph: "⬟" },
  politics: { name: "Politics", color: "#8b9dcf", glyph: "✦" },
  anthropology: { name: "Anthropology", color: "#d3bd73", glyph: "⬢" },
  other: { name: "Other", color: "#9a958e", glyph: "○" },
};

export function getTagStyle(tag: string): TagStyle {
  const normalized = tag.trim().toLowerCase();
  if (TAG_STYLES[normalized]) {
    return TAG_STYLES[normalized];
  }

  // Fallback through category matching
  const cat = getCategoryForTag(tag);
  return {
    name: cat.name,
    color: cat.color,
    glyph: cat.glyph,
  };
}

export { CATEGORIES, getCategoryForTag };
export type { CategoryMeta };
