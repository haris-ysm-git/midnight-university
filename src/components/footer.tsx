import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <span>Midnight University Archive · กลางวันมืด กลางคืนกลับสว่าง</span>
      </div>
      <div className="flex gap-6">
        <Link href="/loc">LOC Volumes</Link>
        <Link href="/index-az">Directory</Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preservation Source
        </a>
      </div>
    </footer>
  );
}
