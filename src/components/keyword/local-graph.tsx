"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Backlink } from "@/lib/backlinks";
import { getTagStyle } from "@/lib/tag-style";

interface LocalGraphProps {
  keyword: string;
  articles: Backlink[];
  relatedKeywords: { tag: string; count: number }[];
}

interface NodePos {
  id: string;
  label: string;
  type: "centre" | "article" | "keyword";
  color: string;
  radius: number;
  x: number;
  y: number;
  href?: string;
}

interface Edge {
  x1: number; y1: number;
  x2: number; y2: number;
}

/** Run a simple repulsion + spring simulation on a fixed canvas, return settled positions. */
function computeLayout(
  nodeCount: number,
  orbitR: number,
  canvasW: number,
  canvasH: number,
): { x: number; y: number }[] {
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  // Initial positions: centre node at centre, others in a circle
  const positions: { x: number; y: number }[] = [{ x: cx, y: cy }];
  for (let i = 1; i < nodeCount; i++) {
    const angle = ((i - 1) / Math.max(1, nodeCount - 1)) * 2 * Math.PI;
    const jitter = 1 + ((i - 1) % 3) * 0.15;
    positions.push({
      x: cx + Math.cos(angle) * orbitR * jitter,
      y: cy + Math.sin(angle) * orbitR * jitter,
    });
  }

  const K  = orbitR * 0.9;   // natural link length
  const KR = orbitR * 1.8;   // repulsion range
  const pad = 18;

  // Iterate
  for (let iter = 0; iter < 120; iter++) {
    const alpha = 1 - iter / 120;
    const forces = positions.map(() => ({ fx: 0, fy: 0 }));

    // Spring: centre → satellite
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[0].x;
      const dy = positions[i].y - positions[0].y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const f  = (d - K) * 0.06 * alpha;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      forces[0].fx += fx;
      forces[0].fy += fy;
      forces[i].fx -= fx;
      forces[i].fy -= fy;
    }

    // Repulsion: all pairs
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const d2 = dx * dx + dy * dy || 0.001;
        if (d2 < KR * KR) {
          const d  = Math.sqrt(d2);
          const f  = (KR - d) / d * 0.08 * alpha;
          forces[i].fx -= dx * f;
          forces[i].fy -= dy * f;
          forces[j].fx += dx * f;
          forces[j].fy += dy * f;
        }
      }
    }

    // Apply + clamp to canvas
    for (let i = 0; i < positions.length; i++) {
      positions[i].x = Math.max(pad, Math.min(canvasW - pad, positions[i].x + forces[i].fx));
      positions[i].y = Math.max(pad, Math.min(canvasH - pad, positions[i].y + forces[i].fy));
    }
  }

  return positions;
}

