import { getAllArticles } from "./content";
import { getTagStyle } from "./tag-style";

export interface VolumeTagItem {
  tag: string;
  count: number;
  color: string;
  glyph: string;
}

export interface VolumeInfo {
  start: number;
  end: number;
  volumeNumber: number;
  archivedCount: number;
  totalCount: number;
  tagMix: VolumeTagItem[];
  angle: number;
  radialX: number;
  gradient: string;
  isNeutral: boolean;
}

/**
 * Compute tag statistics and gradient styles for a volume range.
 * Only tags that have a specific color (non-'Other') are counted.
 */
export function computeVolumeInfo(
  start: number,
  end: number,
  volumeNumber: number
): VolumeInfo {
  const articles = getAllArticles();
  const rangeArticles = articles.filter((a) => {
    const rawNum = a.id.replace(/-\d+$/, "");
    const num = parseInt(rawNum, 10);
    return !isNaN(num) && num >= start && num <= end;
  });

  const tagCounts: Record<string, { count: number; color: string; glyph: string }> = {};

  for (const art of rangeArticles) {
    for (const rawTag of art.frontmatter.tags) {
      if (!rawTag) continue;
      const style = getTagStyle(rawTag);
      // Ignore tags that fall back to "Other" or lack color
      if (style && style.name && style.name.toLowerCase() !== "other") {
        if (!tagCounts[style.name]) {
          tagCounts[style.name] = { count: 0, color: style.color, glyph: style.glyph };
        }
        tagCounts[style.name].count += 1;
      }
    }
  }

  // Top 4 tags by count (ties alphabetical)
  const topTags: VolumeTagItem[] = Object.entries(tagCounts)
    .map(([name, data]) => ({
      tag: name,
      count: data.count,
      color: data.color,
      glyph: data.glyph,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 4);

  const angle = 115 + ((volumeNumber * 37) % 90);
  const radialX = 20 + ((volumeNumber * 13) % 60);

  const sumTopCounts = topTags.reduce((s, t) => s + t.count, 0);

  let gradient = "";
  const isNeutral = topTags.length === 0 || sumTopCounts === 0;

  if (isNeutral) {
    gradient =
      "repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0 1px, transparent 1px 9px), var(--raised)";
  } else {
    let cum = 0;
    const stopStrings: string[] = [];

    const c1 = `color-mix(in srgb, ${topTags[0].color} 62%, transparent)`;
    stopStrings.push(`${c1} 0%`);

    for (let i = 0; i < topTags.length; i++) {
      const t = topTags[i];
      const weight_i = t.count / sumTopCounts;
      const position_i = (cum + weight_i / 2) * 100;
      cum += weight_i;
      const colour_i = `color-mix(in srgb, ${t.color} 58%, transparent)`;
      stopStrings.push(`${colour_i} ${position_i.toFixed(2)}%`);
    }

    const ck = `color-mix(in srgb, ${topTags[topTags.length - 1].color} 62%, transparent)`;
    stopStrings.push(`${ck} 100%`);

    const linearGrad = `linear-gradient(${angle}deg, ${stopStrings.join(", ")})`;
    // Bright specular highlight at top
    const radialGrad = `radial-gradient(circle at ${radialX}% 0%, rgba(255, 255, 255, 0.07), transparent 55%)`;
    // Dark vignette from bottom so text stays readable
    const bottomDark = "linear-gradient(to top, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.20) 55%, transparent 100%)";
    // Underlying dark surface
    const base = "var(--raised)";

    gradient = `${radialGrad}, ${bottomDark}, ${linearGrad}, ${base}`;
  }

  return {
    start,
    end,
    volumeNumber,
    archivedCount: rangeArticles.length,
    totalCount: end - start + 1,
    tagMix: topTags,
    angle,
    radialX,
    gradient,
    isNeutral,
  };
}
