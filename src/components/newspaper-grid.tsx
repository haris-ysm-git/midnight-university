"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { RandomParagraph } from "@/lib/content";
import { ACCENT, BG, SERIF, MONO } from "@/lib/design-tokens";

// ─── Grid constants ───────────────────────────────────────────────────────────
const DESKTOP_COLS = 18;
const DESKTOP_ROWS = 6;
const MOBILE_COLS = 4;

// Cell size in px (desktop)
const CELL_W = 72;
const CELL_H = 96;

// ─── Block size blueprints ────────────────────────────────────────────────────
type SizeHint = "hero" | "feature" | "column" | "brief" | "micro";
type BlockDef = { w: number; h: number; hint: SizeHint };

const DESKTOP_BLOCK_POOL: BlockDef[] = [
  { w: 5, h: 4, hint: "hero" },
  { w: 4, h: 3, hint: "hero" },
  { w: 3, h: 4, hint: "feature" },
  { w: 4, h: 2, hint: "feature" },
  { w: 3, h: 2, hint: "column" },
  { w: 3, h: 2, hint: "column" },
  { w: 2, h: 3, hint: "column" },
  { w: 2, h: 2, hint: "brief" },
  { w: 2, h: 2, hint: "brief" },
  { w: 2, h: 1, hint: "brief" },
  { w: 1, h: 2, hint: "micro" },
  { w: 1, h: 1, hint: "micro" },
  { w: 1, h: 1, hint: "micro" },
];

// For mobile, we want a lot of items to ensure a long scroll
const MOBILE_BLOCK_POOL: BlockDef[] = Array.from({ length: 30 }, (_, i) => {
  if (i % 8 === 0) return { w: 4, h: 3, hint: "hero" as SizeHint };
  if (i % 5 === 0) return { w: 3, h: 2, hint: "feature" as SizeHint };
  if (i % 3 === 0) return { w: 2, h: 2, hint: "column" as SizeHint };
  return { w: 2, h: 1, hint: "brief" as SizeHint };
});

// ─── Placed tile ──────────────────────────────────────────────────────────────
interface Tile {
  col: number;
  row: number;
  w: number;
  h: number;
  hint: SizeHint;
  content: RandomParagraph | null;
  fillerType?: "ornament" | "rule" | "emoji" | "quote-mark" | "tag";
  tag?: string;
}

