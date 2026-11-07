import { getLOCBySlug, getLOCFiles } from "@/lib/content";
import { notFound } from "next/navigation";
import { VolumeLedgerClient } from "@/components/loc/volume-ledger-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const volumes = getLOCFiles();
  return volumes.map((vol) => ({
    slug: vol.slug,
  }));
}

export default async function LOCVolumePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const volume = getLOCBySlug(decodedSlug);

  if (!volume) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <VolumeLedgerClient volume={volume} />
    </main>
  );
}
