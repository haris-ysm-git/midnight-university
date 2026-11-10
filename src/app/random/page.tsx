import { RandomMosaic } from "@/components/random/random-mosaic";
import { getAllTagNotes } from "@/lib/content";
import path from "path";
import fs from "fs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สุ่มบทความ — Random Assembly | Midnight University",
  description: "ความคิดที่พบกันโดยบังเอิญในห้องอ่านยามค่ำคืน รวบรวมข้อความและคำสำคัญจากคลังบทความ",
};

function getDitherImages(): string[] {
  const ditherDir = path.join(process.cwd(), "public", "dither");
  if (!fs.existsSync(ditherDir)) return [];
  const files = fs.readdirSync(ditherDir).filter((f) =>
    /\.(png|webp|jpg|jpeg|gif|svg)$/i.test(f)
  );
  return files.map((f) => `/dither/${f}`);
}

export default function RandomPage() {
  const ditherImages = getDitherImages();
  const tagNotes = getAllTagNotes();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <RandomMosaic ditherImages={ditherImages} tagNotes={tagNotes} />
    </main>
  );
}
