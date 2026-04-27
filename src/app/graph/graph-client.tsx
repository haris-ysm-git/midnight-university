"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { GraphData, GraphNode } from "@/lib/graph-data";
import { useRouter } from "next/navigation";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-white/40 font-mono tracking-widest text-sm">
      INITIALIZING GRAPH ENGINE...
    </div>
  ),
});

export function GraphClient({ initialData }: { initialData: GraphData }) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    if (node.id.startsWith('hub-')) {
      const slug = node.id.replace('hub-', '');
      router.push(`/keyword/${encodeURIComponent(slug)}`);
    } else {
      router.push(`/article/${node.id}`);
    }
  }, [router]);

  return (
    <div className="w-full h-full bg-[#1A1A1A]" ref={containerRef}>
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={initialData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal="val"
        onNodeClick={handleNodeClick}
        linkColor={() => "rgba(255,255,255,0.15)"}
        linkWidth={1}
        backgroundColor="#1A1A1A"
        nodeRelSize={4}
      />
    </div>
  );
}
