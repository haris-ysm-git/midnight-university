"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

interface TOCItem {
  depth: number;
  text: string;
  slug: string;
}

export function ReaderTOC({ items }: { items: TOCItem[] }) {
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    const headingElements = items
      .map((item) => document.getElementById(item.slug))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const scrollToHeading = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpenMobile(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Pill */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="gold-button shadow-xl !rounded-full !px-4 !min-h-[40px] flex items-center gap-2"
        >
          <Icon name="list" size={16} />
          <span>Contents ({items.length})</span>
        </button>
      </div>

      {/* Mobile Dropdown Sheet */}
      {isOpenMobile && (
        <div
          role="dialog"
          aria-label="Table of Contents"
          className="fixed inset-x-0 bottom-0 z-50 bg-[var(--raised)] border-t border-[var(--line-strong)] p-6 max-h-[70vh] overflow-y-auto lg:hidden shadow-2xl"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
            <span className="font-mono text-[10px] tracking-widest text-[var(--gold)] uppercase">
              Table of Contents
            </span>
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsOpenMobile(false)}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <button
                key={`${item.slug}-${idx}`}
                type="button"
                className={`text-left text-sm py-1.5 transition-colors font-serif ${
                  activeSlug === item.slug
                    ? "text-[var(--gold-bright)] font-semibold"
                    : "text-[var(--secondary)] hover:text-[var(--text)]"
                }`}
                style={{ paddingLeft: `${(item.depth - 3) * 16}px` }}
                onClick={() => scrollToHeading(item.slug)}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Floating Rail */}
      <nav aria-label="Table of contents" className="reader-toc hidden xl:block">
        <div className="meta">Contents</div>
        <div className="flex flex-col max-h-[60vh] overflow-y-auto scrollbar-hide">
          {items.map((item, idx) => (
            <button
              key={`${item.slug}-${idx}`}
              type="button"
              className={`transition-colors leading-relaxed ${
                activeSlug === item.slug
                  ? "active text-[var(--gold)] font-medium"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              style={{
                paddingLeft: `${(item.depth - 3) * 12}px`,
                fontSize: item.depth === 3 ? "12px" : "11px",
              }}
              onClick={() => scrollToHeading(item.slug)}
            >
              {item.text}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
