"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "motion/react";
import { TagHubNote } from "@/lib/content";
import { PoolItem, PoolKeyword } from "@/app/random-pool.json/route";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";
import { SoapBubble, BubbleData } from "./soap-bubble";

interface RandomMosaicProps {
  ditherImages: string[];
  tagNotes: TagHubNote[];
}

// Neutral emoji fallback catalog
const NEUTRAL_EMOJIS = [
  "📚", "📜", "🔭", "⌛", "🌙", "🦉", "🗝️", "🧭", "✒️", "🖋️",
  "🌐", "⚖️", "🔨", "🏮", "🪜", "⚓", "🪶", "🗺️", "⏰", "📖",
  "🔍", "📐", "🎻", "🏛️", "🧱", "🏺", "🕰️", "🎒", "🗿", "🧩",
  "🛎️", "📦", "🗞️", "🗂️", "📻", "♟️", "🎙️", "💡", "🔭", "📜"
];

// Bayer 8x8 matrix for ordered dither
const BAYER_8X8 = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];

const emojiDataUrlCache = new Map<string, string>();

function getDitheredEmojiDataUrl(emoji: string): string {
  if (emojiDataUrlCache.has(emoji)) return emojiDataUrlCache.get(emoji)!;
  if (typeof document === "undefined") return "";

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "";

    ctx.clearRect(0, 0, 64, 64);
    ctx.font = "52px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 32, 34);

    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = imgData.data;

    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const idx = (y * 64 + x) * 4;
        const alpha = data[idx + 3] / 255;
        if (alpha < 0.1) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
          continue;
        }

        const lum = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255 * alpha;
        const gammaLum = Math.pow(lum, 0.8) * 64;
        const threshold = BAYER_8X8[y % 8][x % 8];

        if (gammaLum > threshold) {
          data[idx] = 201;
          data[idx + 1] = 168;
          data[idx + 2] = 124;
          data[idx + 3] = 191;
        } else {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL();
    emojiDataUrlCache.set(emoji, dataUrl);
    return dataUrl;
  } catch {
    return "";
  }
}

// Mulberry32 seeded PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface TileItem {
  id: string;
  col: number;
  row: number;
  w: number;
  h: number;
  type: "text" | "keyword" | "ruled" | "dither";
  paragraph?: PoolItem;
  keyword?: { target: string; display: string };
  ditherUrl?: string;
  ditherEmoji?: string;
}

