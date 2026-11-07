"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Icon } from "./icons";

const NAV_ITEMS = [
  { href: "/", label: "Archive", icon: "moon" as const },
  { href: "/random", label: "Random", icon: "shuffle" as const },
  { href: "/feed", label: "Feed", icon: "feed" as const },
  { href: "/loc", label: "Contents", icon: "list" as const },
  { href: "/index-az", label: "Index", icon: "book" as const },
  { href: "/graph", label: "Graph", icon: "graph" as const },
];

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"TH" | "EN">("TH");

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
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

  const toggleLanguage = () => {
    setLang((prev) => (prev === "TH" ? "EN" : "TH"));
  };

  return (
    <>
      <header className="site-header">
        <Link href="/" className="wordmark">
          Midnight University
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="desktop-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
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
            className="language"
            onClick={toggleLanguage}
            title="Toggle display title language"
          >
            {lang === "TH" ? (
              <>TH <span>/ EN</span></>
            ) : (
              <><span>TH /</span> EN</>
            )}
          </button>

          <button
            type="button"
            aria-label="Open navigation menu"
            className="icon-button mobile-menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="drawer-head">
            <div className="meta">NAVIGATE ARCHIVE</div>
            <button
              type="button"
              aria-label="Close menu"
              className="icon-button"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          {NAV_ITEMS.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ color: isActive ? "var(--gold-bright)" : "var(--text)" }}
              >
                <span>0{index + 1}</span>
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSearch();
            }}
          >
            <span>07</span>
            Search
          </button>
        </div>
      )}

      {/* Mobile Bottom Tabs */}
      <nav aria-label="Mobile bottom navigation" className="mobile-tabs">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "active" : ""}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
