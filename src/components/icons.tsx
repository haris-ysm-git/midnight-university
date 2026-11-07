import React from "react";

export type IconName =
  | "search"
  | "shuffle"
  | "feed"
  | "list"
  | "calendar"
  | "graph"
  | "bookmark"
  | "settings"
  | "arrow"
  | "link"
  | "copy"
  | "chevron"
  | "close"
  | "filter"
  | "moon"
  | "menu"
  | "back"
  | "book";

const iconPaths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  shuffle: (
    <>
      <path d="M3 7h3c4 0 5 10 9 10h3" />
      <path d="m16 14 3 3-3 3M3 17h3c1.8 0 3-2.1 4-4.2M13 7c1-1 1.7-1 5-1" />
      <path d="m16 3 3 3-3 3" />
    </>
  ),
  feed: (
    <>
      <path d="M5 18a1 1 0 1 0 0 .1M5 12a6 6 0 0 1 6 6M5 6a12 12 0 0 1 12 12" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h11M8 12h11M8 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </>
  ),
  graph: (
    <>
      <circle cx="5" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="m7 11 9-4M7 13l9 4" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 19 19 5M10 5h9v9" />
    </>
  ),
  link: (
    <>
      <path d="m9 15 6-6M7 17H5a4 4 0 0 1 0-8h4M15 7h4a4 4 0 0 1 0 8h-4" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1" />
      <path d="M16 8V4H4v12h4" />
    </>
  ),
  chevron: <path d="m8 10 4 4 4-4" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  moon: <path d="M19 15.5A8 8 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  back: <path d="m15 18-6-6 6-6" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`icon ${className}`}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
    >
      {iconPaths[name]}
    </svg>
  );
}