export function RandomMosaic({ ditherImages, tagNotes }: RandomMosaicProps) {
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [seed, setSeed] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(1200);
  const [mounted, setMounted] = useState(false);
  const [bubbleInfo, setBubbleInfo] = useState<BubbleData | null>(null);

  const volSpanRef = useRef<HTMLSpanElement>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTappedTileRef = useRef<string | null>(null);

  // Fetch pool statically on client mount
  useEffect(() => {
    setMounted(true);
    setSeed(Date.now() & 0xffffffff);
    setViewportWidth(window.innerWidth);

    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);

    fetch("/random-pool.json")
      .then((res) => res.json())
      .then((data: PoolItem[]) => {
        setPool(data);
      })
      .catch((err) => {
        console.warn("Failed to load /random-pool.json", err);
      });

    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ══ VOLUME COUNTER ══════════════════════════════════════════════════════
  useEffect(() => {
    if (!mounted) return;

    // Check prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      if (volSpanRef.current) {
        volSpanRef.current.textContent = "1,842";
      }
      return;
    }

    let val = Math.floor(Math.random() * 700) + 300;
    if (volSpanRef.current) {
      volSpanRef.current.textContent = new Intl.NumberFormat("en-US").format(val);
    }

    type Phase = "crawl" | "walk" | "run" | "sprint" | "stall";
    let currentPhase: Phase = "crawl";
    let phaseTimerEnd = Date.now() + 3000;
    let timerId: NodeJS.Timeout | null = null;
    let isDisposed = false;

    const pickNextPhase = (last: Phase): Phase => {
      const choices: Phase[] = ["crawl", "walk", "run", "stall"];
      if (last === "walk" || last === "run") {
        choices.push("sprint");
      }
      const filtered = choices.filter((c) => c !== last);
      return filtered[Math.floor(Math.random() * filtered.length)];
    };

    const scheduleTick = () => {
      if (isDisposed) return;
      if (document.hidden) {
        timerId = setTimeout(scheduleTick, 500);
        return;
      }

      const now = Date.now();
      if (now >= phaseTimerEnd) {
        currentPhase = pickNextPhase(currentPhase);
        let duration = 3000;
        if (currentPhase === "crawl") duration = Math.random() * 2500 + 2500;
        else if (currentPhase === "walk") duration = Math.random() * 2000 + 2000;
        else if (currentPhase === "run") duration = Math.random() * 1300 + 1200;
        else if (currentPhase === "sprint") duration = Math.random() * 800 + 600;
        else if (currentPhase === "stall") duration = Math.random() * 700 + 900;
        phaseTimerEnd = now + duration;
      }

      let stepDelay = 800;
      let inc = 1;

      switch (currentPhase) {
        case "crawl":
          stepDelay = Math.random() * 700 + 700;
          inc = 1;
          break;
        case "walk":
          stepDelay = Math.random() * 140 + 180;
          inc = Math.floor(Math.random() * 3) + 1;
          break;
        case "run":
          stepDelay = Math.random() * 30 + 40;
          inc = Math.floor(Math.random() * 27) + 3;
          break;
        case "sprint":
          stepDelay = Math.random() * 8 + 16;
          inc = Math.floor(Math.random() * 967) + 31;
          break;
        case "stall":
          stepDelay = Math.random() * 700 + 900;
          inc = 0;
          break;
      }

      val += inc;
      if (val > 999999999) val = 300;

      if (volSpanRef.current && inc > 0) {
        volSpanRef.current.textContent = new Intl.NumberFormat("en-US").format(val);
      }

      timerId = setTimeout(scheduleTick, stepDelay);
    };

    timerId = setTimeout(scheduleTick, 500);

    return () => {
      isDisposed = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [mounted]);

  // Format today's date (Bangkok timezone: English uppercase + Thai Buddhist date)
  const dateFormatted = useMemo(() => {
    if (!mounted) {
      return "SUNDAY, 8 NOVEMBER 2026 · วันอาทิตย์ที่ 8 พฤศจิกายน 2569";
    }
    try {
      const now = new Date();
      const enDate = new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      })
        .format(now)
        .toUpperCase();

      const thDate = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      }).format(now);

      return `${enDate} · ${thDate}`;
    } catch {
      return "SUNDAY, 8 NOVEMBER 2026 · วันอาทิตย์ที่ 8 พฤศจิกายน 2569";
    }
  }, [mounted]);

  // Handle Reshuffle click
  const handleReshuffle = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSeed(Date.now() & 0xffffffff);
    setBubbleInfo(null);
  };

  // Grid dimensions
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const cols = isMobile ? 3 : isTablet ? 6 : 10;
  const rows = isMobile ? 18 : isTablet ? 12 : 9;
  const rowHeight = isMobile ? 90 : 105;

  // ══ 2D BIN-PACKING MOSAIC GENERATOR ══════════════════════════════════════
  const packedTiles = useMemo<TileItem[]>(() => {
    if (!seed || pool.length === 0) return [];

    const rng = mulberry32(seed);

    // Shuffle pool with seed
    const shuffledPool = [...pool].sort(() => rng() - 0.5);

    // Occupancy matrix (rows x cols)
    const grid: boolean[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => false)
    );

    const isAvailable = (r: number, c: number, w: number, h: number): boolean => {
      if (r + h > rows || c + w > cols) return false;
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          if (grid[r + dr][c + dc]) return false;
        }
      }
      return true;
    };

    const markOccupied = (r: number, c: number, w: number, h: number) => {
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          grid[r + dr][c + dc] = true;
        }
      }
    };

    const tiles: TileItem[] = [];
    const usedFirst40 = new Set<string>();
    const usedSeries = new Set<string>();

    const getSeriesKey = (title: string): string => {
      return title
        .replace(/\s*\((?:[0-9]+|[๑-๙]+)\)\s*$/, "")
        .replace(/\s*(?:ตอนที่|ตอน)\s*(?:[0-9]+|[๑-๙]+)\s*$/, "")
        .replace(/\s*[0-9]+$/, "")
        .trim();
    };

    let poolIdx = 0;
    let ditherImgIdx = 0;
    let ditherEmojiIdx = 0;

    // Standard tile shape catalogue
    const tileShapes = isMobile
      ? [
          { w: 2, h: 2 },
          { w: 3, h: 2 },
          { w: 2, h: 1 },
          { w: 1, h: 1 },
        ]
      : [
          { w: 3, h: 3 },
          { w: 3, h: 2 },
          { w: 2, h: 2 },
          { w: 2, h: 1 },
          { w: 1, h: 2 },
          { w: 1, h: 1 },
        ];

    // Find first available cell scan
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]) continue;

        // Pick shape fitting remaining space
        const fits = tileShapes.filter((s) => isAvailable(r, c, s.w, s.h));
        if (fits.length === 0) continue;

        // Bias towards larger shapes early, 1x1 only when needed
        const shape = fits[Math.floor(rng() * fits.length)];
        const area = shape.w * shape.h;
        markOccupied(r, c, shape.w, shape.h);

        // Decide tile type
        const roll = rng();
        let tileType: "text" | "keyword" | "ruled" | "dither" = "text";

        if (area === 1) {
          if (roll < 0.35) tileType = "dither";
          else if (roll < 0.65) tileType = "ruled";
          else if (roll < 0.85) tileType = "keyword";
          else tileType = "text";
        } else if (area === 2) {
          if (roll < 0.15) tileType = "ruled";
          else if (roll < 0.3) tileType = "keyword";
          else if (roll < 0.45 && ditherImages.length > 0) tileType = "dither";
          else tileType = "text";
        } else {
          // Large tiles: mostly text, occasionally image
          if (roll < 0.12 && ditherImages.length > 0) tileType = "dither";
          else tileType = "text";
        }

        const tileId = `tile-${r}-${c}`;

        if (tileType === "text") {
          // Find next paragraph satisfying series and first40 guard
          let selectedPara: PoolItem | undefined;

          // For 2x1 or bigger: choose keyword item with probability 0.5
          const preferKeyword = area >= 2 && rng() < 0.5;

          for (let attempt = 0; attempt < shuffledPool.length; attempt++) {
            const candidate = shuffledPool[(poolIdx + attempt) % shuffledPool.length];
            const first40 = candidate.text.slice(0, 40).replace(/[\s\p{P}\p{S}]/gu, "");
            const seriesKey = getSeriesKey(candidate.titleTh);

            if (usedFirst40.has(first40)) continue;
            if (usedSeries.has(seriesKey)) continue;

            if (preferKeyword && candidate.keywords.length === 0) continue;

            selectedPara = candidate;
            usedFirst40.add(first40);
            usedSeries.add(seriesKey);
            poolIdx = (poolIdx + attempt + 1) % shuffledPool.length;
            break;
          }

          // Fallback if strict filter exhausted
          if (!selectedPara) {
            selectedPara = shuffledPool[poolIdx % shuffledPool.length];
            poolIdx++;
          }

          tiles.push({
            id: tileId,
            col: c + 1,
            row: r + 1,
            w: shape.w,
            h: shape.h,
            type: "text",
            paragraph: selectedPara,
          });
        } else if (tileType === "keyword") {
          // Keywords > 12 chars must have 2x1 tile at least, never 1x1
          let kwNote = tagNotes[Math.floor(rng() * tagNotes.length)];
          if (area === 1 && kwNote && kwNote.title.length > 12) {
            // Find note <= 12 chars
            const shortNotes = tagNotes.filter((n) => n.title.length <= 12);
            if (shortNotes.length > 0) {
              kwNote = shortNotes[Math.floor(rng() * shortNotes.length)];
            }
          }

          tiles.push({
            id: tileId,
            col: c + 1,
            row: r + 1,
            w: shape.w,
            h: shape.h,
            type: "keyword",
            keyword: {
              target: kwNote?.slug || "philosophy",
              display: kwNote?.title || "Philosophy",
            },
          });
        } else if (tileType === "ruled") {
          tiles.push({
            id: tileId,
            col: c + 1,
            row: r + 1,
            w: shape.w,
            h: shape.h,
            type: "ruled",
          });
        } else {
          // Dither tile (image or emoji fallback)
          if (ditherImages.length > 0 && rng() < 0.7) {
            const imgUrl = ditherImages[ditherImgIdx % ditherImages.length];
            ditherImgIdx++;
            tiles.push({
              id: tileId,
              col: c + 1,
              row: r + 1,
              w: shape.w,
              h: shape.h,
              type: "dither",
              ditherUrl: imgUrl,
            });
          } else {
            const emoji = NEUTRAL_EMOJIS[ditherEmojiIdx % NEUTRAL_EMOJIS.length];
            ditherEmojiIdx++;
            tiles.push({
              id: tileId,
              col: c + 1,
              row: r + 1,
              w: shape.w,
              h: shape.h,
              type: "dither",
              ditherEmoji: emoji,
            });
          }
        }
      }
    }

    return tiles;
  }, [seed, pool, cols, rows, isMobile, ditherImages, tagNotes]);

  // ══ HOVER INTENT & TOUCH TRIGGER FOR SOAP BUBBLE ══════════════════════════
  const handleTileEnter = (el: HTMLElement, tile: TileItem, clientX?: number) => {
    if (tile.type !== "text" && tile.type !== "keyword") return;

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const pointerX = clientX !== undefined ? clientX : rect.left + rect.width / 2;

      if (tile.type === "text" && tile.paragraph) {
        setBubbleInfo({
          rect,
          pointerX,
          id: tile.paragraph.id,
          title: tile.paragraph.titleTh,
          isKeyword: false,
        });
      } else if (tile.type === "keyword" && tile.keyword) {
        setBubbleInfo({
          rect,
          pointerX,
          title: tile.keyword.display,
          isKeyword: true,
        });
      }
    }, 150);
  };

  const handleTileLeave = () => {
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }
    setBubbleInfo(null);
  };

  const handleTouchTile = (el: HTMLElement, tile: TileItem, e: React.MouseEvent) => {
    if (tile.type !== "text" && tile.type !== "keyword") return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      if (activeTappedTileRef.current !== tile.id) {
        e.preventDefault();
        activeTappedTileRef.current = tile.id;
        const rect = el.getBoundingClientRect();
        if (tile.type === "text" && tile.paragraph) {
          setBubbleInfo({
            rect,
            pointerX: rect.left + rect.width / 2,
            id: tile.paragraph.id,
            title: tile.paragraph.titleTh,
            isKeyword: false,
          });
        } else if (tile.type === "keyword" && tile.keyword) {
          setBubbleInfo({
            rect,
            pointerX: rect.left + rect.width / 2,
            title: tile.keyword.display,
            isKeyword: true,
          });
        }
      }
    }
  };

  return (
    <div className="random-page-container max-w-[1360px] mx-auto px-4 md:px-8 pt-8 pb-32">
      {/* ══ R1: NEWSPAPER MASTHEAD ═══════════════════════════════════════════ */}
      <header className="newspaper-masthead mb-8">
        {/* Row 1: VOL counter · Bangkok Date · Est 1997 */}
        <div className="border-t border-b border-[var(--line)] py-2 font-mono text-[11px] text-[var(--muted)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--gold)]">VOL.</span>
            <span
              ref={volSpanRef}
              className="tabular-nums font-mono text-[var(--text)] inline-block min-w-[12ch]"
            >
              1,842
            </span>
          </div>

          <div className="text-center flex-1 hidden sm:block uppercase tracking-wider text-[var(--text)] text-[10px] md:text-[11px]">
            {dateFormatted}
          </div>

          <div className="hidden sm:block text-right tracking-widest text-[10px]">
            DIGITAL MEMORIAL ARCHIVE · EST. 1997
          </div>
        </div>

        {/* Mobile secondary date bar */}
        <div className="sm:hidden border-b border-[var(--line)] py-1.5 text-center font-mono text-[10px] uppercase text-[var(--text)] tracking-wider">
          {dateFormatted}
        </div>

        {/* Row 2: Nameplate MIDNIGHT UNIVERSITY */}
        <div className="py-6 md:py-8 text-center">
          <h1
            className="font-serif font-bold uppercase text-[clamp(2.5rem,7vw,6rem)] text-[var(--text)] tracking-[0.04em]"
            style={{ lineHeight: 1.05 }}
          >
            Midnight University
          </h1>
        </div>

        {/* Row 3: Thai Motto between gold diamonds */}
        <div className="text-center font-thai text-[16px] text-[var(--muted)] pb-5 flex items-center justify-center gap-3">
          <span className="text-[var(--gold)] text-xs">✦</span>
          <Thai>กลางวันมืด กลางคืนกลับสว่าง</Thai>
          <span className="text-[var(--gold)] text-xs">✦</span>
        </div>

        {/* Mobile EST label under motto */}
        <div className="sm:hidden text-center font-mono text-[9px] text-[var(--muted)] tracking-widest pb-3">
          DIGITAL MEMORIAL ARCHIVE · EST. 1997
        </div>

        {/* Double Rule: 3px line, 3px gap, 1px line */}
        <div className="newspaper-double-rule w-full mb-8">
          <div className="h-[3px] bg-[var(--line-strong)]" />
          <div className="h-[3px]" />
          <div className="h-[1px] bg-[var(--line)]" />
        </div>
      </header>

      {/* ══ NEWSPAPER MOSAIC GRID ═══════════════════════════════════════════ */}
      <div
        className="newspaper-mosaic-grid relative w-full border border-[var(--line)] bg-[var(--bg)]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: `${rowHeight}px`,
          minHeight: `${rows * rowHeight}px`,
        }}
      >
        {packedTiles.map((tile, idx) => (
          <TileRenderer
            key={tile.id}
            tile={tile}
            index={idx}
            onMouseEnter={(el, clientX) => handleTileEnter(el, tile, clientX)}
            onMouseLeave={handleTileLeave}
            onTouchTile={(el, e) => handleTouchTile(el, tile, e)}
          />
        ))}
      </div>

      {/* ══ BOTTOM RESHUFFLE BAR ════════════════════════════════════════════ */}
      <div className="mt-12 pt-12 border-t border-[var(--line)] flex items-center justify-center gap-4">
        <span className="text-[var(--gold)] text-sm">✦</span>
        <button
          type="button"
          onClick={handleReshuffle}
          className="cursor-pointer font-mono text-[12px] uppercase tracking-wider text-[var(--gold)] border border-[var(--gold)] px-7 py-3 flex items-center gap-2 hover:bg-[var(--gold)] hover:text-[var(--bg)] transition-colors duration-150"
        >
          <Icon name="shuffle" size={14} />
          <span>RESHUFFLE</span>
        </button>
        <span className="text-[var(--gold)] text-sm">✦</span>
      </div>

      {/* ══ R3: SOAP-BUBBLE HOVER PORTAL ═════════════════════════════════════ */}
      {typeof document !== "undefined" &&
        createPortal(<SoapBubble bubble={bubbleInfo} />, document.body)}
    </div>
  );
}

