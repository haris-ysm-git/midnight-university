"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use a transparent navbar if on home or graph page initially, but add bg when scrolled
  const isSpecialPage = pathname === "/" || pathname === "/graph";
  const bgClass = scrolled || !isSpecialPage ? "bg-[#1A1A1A]/90 backdrop-blur-md border-b border-white/5" : "bg-transparent border-transparent";

  const links = [
    { href: "/", label: "ARCHIVE" },
    { href: "/random", label: "RANDOM" },
    { href: "/feed", label: "FEED" },
    { href: "/loc", label: "CONTENTS" },
    { href: "/index-az", label: "A-Z" },
    { href: "/graph", label: "GRAPH" },
  ];

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        
        <Link href="/" className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-white/80 hover:text-white transition-colors">
          MIDNIGHT<br className="md:hidden" /> UNIVERSITY
        </Link>

        <div className="flex items-center gap-6 md:gap-10">
          <div className="hidden md:flex items-center gap-8">
            {links.map(link => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`font-mono text-[10px] tracking-[0.2em] transition-colors ${
                    isActive ? "text-accent" : "text-white/40 hover:text-white/80"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenSearch}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline font-mono text-[10px] tracking-widest mt-0.5">SEARCH</span>
              <kbd className="hidden lg:inline-flex items-center h-5 px-1.5 font-sans text-[10px] font-medium border border-white/10 rounded ml-2 group-hover:border-white/30 transition-colors">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
