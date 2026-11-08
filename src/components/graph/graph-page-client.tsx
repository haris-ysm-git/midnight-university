"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { GraphDataset, GraphNode, GraphLink } from "@/lib/graph-data";
import { Icon } from "@/components/icons";
import { Thai } from "@/components/thai";

// Dynamically import ForceGraph2D with SSR disabled
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center font-mono text-xs text-[var(--gold)] uppercase tracking-widest">
      Initializing Knowledge Graph...
    </div>
  ),
});

interface GraphPageClientProps {
  dataset: GraphDataset;
}

export function GraphPageClient({ dataset }: GraphPageClientProps) {
  const { nodes, links, hubs, categories } = dataset;

  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  // State
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [repelStrength, setRepelStrength] = useState(-140);
  const [linkDistance, setLinkDistance] = useState(45);
  const [localGraphHops, setLocalGraphHops] = useState<number | null>(null); // null = global, 1-3 = local
  const [isListView, setIsListView] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Resize canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(520, Math.min(780, window.innerHeight - 260)),
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Pre-build adjacency map once (id -> Set of neighbor ids)
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      map.set(node.id, new Set());
    }
    for (const link of links) {
      const src = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tgt = typeof link.target === "object" ? (link.target as any).id : link.target;
      if (map.has(src) && map.has(tgt)) {
        map.get(src)!.add(tgt);
        map.get(tgt)!.add(src);
      }
    }
    return map;
  }, [nodes, links]);

  // BFS local graph node IDs
  const localNodeIds = useMemo(() => {
    if (!selectedNode || localGraphHops === null) return null;
    const visited = new Set<string>([selectedNode.id]);
    let currentQueue = [selectedNode.id];

    for (let hop = 0; hop < localGraphHops; hop++) {
      const nextQueue: string[] = [];
      for (const id of currentQueue) {
        const neighbors = adjacencyMap.get(id);
        if (neighbors) {
          for (const n of neighbors) {
            if (!visited.has(n)) {
              visited.add(n);
              nextQueue.push(n);
            }
          }
        }
      }
      currentQueue = nextQueue;
    }
    return visited;
  }, [selectedNode, localGraphHops, adjacencyMap]);

  // Filtered nodes and links based on category, search, and local graph
  const filteredData = useMemo(() => {
    let visibleNodes = nodes;

    if (activeCategory) {
      visibleNodes = visibleNodes.filter((n) => n.category === activeCategory);
    }

    if (localNodeIds) {
      visibleNodes = visibleNodes.filter((n) => localNodeIds.has(n.id));
    }

    const nodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = links.filter((l) => {
      const src = typeof l.source === "object" ? (l.source as any).id : l.source;
      const tgt = typeof l.target === "object" ? (l.target as any).id : l.target;
      return nodeIds.has(src) && nodeIds.has(tgt);
    });

    return { nodes: visibleNodes, links: visibleLinks };
  }, [nodes, links, activeCategory, localNodeIds]);

  // Apply d3 force parameters when sliders change
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge")?.strength(repelStrength);
      fgRef.current.d3Force("link")?.distance(linkDistance);
      fgRef.current.d3ReheatSimulation();
    }
  }, [repelStrength, linkDistance]);

  // Center on search enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !fgRef.current) return;
    const match = filteredData.nodes.find((n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match && typeof (match as any).x === "number") {
      setSelectedNode(match);
      fgRef.current.centerAt((match as any).x, (match as any).y, 800);
      fgRef.current.zoom(2.5, 800);
    }
  };

  // Node drawing
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isHovered = hoverNode && hoverNode.id === node.id;
      const isNeighbor = hoverNode && adjacencyMap.get(hoverNode.id)?.has(node.id);
      const isSelected = selectedNode && selectedNode.id === node.id;
      const matchesSearch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

      const isDimmed =
        (hoverNode && !isHovered && !isNeighbor) ||
        (searchQuery && !matchesSearch);

      const radius = Math.max(3.5, Math.min(18, Math.sqrt(node.degree + 1) * 3));

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

      if (isDimmed) {
        ctx.fillStyle = "rgba(100, 100, 100, 0.15)";
      } else if (isSelected || isHovered) {
        ctx.fillStyle = "var(--gold-bright, #E3C58F)";
      } else {
        ctx.fillStyle = node.color || "#C9A87C";
      }
      ctx.fill();

      // Outer accent ring if hovered or selected
      if (isSelected || isHovered || matchesSearch) {
        ctx.lineWidth = 2 / globalScale;
        ctx.strokeStyle = isSelected ? "var(--gold, #C9A87C)" : "rgba(227, 197, 143, 0.8)";
        ctx.stroke();
      }

      // Draw label when zoomed in or important
      const shouldShowLabel =
        !isDimmed &&
        (globalScale > 1.2 || isHovered || isSelected || matchesSearch || node.degree >= 5);

      if (shouldShowLabel) {
        const fontSize = Math.max(10, 12 / globalScale);
        ctx.font = `${fontSize}px 'IBM Plex Sans Thai', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const labelText = node.name.length > 20 ? node.name.slice(0, 18) + "…" : node.name;
        const textY = node.y + radius + fontSize / 1.5;

        // Label background badge
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = "rgba(21, 21, 20, 0.85)";
        ctx.fillRect(
          node.x - textWidth / 2 - 3 / globalScale,
          textY - fontSize / 2 - 1 / globalScale,
          textWidth + 6 / globalScale,
          fontSize + 2 / globalScale
        );

        ctx.fillStyle = isSelected ? "var(--gold, #C9A87C)" : "#ECE8E1";
        ctx.fillText(labelText, node.x, textY);
      }
    },
    [hoverNode, selectedNode, searchQuery, adjacencyMap]
  );

  return (
    <div className="graph-page standard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="title-row flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--line)] pb-6 mb-6 gap-4">
        <div className="page-title">
          <div className="meta font-mono text-xs text-[var(--gold)] uppercase tracking-widest mb-2">
            Obsidian-style Network · {filteredData.nodes.length} nodes · {filteredData.links.length} links
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[var(--text)] tracking-tight">
            Knowledge Graph
          </h1>
          <p className="font-thai text-sm sm:text-base text-[var(--secondary)] mt-1">
            <Thai>เครือข่ายความสัมพันธ์ระหว่างแนวคิด บุคคล สถานที่ และบทความในคลัง</Thai>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="outline-button flex items-center gap-1.5 border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--gold)] hover:border-[var(--gold)] uppercase tracking-wider"
          >
            <Icon name="settings" size={13} /> Physics
          </button>
          <button
            type="button"
            onClick={() => setIsListView(!isListView)}
            className="outline-button flex items-center gap-1.5 border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--gold)] hover:border-[var(--gold)] uppercase tracking-wider"
          >
            <Icon name={isListView ? "graph" : "list"} size={13} />
            {isListView ? "Graph view" : "List view"}
          </button>
        </div>
      </div>

      {/* ══ CONTROLS BAR ════════════════════════════════════════════════════ */}
      <div className="graph-controls flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4 mb-6">
        {/* Category Filters */}
        <div className="category-filters flex flex-wrap gap-1.5">
          <button
            type="button"
            className={`px-2.5 py-1 font-mono text-xs uppercase tracking-wider border rounded-xs transition-colors ${
              activeCategory === null
                ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)] font-medium"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)]"
            }`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`px-2.5 py-1 font-mono text-xs uppercase tracking-wider border rounded-xs transition-colors flex items-center gap-1 ${
                activeCategory === c.name
                  ? "bg-[var(--gold)] text-[var(--bg)] border-[var(--gold)] font-medium"
                  : "border-[var(--line)] text-[var(--secondary)] hover:border-[var(--gold)]"
              }`}
              onClick={() => setActiveCategory(activeCategory === c.name ? null : c.name)}
            >
              <span style={{ color: activeCategory === c.name ? "var(--bg)" : c.color }}>{c.glyph}</span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Live Search */}
        <form onSubmit={handleSearchSubmit} className="graph-search flex items-center gap-2 border border-[var(--line)] px-3 py-1 bg-[var(--sunken)]">
          <Icon name="search" size={13} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search nodes (Enter to zoom)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none w-48 sm:w-60"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">
              ✕
            </button>
          )}
        </form>
      </div>

      {/* ══ COLLAPSIBLE PHYSICS & LOCAL GRAPH PANEL ═════════════════════════ */}
      {showSettings && (
        <div className="physics-panel bg-[var(--raised)] border border-[var(--line)] p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6 rounded-xs">
          <div>
            <label className="block font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2 flex justify-between">
              <span>Repel Strength</span>
              <b className="text-[var(--gold)]">{repelStrength}</b>
            </label>
            <input
              type="range"
              min="-350"
              max="-30"
              value={repelStrength}
              onChange={(e) => setRepelStrength(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--gold)]"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2 flex justify-between">
              <span>Link Distance</span>
              <b className="text-[var(--gold)]">{linkDistance}px</b>
            </label>
            <input
              type="range"
              min="20"
              max="120"
              value={linkDistance}
              onChange={(e) => setLinkDistance(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--gold)]"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2 flex justify-between">
              <span>Local Graph Hops</span>
              <b className="text-[var(--gold)]">{localGraphHops === null ? "Global" : `${localGraphHops} Hops`}</b>
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                className={`flex-1 py-1 font-mono text-[10px] border ${
                  localGraphHops === null ? "bg-[var(--gold)] text-[var(--bg)] font-bold" : "border-[var(--line)] text-[var(--muted)]"
                }`}
                onClick={() => setLocalGraphHops(null)}
              >
                Off
              </button>
              {[1, 2, 3].map((hop) => (
                <button
                  key={hop}
                  type="button"
                  className={`flex-1 py-1 font-mono text-[10px] border ${
                    localGraphHops === hop ? "bg-[var(--gold)] text-[var(--bg)] font-bold" : "border-[var(--line)] text-[var(--muted)]"
                  }`}
                  onClick={() => setLocalGraphHops(hop)}
                >
                  {hop}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ GRAPH CANVAS CONTAINER ══════════════════════════════════════════ */}
      {isListView ? (
        /* Accessible List View */
        <div className="graph-list divide-y divide-[var(--line)] border-t border-[var(--line)]">
          {hubs.map((h) => (
            <div key={h.id} className="py-4 hover:bg-[var(--raised)]/40 px-2 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ color: h.color }}>{h.glyph}</span>
                  <strong className="font-serif text-lg text-[var(--text)] font-medium">{h.name}</strong>
                  <span className="font-mono text-xs text-[var(--muted)]">({h.count} articles)</span>
                </div>
                <Link
                  href={`/keyword/${encodeURIComponent(h.name)}`}
                  className="font-mono text-xs uppercase text-[var(--gold)] hover:underline"
                >
                  Open Hub →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="network relative border border-[var(--line)] bg-[var(--sunken)] rounded-xs overflow-hidden"
          style={{ height: `${dimensions.height}px` }}
        >
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={filteredData}
            backgroundColor="var(--sunken, #151514)"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              const radius = Math.max(3.5, Math.min(18, Math.sqrt(node.degree + 1) * 3));
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            linkColor={(link: any) => {
              const srcId = typeof link.source === "object" ? link.source.id : link.source;
              const tgtId = typeof link.target === "object" ? link.target.id : link.target;
              if (hoverNode && (srcId === hoverNode.id || tgtId === hoverNode.id)) {
                return "rgba(227, 197, 143, 0.75)";
              }
              return "rgba(255, 255, 255, 0.08)";
            }}
            linkWidth={(link: any) => {
              const srcId = typeof link.source === "object" ? link.source.id : link.source;
              const tgtId = typeof link.target === "object" ? link.target.id : link.target;
              if (hoverNode && (srcId === hoverNode.id || tgtId === hoverNode.id)) {
                return 1.8;
              }
              return 0.8;
            }}
            onNodeHover={(node: any) => setHoverNode(node || null)}
            onNodeClick={(node: any) => {
              setSelectedNode(node);
              if (fgRef.current) {
                fgRef.current.centerAt(node.x, node.y, 800);
                fgRef.current.zoom(2.2, 800);
              }
            }}
            cooldownTicks={120}
          />

          {/* Selected Node Inspector Drawer */}
          {selectedNode && (
            <aside className="selected-inspector absolute top-4 right-4 z-30 bg-[var(--raised)]/95 border border-[var(--line-strong)] p-4 rounded-xs shadow-xl max-w-sm backdrop-blur-sm animate-in fade-in">
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--gold)]">
                    {selectedNode.type === "article" ? "Article Node" : "Keyword Hub"} · {selectedNode.category}
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[var(--text)] mt-0.5 leading-snug">
                    <Thai>{selectedNode.name}</Thai>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-[var(--muted)] hover:text-[var(--text)] text-sm"
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <div className="font-mono text-xs text-[var(--muted)] mb-3">
                {selectedNode.degree} connected relations
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex justify-between items-center">
                {selectedNode.type === "article" ? (
                  <Link
                    href={`/article/${selectedNode.articleId}`}
                    className="font-mono text-xs uppercase text-[var(--gold)] hover:underline flex items-center gap-1 font-medium"
                  >
                    Read Article <Icon name="arrow" size={12} />
                  </Link>
                ) : (
                  <Link
                    href={`/keyword/${encodeURIComponent(selectedNode.id)}`}
                    className="font-mono text-xs uppercase text-[var(--gold)] hover:underline flex items-center gap-1 font-medium"
                  >
                    Open Keyword Hub <Icon name="arrow" size={12} />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setLocalGraphHops(localGraphHops ? null : 1)}
                  className={`font-mono text-[10px] px-2 py-0.5 border ${
                    localGraphHops ? "bg-[var(--gold)] text-[var(--bg)]" : "border-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  {localGraphHops ? "Local ON" : "Focus Local"}
                </button>
              </div>
            </aside>
          )}

          {/* Navigation Hint */}
          <div className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] bg-[var(--sunken)]/80 px-2.5 py-1 border border-[var(--line)] pointer-events-none">
            Drag to pan · Scroll to zoom · Click node to inspect · Hover highlights neighbors
          </div>
        </div>
      )}

      {/* ══ CATEGORY LEGEND ═════════════════════════════════════════════════ */}
      <div className="graph-legend flex flex-wrap gap-6 border-t border-[var(--line)] pt-4 mt-6">
        {categories.map((c) => (
          <span key={c.name} className="flex items-center gap-1.5 font-mono text-xs" style={{ color: c.color }}>
            <span>{c.glyph}</span>
            <i className="not-italic text-[var(--secondary)]">{c.name}</i>
          </span>
        ))}
      </div>
    </div>
  );
}
