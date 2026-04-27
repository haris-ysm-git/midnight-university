import { getGraphData } from "@/lib/graph-data";
import { GraphClient } from "./graph-client";

export default function GraphPage() {
  const data = getGraphData();

  return (
    <main className="w-full h-screen bg-bg overflow-hidden flex flex-col">
      <header className="shrink-0 flex items-center justify-between px-6 md:px-10 py-6 border-b border-white/5 bg-bg/80 backdrop-blur-md z-10 absolute top-0 inset-x-0">
        <div className="font-mono text-[9px] tracking-[0.22em] text-white/45">CRITICAL FUTURES</div>
        <div className="font-mono text-[9px] tracking-[0.18em] text-white/20">KNOWLEDGE GRAPH</div>
        <div className="font-mono text-[9px] tracking-[0.22em] text-accent">NETWORK VIEW</div>
      </header>
      
      <div className="flex-1 relative">
        <GraphClient initialData={data} />
      </div>
    </main>
  );
}