// ─── Bin-packing helper ───────────────────────────────────────────────────────
function packTiles(cols: number, rows: number, paragraphs: RandomParagraph[], tags: string[], isMobile: boolean): Tile[] {
  // occupancy grid
  const grid: boolean[][] = Array.from({ length: rows + 200 }, () => new Array(cols + 1).fill(false));

  const isFree = (c: number, r: number, w: number, h: number): boolean => {
    if (c + w - 1 > cols || r + h - 1 > rows + 150) return false;
    for (let rr = r; rr < r + h; rr++)
      for (let cc = c; cc < c + w; cc++)
        if (grid[rr][cc]) return false;
    return true;
  };

  const occupy = (c: number, r: number, w: number, h: number) => {
    for (let rr = r; rr < r + h; rr++)
      for (let cc = c; cc < c + w; cc++)
        grid[rr][cc] = true;
  };

  const tiles: Tile[] = [];
  
  // 1. Prepare items to place
  type PlacementTask = { type: 'article', data: RandomParagraph, def: BlockDef } | { type: 'tag', tag: string } | { type: 'filler', fType: Tile["fillerType"] };
  
  const tasks: PlacementTask[] = [];
  
  // Add articles with varying block sizes
  const pool = isMobile ? MOBILE_BLOCK_POOL : DESKTOP_BLOCK_POOL;
  paragraphs.forEach((p, i) => {
    const def = pool[i % pool.length];
    tasks.push({ type: 'article', data: p, def });
  });

  // Intermix some tags and fillers throughout the list
  const fillerTypes: Tile["fillerType"][] = ["ornament", "rule", "emoji", "quote-mark"];
  for (let i = 0; i < (isMobile ? 40 : 10); i++) {
    tasks.push({ type: 'tag', tag: tags[i % tags.length] });
    tasks.push({ type: 'filler', fType: fillerTypes[i % fillerTypes.length] });
  }

  // Shuffle tasks to ensure intermixing
  const shuffledTasks = tasks.sort(() => 0.5 - Math.random());

  // 2. Place tasks
  shuffledTasks.forEach(task => {
    let w = 1, h = 1, hint: SizeHint = "micro";
    if (task.type === 'article') {
      w = task.def.w; h = task.def.h; hint = task.def.hint;
    }

    let placed = false;
    outer: for (let r = 1; r < (isMobile ? rows + 100 : rows + 1); r++) {
      for (let c = 1; c <= cols; c++) {
        if (isFree(c, r, w, h)) {
          occupy(c, r, w, h);
          tiles.push({
            col: c, row: r, w, h, hint,
            content: task.type === 'article' ? task.data : null,
            fillerType: task.type === 'tag' ? 'tag' : (task.type === 'filler' ? task.fType : undefined),
            tag: task.type === 'tag' ? task.tag : undefined
          });
          placed = true;
          break outer;
        }
      }
    }
  });

  // 3. Final fill for any remaining holes or "bottom of page" padding
  let tagIdx = shuffledTasks.filter(t => t.type === 'tag').length;
  let fi = 0;
  
  // Find current max row
  const currentMaxRow = tiles.reduce((m, t) => Math.max(m, t.row + t.h - 1), 1);
  const targetEndRow = isMobile ? currentMaxRow + 20 : DESKTOP_ROWS;

  for (let r = 1; r <= targetEndRow; r++) {
    for (let c = 1; c <= cols; c++) {
      if (!grid[r][c]) {
        let w = 1, h = 1;
        // Occasionally try 2x1
        if (c + 1 <= cols && !grid[r][c+1] && Math.random() > 0.7) { w = 2; }
        
        if (isFree(c, r, w, h)) {
          occupy(c, r, w, h);
          const rand = Math.random();
          let type: Tile["fillerType"] = "emoji";
          if (rand < 0.3) type = "tag";
          else if (rand < 0.5) type = "ornament";
          else if (rand < 0.7) type = "rule";
          else if (rand < 0.9) type = "emoji";
          else type = "quote-mark";

          tiles.push({
            col: c, row: r, w, h, hint: "micro",
            content: null,
            fillerType: type,
            tag: type === "tag" ? tags[(tagIdx++) % tags.length] : undefined
          });
        }
      }
    }
  }

  return tiles;
}

// ─── Decorative filler cell ───────────────────────────────────────────────────
const FILLERS_CONFIG: Record<string, { el: (tag?: string) => React.ReactNode }> = {
  ornament: {
    el: () => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, height: "100%" }}>
        <div style={{ width: "100%", height: 1, background: "rgba(200,168,130,0.2)" }} />
        <span style={{ color: "#C8A882", fontSize: 9, letterSpacing: "0.4em", fontFamily: MONO, opacity: 0.6 }}>✦ ✦ ✦</span>
        <div style={{ width: "100%", height: 1, background: "rgba(200,168,130,0.2)" }} />
      </div>
    ),
  },
  rule: {
    el: () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ width: "60%", height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>
    ),
  },
  emoji: {
    el: () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <span style={{ fontSize: 24, filter: "grayscale(0.3) sepia(0.3)", opacity: 0.7 }}>
          {["🏛️", "⚖️", "🗿", "🏺", "🦉", "📜", "📖", "🕯️", "🌑", "🔭", "🪶", "⏳"][Math.floor(Math.random() * 12)]}
        </span>
      </div>
    ),
  },
  "quote-mark": {
    el: () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <span style={{ color: "rgba(200,168,130,0.12)", fontSize: 42, fontFamily: SERIF, lineHeight: 1 }}>&ldquo;</span>
      </div>
    ),
  },
  tag: {
    el: (tag) => (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100%", 
        padding: "6px", 
        textAlign: "center",
      }}>
        <span style={{ 
          color: ACCENT, 
          fontSize: 9, 
          fontFamily: MONO, 
          textTransform: "uppercase", 
          letterSpacing: "0.05em",
          lineHeight: 1.1,
          opacity: 0.8
        }}>
          {tag || "ARCHIVE"}
        </span>
      </div>
    )
  }
};