// ══ INDIVIDUAL TILE RENDERER ══════════════════════════════════════════════
interface TileRendererProps {
  tile: TileItem;
  index: number;
  onMouseEnter: (el: HTMLElement, clientX?: number) => void;
  onMouseLeave: () => void;
  onTouchTile: (el: HTMLElement, e: React.MouseEvent) => void;
}

function TileRenderer({ tile, index, onMouseEnter, onMouseLeave, onTouchTile }: TileRendererProps) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [ditherDataUrl, setDitherDataUrl] = useState<string>("");

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (tile.type === "dither" && tile.ditherEmoji) {
      setDitherDataUrl(getDitheredEmojiDataUrl(tile.ditherEmoji));
    }
  }, [tile.type, tile.ditherEmoji]);

  const area = tile.w * tile.h;

  return (
    <motion.div
      ref={tileRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.35,
        delay: Math.min(0.6, index * 0.015),
        ease: "easeOut",
      }}
      className={`newspaper-tile group relative overflow-hidden transition-all duration-160 ${
        tile.type !== "ruled" ? "cursor-pointer" : ""
      }`}
      style={{
        gridColumn: `${tile.col} / span ${tile.w}`,
        gridRow: `${tile.row} / span ${tile.h}`,
        border: "1px solid var(--line)",
        padding: area === 1 ? "8px" : "12px",
      }}
      onMouseEnter={(e) => tileRef.current && onMouseEnter(tileRef.current, e.clientX)}
      onMouseLeave={onMouseLeave}
      onClick={(e) => tileRef.current && onTouchTile(tileRef.current, e)}
    >
      {/* ── TYPE: TEXT / TEXT WITH KEYWORD ───────────────────────────────── */}
      {tile.type === "text" && tile.paragraph && (
        <TextTileContent
          paragraph={tile.paragraph}
          area={area}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* ── TYPE: PURE KEYWORD ───────────────────────────────────────────── */}
      {tile.type === "keyword" && tile.keyword && (
        <KeywordTileContent
          keyword={tile.keyword}
          area={area}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* ── TYPE: RULED BARS ─────────────────────────────────────────────── */}
      {tile.type === "ruled" && (
        <RuledTileContent height={dimensions.height} seedKey={tile.id} />
      )}

      {/* ── TYPE: DITHER IMAGE OR EMOJI ──────────────────────────────────── */}
      {tile.type === "dither" && (
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          {tile.ditherUrl ? (
            <img
              src={tile.ditherUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            ditherDataUrl && (
              <img
                src={ditherDataUrl}
                alt=""
                className="select-none pointer-events-none"
                style={{
                  width: "70%",
                  height: "70%",
                  objectFit: "contain",
                  imageRendering: "pixelated",
                }}
              />
            )
          )}
        </div>
      )}

      {/* Stretched Link to Article (Text Tile) */}
      {tile.type === "text" && tile.paragraph && (
        <Link
          href={`/article/${tile.paragraph.id}`}
          className="absolute inset-0 z-10"
          aria-label={`${tile.paragraph.id} ${tile.paragraph.titleTh}`}
        />
      )}
    </motion.div>
  );
}

// ══ KEYWORD TILE WITH WORD FITTING ═════════════════════════════════════════
interface KeywordTileContentProps {
  keyword: { target: string; display: string };
  area: number;
  width: number;
  height: number;
}

function KeywordTileContent({ keyword, area, width }: KeywordTileContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(area === 1 ? 13 : 20);

  // Fit font size so widest word fits inside width - 16px
  useEffect(() => {
    if (width <= 0) return;
    const innerWidth = width - 16;
    const words = keyword.display.split(/\s+/);

    if (typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let sz = area === 1 ? 13 : 20;
    while (sz >= 8.5) {
      ctx.font = area === 1 ? `600 ${sz}px monospace` : `italic ${sz}px serif`;
      let fitsAll = true;
      for (const w of words) {
        if (ctx.measureText(w).width > innerWidth) {
          fitsAll = false;
          break;
        }
      }
      if (fitsAll) break;
      sz -= 0.5;
    }

    setFontSize(Math.max(8.5, sz));
  }, [keyword.display, area, width]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center text-center p-2"
      style={{
        overflowWrap: "normal",
        wordBreak: "normal",
        hyphens: "none",
      }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          letterSpacing: fontSize < 11 ? "normal" : area === 1 ? "0.08em" : "normal",
        }}
        className={
          area === 1
            ? "font-mono uppercase text-[var(--gold)] font-semibold hover:text-[var(--gold-bright)] transition-colors leading-tight"
            : "font-serif italic text-[var(--text)] hover:text-[var(--gold-bright)] transition-colors leading-tight underline underline-offset-4 decoration-[var(--line-strong)]"
        }
      >
        {keyword.display}
      </span>

      {/* Pure Keyword Stretched Link */}
      <Link
        href={`/keyword/${encodeURIComponent(keyword.target)}`}
        className="absolute inset-0 z-10"
        aria-label={`Keyword ${keyword.display}`}
      />
    </div>
  );
}

// ══ TEXT TILE WITH THAI WORD-BOUNDARY WINDOW RULE ═════════════════════════
interface TextTileContentProps {
  paragraph: PoolItem;
  area: number;
  width: number;
  height: number;
}

function TextTileContent({ paragraph, area, width, height }: TextTileContentProps) {
  const { fontSizePx, fontClass, lineHeight } = useMemo(() => {
    if (area === 1) return { fontSizePx: 12, fontClass: "font-sans text-[12px]", lineHeight: 1.7 };
    if (area === 2) return { fontSizePx: 13, fontClass: "font-sans text-[13px]", lineHeight: 1.7 };
    if (area === 4) return { fontSizePx: 15, fontClass: "font-sans text-[15px]", lineHeight: 1.75 };
    if (area <= 6) return { fontSizePx: 17, fontClass: "font-serif italic text-[17px]", lineHeight: 1.8 };
    return { fontSizePx: 21, fontClass: "font-serif italic text-[20px] md:text-[22px]", lineHeight: 1.85 };
  }, [area]);

  // Window capacity calculation
  const windowedContent = useMemo(() => {
    const text = paragraph.text;
    const keywords = paragraph.keywords || [];

    if (width <= 0 || height <= 0 || text.length <= 80) {
      return {
        prefix: "",
        keyword: keywords[0] || null,
        suffix: text,
        leadingEllipsis: false,
        trailingEllipsis: false,
      };
    }

    const charsPerLine = Math.floor(width / (fontSizePx * 0.55));
    const lines = Math.floor(height / (fontSizePx * lineHeight));
    const capacity = Math.max(40, Math.floor(charsPerLine * lines * 0.85));

    // Prefer keyword located after the first 15% of paragraph
    let chosenKw: PoolKeyword | null = null;
    const minStart = Math.floor(text.length * 0.15);
    for (const kw of keywords) {
      if (kw.start >= minStart) {
        chosenKw = kw;
        break;
      }
    }
    if (!chosenKw && keywords.length > 0) {
      chosenKw = keywords[0];
    }

    if (!chosenKw) {
      // Just cut to capacity snapped to Thai word boundary
      if (text.length <= capacity) {
        return {
          prefix: text,
          keyword: null,
          suffix: "",
          leadingEllipsis: false,
          trailingEllipsis: false,
        };
      }
      let cutIndex = capacity;
      if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
        try {
          const segmenter = new (Intl as any).Segmenter("th", { granularity: "word" });
          for (const s of segmenter.segment(text)) {
            if (s.index + s.segment.length > capacity) {
              cutIndex = s.index;
              break;
            }
          }
        } catch {
          cutIndex = capacity;
        }
      }
      return {
        prefix: text.substring(0, cutIndex),
        keyword: null,
        suffix: "",
        leadingEllipsis: false,
        trailingEllipsis: true,
      };
    }

    // Centered window around chosen keyword
    const kwLen = chosenKw.end - chosenKw.start;
    const side = Math.max(15, Math.floor((capacity - kwLen) / 2));
    let start = Math.max(0, chosenKw.start - side);
    let end = Math.min(text.length, chosenKw.end + side);

    // Shift window if boundary clamped
    if (start === 0) {
      end = Math.min(text.length, capacity);
    } else if (end === text.length) {
      start = Math.max(0, text.length - capacity);
    }

    // Snap to word boundaries using Intl.Segmenter
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      try {
        const segmenter = new (Intl as any).Segmenter("th", { granularity: "word" });
        if (start > 0) {
          for (const s of segmenter.segment(text)) {
            if (s.index >= start) {
              start = s.index;
              break;
            }
          }
        }
        if (end < text.length) {
          for (const s of segmenter.segment(text)) {
            if (s.index + s.segment.length >= end) {
              end = s.index + s.segment.length;
              break;
            }
          }
        }
      } catch {
        // fallback
      }
    }

    const prefix = text.substring(start, chosenKw.start);
    const suffix = text.substring(chosenKw.end, end);

    return {
      prefix,
      keyword: chosenKw,
      suffix,
      leadingEllipsis: start > 0,
      trailingEllipsis: end < text.length,
    };
  }, [paragraph, width, height, fontSizePx, lineHeight]);

  return (
    <div
      className={`w-full h-full text-[var(--text)] overflow-hidden flex flex-col justify-between ${fontClass}`}
      style={{ lineHeight }}
    >
      <div className="line-clamp-none">
        {windowedContent.leadingEllipsis && "…"}
        <span>{windowedContent.prefix}</span>
        {windowedContent.keyword && (
          <Link
            href={`/keyword/${encodeURIComponent(windowedContent.keyword.target)}`}
            className="keyword-link relative z-20 mx-0.5 inline font-normal text-[var(--gold)] underline decoration-1 underline-offset-[0.22em] decoration-[color-mix(in_srgb,var(--gold)_55%,transparent)] hover:text-[var(--gold-bright)] hover:decoration-[var(--gold-bright)] transition-colors duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {windowedContent.keyword.display}
          </Link>
        )}
        <span>{windowedContent.suffix}</span>
        {windowedContent.trailingEllipsis && "…"}
      </div>

      {area >= 4 && (
        <div className="pt-2 mt-auto font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] flex items-center justify-between border-t border-[var(--line)]">
          <span>NO. {paragraph.id}</span>
          <span className="line-clamp-1 max-w-[140px] text-right font-thai">
            {paragraph.titleTh}
          </span>
        </div>
      )}
    </div>
  );
}

// ══ RULED BARS TILE ════════════════════════════════════════════════════════
function RuledTileContent({ height, seedKey }: { height: number; seedKey: string }) {
  const lineCount = Math.max(3, Math.floor(height / 12));
  return (
    <div className="w-full h-full flex flex-col justify-evenly py-2 opacity-40">
      {Array.from({ length: lineCount }).map((_, i) => (
        <div
          key={`${seedKey}-rule-${i}`}
          className="w-full h-[1px] bg-[var(--line-strong)]"
        />
      ))}
    </div>
  );
}
