"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "./icons";

interface DropdownItem {
  href: string;
  label: string;
  desc: string;
}

const MORE_ITEMS: DropdownItem[] = [
  {
    href: "/feed",
    label: "FEED",
    desc: "ลำดับเวลาของบทความที่เก็บรักษาไว้",
  },
  {
    href: "/loc",
    label: "CONTENTS",
    desc: "สารบัญทั้งหมด รวมบทความที่ยังไม่ได้เก็บ",
  },
  {
    href: "/index-az",
    label: "INDEX",
    desc: "ดัชนีคำสำคัญ",
  },
  {
    href: "/graph",
    label: "GRAPH",
    desc: "แผนภาพความเชื่อมโยงระหว่างบทความและคำสำคัญ",
  },
];

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
    setFocusedIndex(-1);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Click outside to close MORE dropdown
  useEffect(() => {
    if (!moreOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setMoreOpen(false);
        setFocusedIndex(-1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setFocusedIndex(-1);
        moreButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreOpen]);

  // Mouse hover with 120ms delay
  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setMoreOpen(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setMoreOpen(false);
      setFocusedIndex(-1);
    }, 120);
  };

  // Keyboard navigation for dropdown
  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMoreOpen(true);
      setFocusedIndex(0);
      setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 50);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMoreOpen(true);
      const lastIdx = MORE_ITEMS.length - 1;
      setFocusedIndex(lastIdx);
      setTimeout(() => {
        itemRefs.current[lastIdx]?.focus();
      }, 50);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (focusedIndex + 1) % MORE_ITEMS.length;
      setFocusedIndex(next);
      itemRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (focusedIndex - 1 + MORE_ITEMS.length) % MORE_ITEMS.length;
      setFocusedIndex(prev);
      itemRefs.current[prev]?.focus();
    } else if (e.key === "Tab") {
      setMoreOpen(false);
      setFocusedIndex(-1);
    }
  };

  const isArchiveActive = pathname === "/";
  const isAboutActive = pathname === "/about" || pathname.startsWith("/about/");
  const isRandomActive = pathname === "/random" || pathname.startsWith("/random/");
  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      <header className="site-header">
        <Link href="/" className="wordmark">
          Midnight University
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="desktop-nav">
          <Link
            href="/"
            className={isArchiveActive ? "active" : ""}
          >
            Archive
          </Link>

          <Link
            href="/about"
            className={isAboutActive ? "active" : ""}
          >
            About
          </Link>

          <Link
            href="/random"
            className={isRandomActive ? "active" : ""}
          >
            Random
          </Link>

          {/* MORE Dropdown Button */}
          <div
            className="relative inline-flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              ref={moreButtonRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => {
                setMoreOpen((prev) => !prev);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleButtonKeyDown}
              className={`flex items-center gap-1 cursor-pointer ${
                isMoreActive ? "active" : ""
              }`}
            >
              <span>More</span>
              <Icon
                name="chevron"
                size={14}
                className={`transition-transform duration-150 ${
                  moreOpen ? "rotate-180 text-[var(--gold-bright)]" : ""
                }`}
              />
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  ref={menuRef}
                  role="menu"
                  aria-orientation="vertical"
                  onKeyDown={handleMenuKeyDown}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full right-0 mt-1 min-w-[280px] p-2 bg-[var(--raised)] border border-[var(--line)] shadow-xl z-50 flex flex-col gap-1"
                >
                  {MORE_ITEMS.map((item, idx) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        ref={(el) => {
                          itemRefs.current[idx] = el;
                        }}
                        href={item.href}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          setMoreOpen(false);
                          setFocusedIndex(-1);
                        }}
                        className={`group px-3 py-2.5 rounded-none transition-colors flex flex-col gap-0.5 text-left no-underline ${
                          isActive
                            ? "bg-[rgba(201,168,124,0.12)] border-l-2 border-[var(--gold)]"
                            : "hover:bg-[rgba(255,255,255,0.04)] focus:bg-[rgba(255,255,255,0.04)] focus:outline-none"
                        }`}
                      >
                        <div
                          className={`font-mono text-[11px] tracking-wider uppercase font-medium ${
                            isActive
                              ? "text-[var(--gold-bright)]"
                              : "text-[var(--text)] group-hover:text-[var(--gold)]"
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-[12px] text-[var(--muted)] leading-snug font-sans">
                          {item.desc}
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          <button
            type="button"
            aria-label="Search archive"
            className="icon-button search-button"
            onClick={onOpenSearch}
          >
            <Icon name="search" size={16} />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>

          <button
            type="button"
            aria-label="Open navigation menu"
            className="icon-button mobile-menu flex items-center gap-1.5"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">Menu</span>
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      {mobileMenuOpen && (
        <div className="mobile-drawer overflow-y-auto">
          <div className="drawer-head flex items-center justify-between pb-4 border-b border-[var(--line)]">
            <div className="meta font-mono text-xs text-[var(--gold)] tracking-widest uppercase">
              NAVIGATE ARCHIVE
            </div>
            <button
              type="button"
              aria-label="Close menu"
              className="icon-button min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          <div className="flex flex-col py-4">
            {/* Primary Links */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center justify-between py-3 border-b border-[var(--line)] text-lg font-serif"
              style={{ color: isArchiveActive ? "var(--gold-bright)" : "var(--text)" }}
            >
              <span>ARCHIVE</span>
              <span className="font-mono text-xs text-[var(--muted)]">/</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center justify-between py-3 border-b border-[var(--line)] text-lg font-serif"
              style={{ color: isAboutActive ? "var(--gold-bright)" : "var(--text)" }}
            >
              <span>ABOUT</span>
              <span className="font-mono text-xs text-[var(--muted)]">/about</span>
            </Link>

            <Link
              href="/random"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center justify-between py-3 border-b border-[var(--line)] text-lg font-serif"
              style={{ color: isRandomActive ? "var(--gold-bright)" : "var(--text)" }}
            >
              <span>RANDOM</span>
              <span className="font-mono text-xs text-[var(--muted)]">/random</span>
            </Link>

            {/* MORE Section */}
            <div className="pt-6 pb-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--gold)] mb-3">
                MORE
              </div>

              <div className="flex flex-col gap-1">
                {MORE_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`min-h-[48px] flex flex-col justify-center py-2 px-3 border border-[var(--line)] mb-2 ${
                        isActive
                          ? "bg-[rgba(201,168,124,0.12)] border-[var(--gold)]"
                          : "bg-[var(--raised)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-xs tracking-wider uppercase font-semibold ${
                            isActive ? "text-[var(--gold-bright)]" : "text-[var(--text)]"
                          }`}
                        >
                          {item.label}
                        </span>
                        <Icon name="arrow" size={14} className="text-[var(--muted)]" />
                      </div>
                      <span className="text-[12px] text-[var(--muted)] leading-tight mt-0.5 font-sans">
                        {item.desc}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Search Trigger */}
            <button
              type="button"
              className="min-h-[48px] flex items-center justify-between py-3 mt-4 border-t border-[var(--line)] font-mono text-xs uppercase tracking-wider text-[var(--gold)]"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch();
              }}
            >
              <span>SEARCH ARCHIVE</span>
              <Icon name="search" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tabs */}
      <nav aria-label="Mobile bottom navigation" className="mobile-tabs grid grid-cols-4">
        <Link
          href="/"
          className={isArchiveActive ? "active" : ""}
        >
          <Icon name="moon" size={18} />
          <span>Archive</span>
        </Link>
        <Link
          href="/about"
          className={isAboutActive ? "active" : ""}
        >
          <Icon name="book" size={18} />
          <span>About</span>
        </Link>
        <Link
          href="/random"
          className={isRandomActive ? "active" : ""}
        >
          <Icon name="shuffle" size={18} />
          <span>Random</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={isMoreActive ? "active" : ""}
        >
          <Icon name="menu" size={18} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