// ─── Font size by hint ────────────────────────────────────────────────────────
function headlineFontSize(hint: SizeHint, isMobile: boolean): string {
  const map: Record<SizeHint, [string, string]> = {
    hero:    ["1.55rem", "1.15rem"],
    feature: ["1.1rem",  "0.95rem"],
    column:  ["0.88rem", "0.82rem"],
    brief:   ["0.78rem", "0.76rem"],
    micro:   ["0.7rem",  "0.68rem"],
  };
  return isMobile ? map[hint][1] : map[hint][0];
}

// ─── Single content tile ──────────────────────────────────────────────────────
function ContentTile({ tile, isMobile }: { tile: Tile; isMobile: boolean }) {
  const [hovered, setHovered] = useState(false);
  const para = tile.content!;
  const isHero = tile.hint === "hero";
  const isFeature = tile.hint === "feature";

  const displayContent = (isHero || isFeature) && para.fullText.length > para.text.length 
    ? (para.fullText.length > 600 ? para.fullText.slice(0, 600) + "..." : para.fullText)
    : para.text;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: Math.random() * 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: `${tile.col} / span ${tile.w}`,
        gridRow: `${tile.row} / span ${tile.h}`,
        border: "0.5px solid rgba(255,255,255,0.07)",
        background: hovered ? "rgba(200,168,130,0.04)" : "transparent",
        padding: isMobile ? "12px" : `${Math.min(tile.h * 12, 28)}px ${Math.min(tile.w * 10, 24)}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: isHero || isFeature ? "space-between" : "flex-start",
        gap: 8,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.25s ease",
      }}
    >
      <div style={{
        fontSize: isMobile ? 7 : 8,
        letterSpacing: "0.28em",
        color: hovered ? ACCENT : "rgba(200,168,130,0.45)",
        fontFamily: MONO,
        textTransform: "uppercase",
        lineHeight: 1,
        transition: "color 0.25s",
        flexShrink: 0,
      }}>
        {para.articleId}
      </div>

      {(isHero || isFeature) && (
        <div style={{ height: 1, background: "rgba(200,168,130,0.2)", flexShrink: 0 }} />
      )}

      <div style={{
        fontFamily: isHero ? SERIF : (isFeature ? SERIF : MONO),
        fontSize: headlineFontSize(tile.hint, isMobile),
        lineHeight: isHero ? 1.5 : 1.6,
        color: hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.82)",
        fontStyle: isHero || isFeature ? "italic" : "normal",
        fontWeight: isHero ? 500 : 400,
        overflow: "hidden",
        flex: 1,
        wordBreak: "break-word",
        transition: "color 0.25s",
      }}>
        {displayContent}
      </div>

      <div style={{ flexShrink: 0 }}>
        {(isHero || isFeature || tile.hint === "column") && (
          <div style={{
            fontSize: isMobile ? 8 : 9,
            letterSpacing: "0.05em",
            color: "rgba(255,255,255,0.35)",
            fontFamily: MONO,
            textTransform: "uppercase",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {para.articleTitle}
          </div>
        )}
        <Link
          href={`/article/${para.articleId}`}
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: 8,
            letterSpacing: "0.25em",
            color: hovered ? ACCENT : "rgba(200,168,130,0.0)",
            fontFamily: MONO,
            textTransform: "uppercase",
            transition: "color 0.25s",
            textDecoration: "none",
          }}
        >
          READ FULL ENTRY →
        </Link>
      </div>

      {isHero && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 10,
          width: 8,
          height: 8,
          borderTop: `1px solid ${ACCENT}`,
          borderRight: `1px solid ${ACCENT}`,
          opacity: 0.4,
        }} />
      )}
    </motion.div>
  );
}

// ─── Filler tile ──────────────────────────────────────────────────────────────
function FillerTile({ tile }: { tile: Tile }) {
  const type = tile.fillerType || "ornament";
  return (
    <div
      style={{
        gridColumn: `${tile.col} / span ${tile.w}`,
        gridRow: `${tile.row} / span ${tile.h}`,
        border: "0.5px solid rgba(255,255,255,0.04)",
        overflow: "hidden",
        background: type === "tag" ? "rgba(200,168,130,0.02)" : "transparent"
      }}
    >
      {FILLERS_CONFIG[type].el(tile.tag)}
    </div>
  );
}

// ─── Masthead ─────────────────────────────────────────────────────────────────
function Masthead({ date, edition }: { date: string; edition: number }) {
  return (
    <div style={{
      width: "100%",
      borderBottom: "2.5px double rgba(200,168,130,0.45)",
      padding: "16px 0 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(200,168,130,0.2)" }} />

      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 4px",
      }}>
        <span style={{ fontSize: 9, letterSpacing: "0.28em", color: "rgba(200,168,130,0.5)", fontFamily: MONO }}>
          VOL.&nbsp;{String(edition).padStart(3, "0")}
        </span>
        <span style={{ fontSize: 9, letterSpacing: "0.28em", color: "rgba(200,168,130,0.5)", fontFamily: MONO }}>
          {date}
        </span>
        <span style={{ fontSize: 9, letterSpacing: "0.28em", color: "rgba(200,168,130,0.5)", fontFamily: MONO }}>
          THE&nbsp;ARCHIVE
        </span>
      </div>

      <div style={{
        fontFamily: SERIF,
        fontSize: "clamp(1.8rem, 6vw, 3.8rem)",
        letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.95)",
        textAlign: "center",
        fontWeight: 800,
        lineHeight: 1,
        textTransform: "uppercase",
      }}>
        Midnight University
      </div>

      <div style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: "0.45em",
        color: "rgba(200,168,130,0.6)",
        textAlign: "center",
        opacity: 0.8
      }}>
        ✦&nbsp;&nbsp;CURATED FRAGMENTS OF KNOWLEDGE&nbsp;&nbsp;✦
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NewspaperGrid({ paragraphs, tags }: { paragraphs: RandomParagraph[], tags: string[] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [edition, setEdition] = useState(1);

  const today = useMemo(() => new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase(), []);

  const buildLayout = useCallback((mobile: boolean) => {
    const cols = mobile ? MOBILE_COLS : DESKTOP_COLS;
    const rows = mobile ? paragraphs.length * 3 : DESKTOP_ROWS;
    
    const built = packTiles(cols, rows, paragraphs, tags, mobile);
    setTiles(built);
    setEdition(Math.floor(Math.random() * 999) + 1);
  }, [paragraphs, tags]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      buildLayout(mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [buildLayout]);

  const cellH = isMobile ? 96 : CELL_H;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: BG,
      fontFamily: MONO,
      overflowY: "auto",
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: isMobile ? "12px 12px 0" : "24px 32px 0" }}>
        <Masthead date={today} edition={edition} />
      </div>

      <div style={{
        flex: 1,
        padding: isMobile ? "0 12px 40px" : "0 32px 40px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${isMobile ? MOBILE_COLS : DESKTOP_COLS}, 1fr)`,
          gridAutoRows: `${cellH}px`,
          width: "100%",
          gap: 0
        }}>
          {tiles.map((tile, i) =>
            tile.content
              ? <ContentTile key={i} tile={tile} isMobile={isMobile} />
              : <FillerTile key={i} tile={tile} />
          )}
        </div>
      </div>

      <div style={{
        padding: "20px 32px",
        borderTop: "1px solid rgba(200,168,130,0.15)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0,0,0,0.3)"
      }}>
        <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(200,168,130,0.5)", fontFamily: MONO }}>
          END OF EDITION&nbsp;&nbsp;·&nbsp;&nbsp;RELOAD FOR NEW FRAGMENTS
        </span>
      </div>
    </div>
  );
}