export function LocalGraph({ keyword, articles, relatedKeywords }: LocalGraphProps) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom]   = useState(1);
  const [panX, setPanX]   = useState(0);
  const [panY, setPanY]   = useState(0);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Measure the wrapper width ONCE after mount (no ResizeObserver feedback possible
  // because the wrapper is not inside the SVG).
  useEffect(() => {
    if (!wrapRef.current) return;
    // Measure immediately
    const w = wrapRef.current.getBoundingClientRect().width;
    setCanvasW(Math.max(200, w));

    // Also handle resize (page layout changes etc.)
    let raf = 0;
    const ro = new ResizeObserver((entries) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cw = entries[0]?.contentRect.width;
        if (cw) setCanvasW(Math.max(200, cw));
      });
    });
    ro.observe(wrapRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const canvasH = useMemo(() => (canvasW < 400 ? 240 : 280), [canvasW]);

  const artSlice = useMemo(() => articles.slice(0, 40), [articles]);
  const kwSlice  = useMemo(() => relatedKeywords.slice(0, 12), [relatedKeywords]);
  const total    = artSlice.length + kwSlice.length;
  const orbitR   = useMemo(
    () => Math.max(50, Math.min(canvasW * 0.32, 40 + total * 3)),
    [total, canvasW],
  );

  // Compute layout (runs synchronously, is fast enough for ≤53 nodes)
  const { nodes, edges } = useMemo<{ nodes: NodePos[]; edges: Edge[] }>(() => {
    if (canvasW === 0) return { nodes: [], edges: [] };

    const nodeCount = 1 + artSlice.length + kwSlice.length;
    const positions = computeLayout(nodeCount, orbitR, canvasW, canvasH);

    const nodeList: NodePos[] = [];
    const edgeList: Edge[]   = [];

    // Centre
    nodeList.push({
      id: "centre", label: keyword, type: "centre",
      color: "#c9a87c", radius: 10,
      x: positions[0].x, y: positions[0].y,
    });

    // Articles
    artSlice.forEach((a, i) => {
      const style = getTagStyle(a.sourceTags?.[0] || "");
      const pos   = positions[1 + i];
      nodeList.push({
        id: `article-${a.sourceId}`, label: a.sourceId,
        type: "article", color: style.color, radius: 5,
        x: pos.x, y: pos.y,
        href: `/article/${a.sourceId}`,
      });
      edgeList.push({ x1: positions[0].x, y1: positions[0].y, x2: pos.x, y2: pos.y });
    });

    // Keywords
    kwSlice.forEach((kw, i) => {
      const pos = positions[1 + artSlice.length + i];
      nodeList.push({
        id: `kw-${kw.tag}`, label: kw.tag,
        type: "keyword", color: "#c9a87c", radius: 6,
        x: pos.x, y: pos.y,
        href: `/keyword/${encodeURIComponent(kw.tag)}`,
      });
      edgeList.push({ x1: positions[0].x, y1: positions[0].y, x2: pos.x, y2: pos.y });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [canvasW, canvasH, orbitR, keyword, artSlice, kwSlice]);

  // ── Pan handlers ─────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setPanX(px => px + e.clientX - lastMouse.current.x);
    setPanY(py => py + e.clientY - lastMouse.current.y);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseUp = useCallback(() => { isPanning.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(4, z * (e.deltaY < 0 ? 1.12 : 0.9))));
  }, []);

  const resetView = useCallback(() => { setZoom(1); setPanX(0); setPanY(0); }, []);
  const zoomIn    = useCallback(() => setZoom(z => Math.min(4,   z * 1.3)), []);
  const zoomOut   = useCallback(() => setZoom(z => Math.max(0.3, z * 0.77)), []);

  if (artSlice.length === 0 && kwSlice.length === 0) {
    return (
      <div
        ref={wrapRef}
        className="border border-[var(--line)] bg-[var(--sunken)] flex items-center justify-center"
        style={{ height: 240 }}
      >
        <span className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider">
          NO CONNECTIONS YET
        </span>
      </div>
    );
  }

  // The SVG transform origin is (0,0); we pan & zoom with a <g> transform.
  const transform = `translate(${panX},${panY}) scale(${zoom})`;

  return (
    // wrapRef sits OUTSIDE the SVG — no layout feedback possible
    <div ref={wrapRef} style={{ width: "100%" }}>
      <div
        className="border border-[var(--line)] bg-[var(--sunken)] relative select-none"
        style={{ width: "100%", height: canvasH, overflow: "hidden", cursor: isPanning.current ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        {/* SVG — always exactly the container size, never bigger */}
        {canvasW > 0 && (
          <svg
            width={canvasW}
            height={canvasH}
            style={{ display: "block", pointerEvents: "none" }}
          >
            <g transform={transform}>
              {/* Edges */}
              {edges.map((e, i) => (
                <line
                  key={i}
                  x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke="rgba(201,168,124,0.22)"
                  strokeWidth={0.8}
                />
              ))}

              {/* Nodes */}
              {nodes.map((n) => {
                const isHovered = hoveredId === n.id;
                const isCentre  = n.type === "centre";
                const r = n.radius + (isHovered ? 2 : 0);
                const label = n.label.length > 18 ? n.label.substring(0, 16) + "…" : n.label;
                const showLabel = isCentre || isHovered;
                const textY = n.y + r + 11;

                return (
                  <g key={n.id}>
                    {n.type === "article" ? (
                      /* Hollow ring for articles */
                      <circle
                        cx={n.x} cy={n.y} r={r}
                        fill={isHovered ? `${n.color}33` : "transparent"}
                        stroke={isHovered ? "#e3c58f" : n.color}
                        strokeWidth={isHovered ? 2 : 1.5}
                      />
                    ) : (
                      /* Filled for keywords + centre */
                      <circle
                        cx={n.x} cy={n.y} r={r}
                        fill={isHovered ? "#e3c58f" : "#c9a87c"}
                        stroke={isCentre || isHovered ? "rgba(255,235,200,0.4)" : "none"}
                        strokeWidth={2}
                      />
                    )}

                    {showLabel && (
                      <g>
                        <rect
                          x={n.x - label.length * 3.3 - 2}
                          y={textY - 6}
                          width={label.length * 6.6 + 4}
                          height={13}
                          fill="rgba(14,14,13,0.88)"
                        />
                        <text
                          x={n.x} y={textY + 2}
                          textAnchor="middle"
                          fontSize={isCentre ? 10 : 9}
                          fontFamily="monospace"
                          fontWeight={isCentre ? "bold" : "normal"}
                          fill={isCentre ? "#c9a87c" : "#ece8e1"}
                        >
                          {label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Invisible hit targets on top (pointer-events: all) */}
        {canvasW > 0 && (
          <svg
            width={canvasW}
            height={canvasH}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          >
            <g transform={transform} style={{ pointerEvents: "all" }}>
              {nodes.map((n) =>
                n.href ? (
                  <a
                    key={`hit-${n.id}`}
                    href={n.href}
                    data-node
                    style={{ pointerEvents: "all", cursor: "pointer" }}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <circle
                      cx={n.x} cy={n.y}
                      r={n.radius + 10}
                      fill="transparent"
                    />
                  </a>
                ) : (
                  <circle
                    key={`hit-${n.id}`}
                    cx={n.x} cy={n.y}
                    r={n.radius + 10}
                    fill="transparent"
                    style={{ pointerEvents: "all", cursor: "default" }}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={resetView}
                  />
                )
              )}
            </g>
          </svg>
        )}

        {/* Zoom controls */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10" style={{ pointerEvents: "all" }}>
          {[
            { label: "+",   action: zoomIn,   title: "Zoom in"  },
            { label: "fit", action: resetView, title: "Fit all"  },
            { label: "−",   action: zoomOut,  title: "Zoom out" },
          ].map(({ label, action, title }) => (
            <button
              key={label} type="button" onClick={action} aria-label={title}
              className="w-6 h-6 flex items-center justify-center font-mono text-xs text-[var(--gold)] bg-[var(--sunken)]/90 border border-[var(--line)] hover:border-[var(--gold)] leading-none uppercase"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Hint */}
        <div className="absolute bottom-2 left-2 font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider pointer-events-none z-10">
          Scroll · drag · click to open
        </div>

        {articles.length > 40 && (
          <div className="absolute top-2 right-2 font-mono text-[9px] text-[var(--muted)] uppercase z-10 bg-[var(--sunken)]/80 px-1.5 py-0.5 pointer-events-none">
            SHOWING 40 OF {articles.length}
          </div>
        )}
      </div>
    </div>
  );
}
