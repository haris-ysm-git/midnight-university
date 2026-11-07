import { getGraphDataset } from "@/lib/graph-data";
import { GraphPageClient } from "@/components/graph/graph-page-client";

export const dynamic = "force-static";

export default function GraphPage() {
  const dataset = getGraphDataset();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <GraphPageClient dataset={dataset} />
    </main>
  );
}
