import { useEffect, useMemo, useState, type ReactNode } from "react"

type View = "archive" | "random" | "feed" | "contents" | "index" | "graph" | "keyword" | "reader" | "guide"

type IconName = "search" | "shuffle" | "feed" | "list" | "calendar" | "graph" | "bookmark" | "settings" | "arrow" | "link" | "copy" | "chevron" | "close" | "filter" | "moon" | "menu" | "back"

type Article = {
  id: string
  date: string
  titleTh: string
  titleEn: string
  author: string
  tags: string[]
  minutes: number
  excerpt: string
  year: number
}

const articles: Article[] = [
  {
    id: "1193",
    date: "20 มี.ค. 2007",
    titleTh: "การพัฒนาปอเนาะชายแดนใต้ ท่ามกลางกระแสการก่อการร้ายภาคใต้",
    titleEn: "Development of Pondok Schools in the Deep South",
    author: "ศรีศักร วัลลิโภดม",
    tags: ["Deep South", "Islam", "Education"],
    minutes: 14,
    excerpt:
      "ความรู้จากชายแดนมิใช่เพียงเรื่องราวริมขอบ หากเป็นจุดตั้งต้นของการทำความเข้าใจรัฐ ชุมชน และความทรงจำที่ซ้อนทับกัน",
    year: 2007,
  },
  {
    id: "0308",
    date: "28 ส.ค. 2003",
    titleTh: "บทสัมภาษณ์ Noam Chomsky — สิงหาคม 2003",
    titleEn: "Noam Chomsky Interview — August 2003",
    author: "กองบรรณาธิการ",
    tags: ["Politics", "Human Rights", "Noam Chomsky"],
    minutes: 12,
    excerpt:
      "สำหรับปัญญาชน ตลอดประวัติศาสตร์ที่ผ่านมา มันแทบจะกลายเป็นภารกิจไปแล้วที่จะต้องยืนอยู่ข้างเสรีภาพและตั้งคำถามต่ออำนาจ",
    year: 2003,
  },
  {
    id: "0061",
    date: "12 พ.ค. 2001",
    titleTh: "การศึกษาเพื่อสันติภาพ",
    titleEn: "Education for Peace",
    author: "ไพศาล มูลศาสตรสาทร",
    tags: ["Philosophy", "Politics", "Education"],
    minutes: 9,
    excerpt:
      "การศึกษาไม่อาจแยกออกจากความหวัง ความขัดแย้ง และวิธีที่ผู้คนจินตนาการถึงการอยู่ร่วมกันอย่างเป็นธรรม",
    year: 2001,
  },
  {
    id: "0109",
    date: "04 พ.ย. 2001",
    titleTh: "กระแสชาตินิยม: บทความถอดเทปมหาวิทยาลัยเที่ยงคืน",
    titleEn: "Nationalism: A Midnight University Lecture",
    author: "นิธิ เอียวศรีวงศ์",
    tags: ["Nationalism", "History", "Politics"],
    minutes: 18,
    excerpt:
      "ชาติคือสิ่งที่ถูกสร้างซ้ำผ่านภาษา พิธีกรรม แผนที่ และความทรงจำร่วม ไม่ใช่สิ่งที่ดำรงอยู่โดยปราศจากประวัติศาสตร์",
    year: 2001,
  },
  {
    id: "0110",
    date: "18 พ.ย. 2001",
    titleTh: "กระแสชาตินิยม: ช่วงสนทนาในชั้นเรียน",
    titleEn: "Nationalism: Classroom Discussion",
    author: "มหาวิทยาลัยเที่ยงคืน",
    tags: ["Nationalism", "Anthropology"],
    minutes: 11,
    excerpt:
      "คำถามสำคัญไม่ใช่เพียงว่าใครเป็นคนในชาติ แต่คือใครถูกทำให้ยืนอยู่นอกขอบเขตของเรื่องเล่านั้น",
    year: 2001,
  },
  {
    id: "1427",
    date: "09 ต.ค. 2008",
    titleTh: "พื้นที่ศักดิ์สิทธิ์กับความทรงจำของเมือง",
    titleEn: "Sacred Space and the Memory of the City",
    author: "ชาตรี ประกิตนนทการ",
    tags: ["Anthropology", "History", "Sacred Space"],
    minutes: 16,
    excerpt:
      "สถาปัตยกรรมเก็บร่องรอยของอำนาจไว้ในระยะทาง แสงเงา และวิธีที่ร่างกายถูกเชื้อเชิญให้เคลื่อนผ่านสถานที่",
    year: 2008,
  },
]

const categories = [
  ["Deep South", "#d7a46d", "●"],
  ["History", "#a9b77c", "■"],
  ["Philosophy", "#c29bc8", "◆"],
  ["Islam", "#71b7ae", "▲"],
  ["Nationalism", "#d37d70", "⬟"],
  ["Politics", "#8b9dcf", "✦"],
  ["Anthropology", "#d3bd73", "⬢"],
  ["Other", "#9a958e", "○"],
]

const navItems: { id: View label: string }[] = [
  { id: "archive", label: "Archive" },
  { id: "random", label: "Random" },
  { id: "feed", label: "Feed" },
  { id: "contents", label: "Contents" },
  { id: "index", label: "Index" },
  { id: "graph", label: "Graph" },
]

const iconPaths: Record<IconName, ReactNode> = {
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
}

function Icon({ name, size = 20 }: { name: IconName size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {iconPaths[name]}
    </svg>
  )
}

function Thai({
  children,
  className = "",
}: {
  children: string
  className?: string
}) {
  const parts = useMemo(() => {
    if (typeof Intl === "undefined" || !("Segmenter" in Intl)) return [children]
    return Array.from(
      new Intl.Segmenter("th", { granularity: "word" }).segment(children),
      (x) => x.segment,
    )
  }, [children])
  return (
    <span className={className} lang="th">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>
          {part}
          <wbr />
        </span>
      ))}
    </span>
  )
}

function Meta({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`meta ${className}`}>{children}</div>
}

function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button className={`chip ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  )
}

function Header({
  view,
  setView,
  openSearch,
}: {
  view: View
  setView: (view: View) => void
  openSearch: () => void
}) {
  const [menu, setMenu] = useState(false)
  return (
    <>
      <header className="site-header">
        <button className="wordmark" onClick={() => setView("archive")}>
          Midnight University
        </button>
        <nav aria-label="Main navigation" className="desktop-nav">
          {navItems.map((item) => (
            <button
              className={view === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            aria-label="Search"
            className="icon-button search-button"
            onClick={openSearch}
          >
            <Icon name="search" />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
          <button className="language">
            TH <span>/ EN</span>
          </button>
          <button
            aria-label="Open menu"
            className="icon-button mobile-menu"
            onClick={() => setMenu(true)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>
      {menu && (
        <div className="mobile-drawer">
          <div className="drawer-head">
            <Meta>Navigate archive</Meta>
            <button
              aria-label="Close"
              className="icon-button"
              onClick={() => setMenu(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          {navItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id)
                setMenu(false)
              }}
            >
              <span>0{i + 1}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              openSearch()
              setMenu(false)
            }}
          >
            <span>07</span>Search
          </button>
        </div>
      )}
      <nav aria-label="Mobile navigation" className="mobile-tabs">
        {navItems.slice(0, 5).map((item) => (
          <button
            className={view === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setView(item.id)}
          >
            <Icon
              name={
                item.id === "archive"
                  ? "moon"
                  : item.id === "random"
                    ? "shuffle"
                    : item.id === "feed"
                      ? "feed"
                      : "list"
              }
              size={18}
            />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

function SearchOverlay({
  close,
  openView,
}: {
  close: () => void
  openView: (view: View) => void
}) {
  const [query, setQuery] = useState("")
  const results = articles.filter((a) =>
    `${a.titleTh} ${a.titleEn} ${a.tags.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [close])
  return (
    <div aria-modal="true" className="search-overlay" role="dialog">
      <button
        aria-label="Close search"
        className="search-scrim"
        onClick={close}
      />
      <section className="search-panel">
        <div className="search-input">
          <Icon name="search" />
          <input
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาในคลัง / Search the archive"
            value={query}
          />
          <kbd>ESC</kbd>
        </div>
        {!query ? (
          <div className="search-empty">
            <Meta>Recent searches</Meta>
            <div className="recent">
              <button onClick={() => setQuery("ชายแดนใต้")}>ชายแดนใต้</button>
              <button onClick={() => setQuery("Nationalism")}>
                Nationalism
              </button>
              <button onClick={() => setQuery("สิทธิมนุษยชน")}>สิทธิมนุษยชน</button>
            </div>
            <p>ค้นได้ทั้งชื่อเรื่อง ผู้เขียน บุคคล และคำสำคัญ</p>
          </div>
        ) : results.length ? (
          <div className="search-results">
            <Meta>Articles · {results.length}</Meta>
            {results.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  openView("reader")
                  close()
                }}
              >
                <span className="result-id">{a.id}</span>
                <span>
                  <strong>
                    <Thai>{a.titleTh}</Thai>
                  </strong>
                  <em>{a.titleEn}</em>
                </span>
                <Icon name="arrow" />
              </button>
            ))}
            <Meta>Keywords & people</Meta>
            <button
              onClick={() => {
                openView("keyword")
                close()
              }}
            >
              <span className="result-id">◇</span>
              <span>
                <strong>{query}</strong>
                <em>Keyword archive</em>
              </span>
              <Icon name="arrow" />
            </button>
          </div>
        ) : (
          <div className="no-results">
            <span>○</span>
            <h3>ไม่พบข้อความที่ตรงกัน</h3>
            <p>ลองคำที่กว้างขึ้น ตรวจการสะกด หรือค้นหาด้วยชื่อผู้เขียน</p>
          </div>
        )}
      </section>
    </div>
  )
}

function PageTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div className="page-title">
      <Meta>{eyebrow}</Meta>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}

function Archive({
  openReader,
  openKeyword,
}: {
  openReader: () => void
  openKeyword: () => void
}) {
  const [focus, setFocus] = useState(1)
  const article = articles[focus]
  const shift = (delta: number) =>
    setFocus((focus + delta + articles.length) % articles.length)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") shift(1)
      if (e.key === "ArrowUp") shift(-1)
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  })
  return (
    <main className="archive-page">
      <section className="hero">
        <Meta>Digital memorial archive · Est. 1997</Meta>
        <h1>
          Midnight
          <br />
          University
        </h1>
        <h2>
          <Thai>กลางวันมืด กลางคืนกลับสว่าง</Thai>
        </h2>
        <div className="gold-rule" />
        <p>
          <Thai>
            พื้นที่เก็บรักษาความคิด บทสนทนา และความทรงจำทางสังคมของไทย
            เพื่อให้ความรู้ยังคงส่องสว่างในคืนที่มืดที่สุด
          </Thai>
        </p>
        <div className="hero-scroll">
          <span /> Scroll to enter the archive
        </div>
      </section>
      <section className="loop-browser">
        <div className="browser-top">
          <Meta>Critical futures</Meta>
          <Meta>Article archive</Meta>
          <Meta>
            {String(focus + 1).padStart(3, "0")} /{" "}
            {String(articles.length).padStart(3, "0")}
          </Meta>
        </div>
        <aside className="topic-rail">
          <Meta>Topics</Meta>
          {categories.slice(0, 5).map((c, i) => (
            <button key={c[0]} onClick={openKeyword}>
              {c[0]}
              <span>{14 - i * 2} articles</span>
            </button>
          ))}
        </aside>
        <div className="article-loop">
          {[-1, 0, 1].map((offset) => {
            const a =
              articles[(focus + offset + articles.length) % articles.length]
            return (
              <article
                className={`loop-item ${offset === 0 ? "focused" : ""}`}
                key={`${a.id}-${offset}`}
                onClick={offset === 0 ? openReader : () => shift(offset)}
              >
                <Meta>
                  {a.id} · {a.date}
                </Meta>
                <h2>
                  <Thai>{a.titleTh}</Thai>
                </h2>
                <h3>{a.titleEn}</h3>
                {offset === 0 && (
                  <p>
                    <Thai>{a.excerpt}</Thai>
                  </p>
                )}
              </article>
            )
          })}
        </div>
        <aside className="detail-rail">
          <Meta>
            {article.minutes} min read · {article.author}
          </Meta>
          <div className="tag-list">
            {article.tags.map((tag) => (
              <button key={tag} onClick={openKeyword}>
                {tag}
              </button>
            ))}
          </div>
          <button className="text-link" onClick={openReader}>
            Read article <Icon name="arrow" />
          </button>
        </aside>
        <div className="loop-controls">
          <button aria-label="Previous article" onClick={() => shift(-1)}>
            ↑
          </button>
          <button aria-label="Next article" onClick={() => shift(1)}>
            ↓
          </button>
          <Meta>Use arrow keys · Swipe on mobile</Meta>
        </div>
      </section>
    </main>
  )
}

const Glyph = ({ children }: { children: ReactNode }) => (
  <div className="stamp" aria-hidden="true">
    {children}
  </div>
)

function Dither({ variant }: { variant: number }) {
  return (
    <div className={`dither dither-${variant}`}>
      <span>Dither {variant < 3 ? "1×1" : "2×1"}</span>
    </div>
  )
}

function RandomPage({
  openReader,
  openKeyword,
}: {
  openReader: () => void
  openKeyword: () => void
}) {
  const [edition, setEdition] = useState(1)
  const excerpts =
    edition % 2
      ? [articles[1], articles[5], articles[0]]
      : [articles[3], articles[2], articles[4]]
  return (
    <main className="random-page">
      <PageTitle
        eyebrow={`Edition 0${edition} · fragments recomposed`}
        title="Random Assembly"
        subtitle="ความคิดที่พบกันโดยบังเอิญในห้องอ่านยามค่ำคืน"
      />
      <div className="mosaic">
        <button className="tile excerpt wide" onClick={openReader}>
          <Meta>{excerpts[0].id}</Meta>
          <blockquote>
            <Thai>{excerpts[0].excerpt}</Thai>
          </blockquote>
          <span>{excerpts[0].titleEn}</span>
          <i className="corner" />
        </button>
        <button aria-label="Candle glyph" className="tile glyph">
          <Glyph>
            ♜<i />
          </Glyph>
        </button>
        <button className="tile keyword" onClick={openKeyword}>
          Sacred
          <br />
          Space
        </button>
        <button aria-label="Dither image" className="tile">
          <Dither variant={1} />
        </button>
        <button className="tile keyword" onClick={openKeyword}>
          Paul
          <br />
          Ricoeur
        </button>
        <button className="tile excerpt tall" onClick={openReader}>
          <Meta>{excerpts[1].id}</Meta>
          <blockquote>
            <Thai>{excerpts[1].excerpt}</Thai>
          </blockquote>
          <span>{excerpts[1].titleEn}</span>
          <i className="corner" />
        </button>
        <button aria-label="Moon glyph" className="tile glyph">
          <Glyph>☾</Glyph>
        </button>
        <button aria-label="Dither image" className="tile wide">
          <Dither variant={3} />
        </button>
        <div className="tile blank">
          <i className="corner" />
        </div>
        <button className="tile keyword" onClick={openKeyword}>
          Memory
        </button>
        <button aria-label="Scales glyph" className="tile glyph">
          <Glyph>⚖</Glyph>
        </button>
        <button className="tile excerpt wide" onClick={openReader}>
          <Meta>{excerpts[2].id}</Meta>
          <blockquote>
            <Thai>{excerpts[2].excerpt}</Thai>
          </blockquote>
          <span>{excerpts[2].titleEn}</span>
          <i className="corner" />
        </button>
        <button aria-label="Dither image" className="tile">
          <Dither variant={2} />
        </button>
        <button className="tile keyword" onClick={openKeyword}>
          Patani
        </button>
        <button aria-label="Book glyph" className="tile glyph">
          <Glyph>▱</Glyph>
        </button>
      </div>
      <footer className="edition-footer">
        <Meta>End of edition · Reload for new fragments</Meta>
        <button
          className="outline-button"
          onClick={() => setEdition((x) => x + 1)}
        >
          <Icon name="shuffle" /> Reshuffle
        </button>
      </footer>
    </main>
  )
}

function DensityStrip() {
  const years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008]
  return (
    <div className="density">
      <div className="density-label">
        <Meta>Year → month density</Meta>
        <span>
          Fewer <i />
          <i />
          <i />
          <i /> More
        </span>
      </div>
      <div className="density-grid">
        {years.map((year, yi) => (
          <div className="density-year" key={year}>
            <span>{year}</span>
            {Array.from({ length: 12 }, (_, mi) => (
              <button
                aria-label={`${year}, month ${mi + 1}`}
                className={`heat heat-${(yi * 3 + mi * 2) % 5}`}
                key={mi}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function FeedPage({ openReader }: { openReader: () => void }) {
  const [mode, setMode] = useState<"list" | "calendar" | "timeline">("list")
  const [expanded, setExpanded] = useState("1193")
  const years = [2008, 2007, 2003, 2001]
  return (
    <main className="standard-page">
      <div className="title-row">
        <PageTitle
          eyebrow="Chronological archive"
          title="Feed"
          subtitle="ร่องรอยของบทความ เรียงตามเวลาที่ถูกบันทึก"
        />
        <div className="segmented" aria-label="Feed view">
          {(["list", "calendar", "timeline"] as const).map((item) => (
            <button
              className={mode === item ? "active" : ""}
              key={item}
              onClick={() => setMode(item)}
            >
              <Icon
                name={
                  item === "list"
                    ? "list"
                    : item === "calendar"
                      ? "calendar"
                      : "feed"
                }
              />
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mobile-year-scrub">
        {years.map((year) => (
          <button key={year}>{year}</button>
        ))}
      </div>
      <DensityStrip />
      {mode === "list" && (
        <div className="feed-list">
          {years.map((year) => (
            <section className="year-group" key={year}>
              <div className="year-heading">
                <h2>{year}</h2>
                <Meta>
                  {articles.filter((a) => a.year === year).length || 8} entries
                </Meta>
              </div>
              {articles
                .filter((a) => a.year === year)
                .map((a) => (
                  <article
                    className={`feed-row ${
                      expanded === a.id ? "expanded" : ""
                    }`}
                    key={a.id}
                  >
                    <button
                      className="feed-summary"
                      onClick={() => setExpanded(expanded === a.id ? "" : a.id)}
                    >
                      <time>{a.date.replace(` ${year}`, "")}</time>
                      <Meta>{a.id}</Meta>
                      <h3>
                        <Thai>{a.titleTh}</Thai>
                      </h3>
                      <span className="tag-dot" />
                      <Icon name="chevron" />
                    </button>
                    {expanded === a.id && (
                      <div className="feed-detail">
                        <em>{a.titleEn}</em>
                        <p>
                          <Thai>{a.excerpt}</Thai>
                        </p>
                        <div className="tag-list">
                          {a.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                        <Meta>
                          {a.minutes} min read · {a.author}
                        </Meta>
                        <button className="text-link" onClick={openReader}>
                          Read <Icon name="arrow" />
                        </button>
                      </div>
                    )}
                  </article>
                ))}
            </section>
          ))}
        </div>
      )}
      {mode === "calendar" && <CalendarView openReader={openReader} />}
      {mode === "timeline" && <TimelineView openReader={openReader} />}
    </main>
  )
}

function CalendarView({ openReader }: { openReader: () => void }) {
  return (
    <div className="calendar-view">
      {[2008, 2007, 2006, 2005, 2004, 2003].map((year, yi) => (
        <section key={year}>
          <h2>{year}</h2>
          <div>
            {Array.from({ length: 12 }, (_, m) => (
              <button
                className={(m + yi) % 4 === 0 ? "has-entry" : ""}
                key={m}
                onClick={(m + yi) % 4 === 0 ? openReader : undefined}
              >
                <span>
                  {new Date(2000, m).toLocaleString("en", { month: "short" })}
                </span>
                <b>{(m * yi + 3) % 7}</b>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function TimelineView({ openReader }: { openReader: () => void }) {
  return (
    <div className="timeline-view">
      {[2008, 2007, 2003, 2001].map((year) => (
        <section key={year}>
          <h2>{year}</h2>
          <div>
            {articles
              .filter((a) => a.year === year)
              .map((a) => (
                <button key={a.id} onClick={openReader}>
                  <Meta>
                    {a.id} · {a.date}
                  </Meta>
                  <strong>
                    <Thai>{a.titleTh}</Thai>
                  </strong>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function ContentsPage({ openReader }: { openReader: () => void }) {
  const [volume, setVolume] = useState<number | null>(null)
  const [filter, setFilter] = useState("All")
  if (volume !== null)
    return (
      <VolumePage
        volume={volume}
        close={() => setVolume(null)}
        filter={filter}
        setFilter={setFilter}
        openReader={openReader}
      />
    )
  return (
    <main className="standard-page">
      <PageTitle
        eyebrow="The complete catalogue"
        title="สารบัญบทความ"
        subtitle="List of Contents · ช่องว่างที่ยังไม่ถูกเก็บรักษาคือส่วนหนึ่งของประวัติศาสตร์"
      />
      <div className="volume-grid">
        {Array.from({ length: 9 }, (_, i) => {
          const start = i * 200 + (i ? 1 : 0)
          const end = (i + 1) * 200
          const count = [168, 143, 191, 86, 121, 72, 34, 19, 7][i]
          return (
            <button
              className="volume-card"
              key={i}
              onClick={() => setVolume(i)}
            >
              <Meta>
                Volume {String(start).padStart(4, "0")}—
                {String(end).padStart(4, "0")}
              </Meta>
              <h2>
                <Thai>สารบัญบทความมหาวิทยาลัยเที่ยงคืน</Thai>
              </h2>
              <div className="progress-label">
                <span>Archived {count} / 200</span>
                <b>{Math.round(count / 2)}%</b>
              </div>
              <div className="progress-bar">
                <i style={{ width: `${count / 2}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </main>
  )
}

function VolumePage({
  volume,
  close,
  filter,
  setFilter,
  openReader,
}: {
  volume: number
  close: () => void
  filter: string
  setFilter: (x: string) => void
  openReader: () => void
}) {
  const rows = Array.from({ length: 24 }, (_, i) => ({
    id: String(volume * 200 + i + 1).padStart(4, "0"),
    archived: i % 3 !== 1,
    title: articles[i % articles.length].titleTh,
  }))
  const visible = rows.filter(
    (r) =>
      filter === "All" || (filter === "Archived" ? r.archived : !r.archived),
  )
  return (
    <main className="standard-page volume-page">
      <button className="back-button" onClick={close}>
        <Icon name="back" /> All volumes
      </button>
      <PageTitle
        eyebrow={`Volume ${String(volume * 200).padStart(4, "0")}—${String((volume + 1) * 200).padStart(4, "0")}`}
        title="Archive ledger"
        subtitle="รายการบทความที่ได้รับการเก็บรักษา และตำแหน่งที่ยังคงรอการค้นพบ"
      />
      <div className="filter-row">
        {["All", "Archived", "Not yet"].map((x) => (
          <Chip active={filter === x} key={x} onClick={() => setFilter(x)}>
            {x}
          </Chip>
        ))}
      </div>
      <div className="ledger">
        {visible.map((row) => (
          <button
            className={row.archived ? "archived" : "missing"}
            key={row.id}
            onClick={row.archived ? openReader : undefined}
          >
            <span className="status-mark">{row.archived ? "●" : "◌"}</span>
            <Meta>{row.id}</Meta>
            <strong>
              <Thai>{row.title}</Thai>
            </strong>
            <span>{row.archived ? "Read" : "Not yet archived"}</span>
          </button>
        ))}
      </div>
    </main>
  )
}

function IndexPage({ openKeyword }: { openKeyword: () => void }) {
  const tabs = ["People", "Concepts", "Places", "Tags", "Titles"]
  const [tab, setTab] = useState("People")
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState("Paul Ricoeur")
  const entries =
    tab === "People"
      ? ["Antonio Gramsci", "Noam Chomsky", "Paul Ricoeur", "Walter Benjamin"]
      : tab === "Places"
        ? ["Chiang Mai", "Patani", "Southeast Asia", "Thailand"]
        : tab === "Titles"
          ? ["การศึกษาเพื่อสันติภาพ", "เสรีภาพกับความทรงจำ", "อำนาจและพื้นที่ศักดิ์สิทธิ์"]
          : ["Collective memory", "Human rights", "Nationalism", "Sacred space"]
  return (
    <main className="standard-page">
      <PageTitle
        eyebrow="A book-like directory"
        title="Index"
        subtitle="ดรรชนีบุคคล แนวคิด สถานที่ และชื่อเรื่องในคลัง"
      />
      <div className="index-tools">
        <div className="tabs">
          {tabs.map((x) => (
            <button
              className={tab === x ? "active" : ""}
              key={x}
              onClick={() => setTab(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <label className="index-search">
          <Icon name="search" />
          <input
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within index"
            value={query}
          />
        </label>
      </div>
      {tab === "Titles" && (
        <>
          <div className="alphabet thai-alphabet">
            {"ก ข ค ง จ ฉ ช ซ ญ ด ต ถ ท ธ น บ ป ผ พ ภ ม ย ร ล ว ศ ส ห อ ฮ"
              .split(" ")
              .map((x) => (
                <button key={x}>{x}</button>
              ))}
          </div>
          <p className="index-note">
            เรียงตามพยัญชนะต้น โดยไม่นับสระนำ เ แ โ ไ ใ — “เสรีภาพ” จัดอยู่ในหมวด ส
          </p>
        </>
      )}
      {tab !== "Titles" && (
        <div className="alphabet">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((x) => (
            <button key={x}>{x}</button>
          ))}
        </div>
      )}
      <div className="index-book">
        <div className="index-letter">
          {tab === "Titles" ? "ส" : entries[0][0]}
          <Meta>{entries.length} entries</Meta>
        </div>
        {entries
          .filter((entry) => entry.toLowerCase().includes(query.toLowerCase()))
          .map((entry, i) => (
            <article className="index-entry" key={entry}>
              <button
                onClick={() => setExpanded(expanded === entry ? "" : entry)}
              >
                <span>
                  {entry} <small>({i + 2})</small>
                </span>
                <Icon name="chevron" />
              </button>
              {expanded === entry && (
                <div className="index-expansion">
                  <button onClick={openKeyword}>
                    <Meta>0308</Meta>
                    <strong>
                      <Thai>{articles[i % articles.length].titleTh}</Thai>
                    </strong>
                    <span>
                      Open keyword archive <Icon name="arrow" />
                    </span>
                  </button>
                  <button onClick={openKeyword}>
                    <Meta>0110</Meta>
                    <strong>
                      <Thai>{articles[(i + 2) % articles.length].titleTh}</Thai>
                    </strong>
                    <span>
                      Open keyword archive <Icon name="arrow" />
                    </span>
                  </button>
                </div>
              )}
            </article>
          ))}
      </div>
      {query && (
        <Meta className="match-note">
          Exact matches shown first · Near matches follow
        </Meta>
      )}
    </main>
  )
}

const hubData = [
  ["History", 78, 48, 18],
  ["Deep South", 65, 33, 22],
  ["Nationalism", 53, 61, 39],
  ["Islam", 43, 25, 55],
  ["Politics", 70, 72, 60],
  ["Memory", 38, 48, 73],
  ["Anthropology", 49, 78, 30],
  ["Rights", 56, 84, 77],
  ["Education", 34, 17, 76],
  ["Patani", 41, 12, 43],
  ["Philosophy", 46, 64, 83],
  ["State", 59, 89, 38],
]

function MiniGraph() {
  return (
    <div className="mini-graph">
      <svg viewBox="0 0 300 180">
        <g className="edges">
          <path d="M150 90 55 44M150 90 245 40M150 90 230 140M150 90 70 145M150 90 154 25" />
        </g>
        {[
          [150, 90, 18],
          [55, 44, 9],
          [245, 40, 11],
          [230, 140, 8],
          [70, 145, 12],
          [154, 25, 8],
        ].map((n, i) => (
          <circle cx={n[0]} cy={n[1]} r={n[2]} key={i} />
        ))}
        <text x="150" y="124" textAnchor="middle">
          Nationalism
        </text>
      </svg>
    </div>
  )
}

function GraphPage({ openReader }: { openReader: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [list, setList] = useState(false)
  return (
    <main className="graph-page standard-page">
      <div className="title-row">
        <PageTitle
          eyebrow="Knowledge connections"
          title="Graph"
          subtitle="เริ่มจากศูนย์กลางความคิด แล้วค่อยขยายไปยังบทความ"
        />
        <button className="outline-button" onClick={() => setList(!list)}>
          <Icon name="list" /> {list ? "Graph view" : "List view"}
        </button>
      </div>
      <div className="graph-controls">
        <div className="category-filters">
          {categories.slice(0, 5).map((c, i) => (
            <Chip active={!i} key={c[0]}>
              <span style={{ color: c[1] }}>{c[2]}</span>
              {c[0]}
            </Chip>
          ))}
        </div>
        <label>
          <span>
            Min. connections <b>3</b>
          </span>
          <input type="range" min="1" max="10" defaultValue="3" />
        </label>
        <label>
          <span>
            Date range <b>1999—2008</b>
          </span>
          <input type="range" min="1997" max="2008" defaultValue="2008" />
        </label>
        <label className="graph-search">
          <Icon name="search" />
          <input placeholder="Find a node" />
        </label>
      </div>
      {list ? (
        <div className="graph-list">
          {hubData.map((h, i) => (
            <button key={h[0]} onClick={() => setSelected(String(h[0]))}>
              <span
                className="shape"
                style={{ color: categories[i % categories.length][1] }}
              >
                {categories[i % categories.length][2]}
              </span>
              <strong>{h[0]}</strong>
              <span>{h[1]} articles</span>
              <Icon name="chevron" />
            </button>
          ))}
        </div>
      ) : (
        <div className={`network ${selected ? "has-selection" : ""}`}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g>
              {hubData.slice(1).map((h, i) => (
                <line
                  key={h[0]}
                  x1={hubData[0][2]}
                  y1={hubData[0][3]}
                  x2={h[2]}
                  y2={h[3]}
                />
              ))}
            </g>
          </svg>
          {hubData.map((hub, i) => (
            <button
              className={`node ${selected === hub[0] ? "selected" : ""}`}
              key={hub[0]}
              onClick={() =>
                setSelected(selected === hub[0] ? null : String(hub[0]))
              }
              style={
                {
                  left: `${hub[2]}%`,
                  top: `${hub[3]}%`,
                  "--node-size": `${28 + Number(hub[1]) / 2}px`,
                  "--node-color": categories[i % categories.length][1],
                } as React.CSSProperties
              }
            >
              <span>{categories[i % categories.length][2]}</span>
              <b>{hub[0]}</b>
              <i>{hub[1]}</i>
            </button>
          ))}
          {selected && (
            <div className="satellites">
              {articles.slice(0, 4).map((a, i) => (
                <button
                  key={a.id}
                  onClick={openReader}
                  style={{ "--angle": `${i * 90}deg` } as React.CSSProperties}
                >
                  <span>{a.id}</span>
                </button>
              ))}
            </div>
          )}
          <div className="zoom-hint">
            <Meta>
              Scroll to zoom · Drag to explore · Select a hub to expand
            </Meta>
          </div>
        </div>
      )}
      <div className="graph-legend">
        {categories.map((c) => (
          <span key={c[0]} style={{ color: c[1] }}>
            {c[2]} <i>{c[0]}</i>
          </span>
        ))}
      </div>
    </main>
  )
}

function KeywordPage({
  openReader,
  back,
}: {
  openReader: () => void
  back: () => void
}) {
  return (
    <main className="standard-page keyword-page">
      <button className="back-button" onClick={back}>
        <Icon name="back" /> Back to archive
      </button>
      <PageTitle
        eyebrow="Keyword archive · 12 articles"
        title="Nationalism"
        subtitle="แนวคิดว่าด้วยชาติ การสร้างความเป็นอันหนึ่งอันเดียว และพรมแดนของผู้ที่ถูกนับรวม"
      />
      <div className="keyword-layout">
        <section>
          <Meta>Related articles</Meta>
          <div className="related-grid">
            {articles.slice(3, 6).map((a) => (
              <button className="article-card" key={a.id} onClick={openReader}>
                <Meta>
                  {a.id} · {a.date}
                </Meta>
                <h3>
                  <Thai>{a.titleTh}</Thai>
                </h3>
                <em>{a.titleEn}</em>
                <span>
                  Read article <Icon name="arrow" />
                </span>
              </button>
            ))}
          </div>
        </section>
        <aside>
          <Meta>Local graph</Meta>
          <MiniGraph />
          <Meta>Related keywords</Meta>
          <div className="tag-list">
            <button>State</button>
            <button>Memory</button>
            <button>Identity</button>
            <button>History</button>
          </div>
        </aside>
      </div>
      <section className="contexts">
        <Meta>Mentioned in context</Meta>
        {articles.slice(0, 3).map((a) => (
          <blockquote key={a.id}>
            “…รูปแบบของ <mark>ชาตินิยม</mark>{" "}
            ถูกสร้างผ่านความทรงจำและภาษาที่เราใช้เรียกผู้คน…”
            <cite>
              {a.id} · {a.author}
            </cite>
          </blockquote>
        ))}
      </section>
    </main>
  )
}

function Reader({ back }: { back: () => void }) {
  const [settings, setSettings] = useState(false)
  const [toc, setToc] = useState(false)
  const [theme, setTheme] = useState("midnight")
  const [fontSize, setFontSize] = useState(3)
  const [width, setWidth] = useState("medium")
  const [typeface, setTypeface] = useState("serif")
  return (
    <main
      className={`reader theme-${theme} type-${typeface} width-${width}`}
      style={{ "--reader-step": fontSize } as React.CSSProperties}
    >
      <div className="reader-progress" />
      <div className="reader-toolbar">
        <button className="back-button" onClick={back}>
          <Icon name="back" /> Archive
        </button>
        <Meta>0308 · Reading</Meta>
        <div>
          <button
            className="icon-button"
            aria-label="Table of contents"
            onClick={() => setToc(!toc)}
          >
            <Icon name="list" />
          </button>
          <button className="icon-button" aria-label="Bookmark">
            <Icon name="bookmark" />
          </button>
          <button
            className="aa-button"
            aria-label="Reading settings"
            onClick={() => setSettings(!settings)}
          >
            Aa
          </button>
        </div>
      </div>
      {toc && (
        <aside className="reader-toc">
          <Meta>In this article</Meta>
          <button className="active">บทนำ</button>
          <button>§ ปัญญาชนกับอำนาจ</button>
          <button>§ เสรีภาพในสังคม</button>
          <button>บทสรุป</button>
        </aside>
      )}
      {settings && (
        <SettingsPanel
          theme={theme}
          setTheme={setTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
          width={width}
          setWidth={setWidth}
          typeface={typeface}
          setTypeface={setTypeface}
          close={() => setSettings(false)}
        />
      )}
      <article className="reader-article">
        <header className="article-header">
          <Meta>
            0308 · 2003-08-28 · 12 min read · <b>กองบรรณาธิการ</b>
          </Meta>
          <h1>
            <Thai>บทสัมภาษณ์ Noam Chomsky — สิงหาคม 2003</Thai>
          </h1>
          <h2>Noam Chomsky Interview — August 2003</h2>
          <div className="tag-list">
            <button>Chomsky</button>
            <button>Interview</button>
            <button>Human rights</button>
          </div>
        </header>
        <div className="prose">
          <p className="lead">
            <Thai>
              ในค่ำคืนหนึ่งของเดือนสิงหาคม บทสนทนาว่าด้วยอำนาจ ความรับผิดชอบ
              และบทบาทของปัญญาชนได้เริ่มต้นขึ้น บทสัมภาษณ์นี้ชวนให้เรากลับมาพิจารณาว่า
              ความรู้จะยืนอยู่ตรงไหนในเวลาที่สังคมกำลังมืดมน
            </Thai>
          </p>
          <h2>
            <Thai>ปัญญาชนกับความรับผิดชอบ</Thai>
          </h2>
          <p>
            <Thai>
              สำหรับปัญญาชน ตลอดประวัติศาสตร์ที่ผ่านมา
              มันแทบจะกลายเป็นภารกิจไปแล้วที่ผู้มีโอกาสเข้าถึงข้อมูลและการศึกษา
              จะต้องตั้งคำถามต่อสถาบันที่ครองอำนาจ และเปิดพื้นที่ให้เสียงซึ่งถูกกดทับได้ปรากฏขึ้น
            </Thai>
          </p>
          <p>
            <Thai>
              ความรับผิดชอบนี้ไม่ใช่เรื่องของความกล้าหาญส่วนบุคคลเท่านั้น
              แต่เกี่ยวพันกับโครงสร้างของ{" "}
            </Thai>
            <a className="internal" href="#keyword">
              รัฐชาติ
            </a>
            <Thai>
              {" "}
              และสถาบันที่กำหนดว่าสิ่งใดควรถูกจดจำ สิ่งใดควรถูกทำให้เงียบหาย
              ดูบทสนทนาเพิ่มเติมจาก{" "}
            </Thai>
            <a className="external" href="https://example.com">
              แหล่งข้อมูลภายนอก <Icon name="arrow" size={14} />
            </a>
          </p>
          <blockquote>
            <Thai>
              “ความรับผิดชอบของปัญญาชน คือการพูดความจริงและเปิดโปงคำลวง —
              โดยเฉพาะในเวลาที่การพูดนั้นไม่เป็นที่ต้อนรับ”
            </Thai>
          </blockquote>
          <h3>
            <Thai>ภาษา ความจริง และอำนาจ</Thai>
          </h3>
          <p>
            <Thai>
              ภาษาทำหน้าที่มากกว่าการสื่อสาร มันสร้างขอบเขตของสิ่งที่เราจินตนาการได้
              ดังนั้นการอ่านอย่างช้า ๆ จึงเป็นการต่อต้านการเร่งรัด
              และเป็นวิธีหนึ่งที่จะทำให้รายละเอียดกลับมาปรากฏ
            </Thai>
          </p>
          <ul>
            <li>
              <Thai>ตรวจสอบที่มาของข้ออ้างและถ้อยคำที่ถูกทำให้เป็นเรื่องธรรมดา</Thai>
            </li>
            <li>
              <Thai>รับฟังประสบการณ์ของผู้คนที่อยู่นอกศูนย์กลาง</Thai>
            </li>
            <li>
              <Thai>รักษาพื้นที่ของความไม่แน่นอนเอาไว้</Thai>
            </li>
          </ul>
          <h4>Archive note · บันทึกจากกองบรรณาธิการ</h4>
          <p>
            <Thai>
              ต้นฉบับถูกแปลงจากเอกสาร HTML เดิมและตรวจทานใหม่เพื่อการเก็บรักษา
              ย่อหน้าทั้งหมดสามารถเชื่อมโยงโดยตรงได้
            </Thai>
          </p>
          <div className="paragraph-link">
            <button>
              <Icon name="link" /> Copy link to paragraph
            </button>
          </div>
          <hr />
          <h2>
            <Thai>บทส่งท้าย</Thai>
          </h2>
          <p>
            <Thai>
              คลังความรู้ไม่ใช่อนุสาวรีย์ที่หยุดนิ่ง แต่คือความสัมพันธ์ระหว่างผู้อ่าน เอกสาร
              และคำถามใหม่ที่เกิดขึ้นทุกครั้งเมื่อข้อความเก่าถูกเปิดอ่าน
            </Thai>
          </p>
          <table>
            <caption>บทความที่กล่าวถึงในการสนทนา</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>ปี</th>
                <th>หัวข้อ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0061</td>
                <td>2001</td>
                <td>Education for Peace</td>
              </tr>
              <tr>
                <td>0110</td>
                <td>2001</td>
                <td>Nationalism</td>
              </tr>
            </tbody>
          </table>
          <section className="bibliography">
            <h2>Bibliography</h2>
            <p>
              Chomsky, Noam. <em>The Responsibility of Intellectuals.</em> New
              York: The New Press, 2017.
            </p>
            <p>
              Ricoeur, Paul. <em>Memory, History, Forgetting.</em> Chicago:
              University of Chicago Press, 2004.
            </p>
          </section>
        </div>
      </article>
      <section className="after-article">
        <div>
          <Meta>Linked from · Backlinks</Meta>
          <button>
            <span>1193</span>
            <Thai>การพัฒนาปอเนาะชายแดนใต้</Thai>
          </button>
          <button>
            <span>1427</span>
            <Thai>พื้นที่ศักดิ์สิทธิ์กับความทรงจำของเมือง</Thai>
          </button>
        </div>
        <div>
          <Meta>Local graph · 2 hops</Meta>
          <MiniGraph />
        </div>
      </section>
      <nav className="prev-next">
        <button>
          <Meta>Previous · 0307</Meta>
          <Thai>ความทรงจำและการเมืองของภาษา</Thai>
        </button>
        <button>
          <Meta>Next · 0309</Meta>
          <Thai>เสียงจากชายแดนและสังคมไทย</Thai>
        </button>
      </nav>
    </main>
  )
}

function SettingsPanel({
  theme,
  setTheme,
  fontSize,
  setFontSize,
  width,
  setWidth,
  typeface,
  setTypeface,
  close,
}: {
  theme: string
  setTheme: (x: string) => void
  fontSize: number
  setFontSize: (x: number) => void
  width: string
  setWidth: (x: string) => void
  typeface: string
  setTypeface: (x: string) => void
  close: () => void
}) {
  return (
    <div className="settings-panel">
      <div className="settings-head">
        <div>
          <Meta>Reading settings</Meta>
          <h3>ปรับห้องอ่าน</h3>
        </div>
        <button className="icon-button" onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      <label>
        <span>Text size</span>
        <div className="size-picker">
          <small>A</small>
          {[1, 2, 3, 4, 5].map((x) => (
            <button
              className={fontSize === x ? "active" : ""}
              key={x}
              onClick={() => setFontSize(x)}
            >
              {x}
            </button>
          ))}
          <big>A</big>
        </div>
      </label>
      <label>
        <span>Column width</span>
        <div className="option-row">
          {["narrow", "medium", "wide"].map((x) => (
            <button
              className={width === x ? "active" : ""}
              key={x}
              onClick={() => setWidth(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </label>
      <label>
        <span>Typeface</span>
        <div className="option-row">
          <button
            className={typeface === "serif" ? "active" : ""}
            onClick={() => setTypeface("serif")}
          >
            Serif
          </button>
          <button
            className={typeface === "sans" ? "active" : ""}
            onClick={() => setTypeface("sans")}
          >
            Sans
          </button>
        </div>
      </label>
      <label>
        <span>Theme</span>
        <div className="themes">
          {[
            ["midnight", "#1b1b1a"],
            ["ink", "#050505"],
            ["candlelight", "#241d18"],
            ["dawn", "#eee6d8"],
          ].map((x) => (
            <button
              className={theme === x[0] ? "active" : ""}
              key={x[0]}
              onClick={() => setTheme(x[0])}
            >
              <i style={{ background: x[1] }} />
              {x[0]}
            </button>
          ))}
        </div>
      </label>
    </div>
  )
}

function StyleGuide() {
  return (
    <main className="standard-page guide-page">
      <PageTitle
        eyebrow="Living design system · v1.0"
        title="Midnight Reading Room"
        subtitle="A quiet visual language built from near-black paper, candle gold, and typographic restraint."
      />
      <section>
        <Meta>01 · Colour</Meta>
        <div className="swatches">
          {[
            ["Base", "#1B1B1A"],
            ["Raised", "#222220"],
            ["Sunken", "#151514"],
            ["Primary", "#ECE8E1"],
            ["Secondary", "#B5AFA5"],
            ["Gold 500", "#C9A87C"],
            ["Gold 400", "#E3C58F"],
            ["Danger", "#C75450"],
          ].map((x) => (
            <div key={x[0]}>
              <i style={{ background: x[1] }} />
              <strong>{x[0]}</strong>
              <code>{x[1]}</code>
            </div>
          ))}
        </div>
      </section>
      <section>
        <Meta>02 · Typography</Meta>
        <div className="type-spec">
          <div>
            <h1>Midnight University</h1>
            <span>Display serif · 64 / 1.1</span>
          </div>
          <div>
            <h2>
              <Thai>กลางวันมืด กลางคืนกลับสว่าง</Thai>
            </h2>
            <span>Thai display · 40 / 1.45</span>
          </div>
          <div>
            <p>
              <Thai>การอ่านคือการให้เวลากับสิ่งที่ไม่ยอมเปิดเผยตัวเองในทันที</Thai>
            </p>
            <span>Thai body · 18 / 1.85</span>
          </div>
        </div>
      </section>
      <section>
        <Meta>03 · Components</Meta>
        <div className="component-showcase">
          <button className="gold-button">Primary action</button>
          <button className="outline-button">Secondary action</button>
          <Chip active>Active chip</Chip>
          <Chip>Default chip</Chip>
          <a className="internal" href="#internal">
            Internal link
          </a>
          <a className="external" href="#external">
            External link <Icon name="arrow" size={14} />
          </a>
        </div>
      </section>
      <section>
        <Meta>04 · Glyph stamps</Meta>
        <div className="glyph-set">
          {["☾", "✦", "⚖", "♜", "⌛", "◇", "⌂", "◉", "♧", "⌖", "◭", "▱"].map(
            (x) => (
              <Glyph key={x}>{x}</Glyph>
            ),
          )}
        </div>
      </section>
      <section>
        <Meta>05 · Category keys</Meta>
        <div className="category-key">
          {categories.map((c) => (
            <span key={c[0]} style={{ color: c[1] }}>
              {c[2]} <i>{c[0]}</i>
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}

export default function App() {
  const [view, setView] = useState<View>("archive")
  const [previousView, setPreviousView] = useState<View>("archive")
  const [search, setSearch] = useState(false)
  const navigate = (next: View) => {
    setPreviousView(view)
    setView(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  useEffect(() => {
    const open = (e: KeyboardEvent) => {
      if (
        (e.metaKey && e.key.toLowerCase() === "k") ||
        (e.key === "/" && !(e.target instanceof HTMLInputElement))
      ) {
        e.preventDefault()
        setSearch(true)
      }
    }
    window.addEventListener("keydown", open)
    return () => window.removeEventListener("keydown", open)
  }, [])
  return (
    <div className="app-shell">
      {view !== "reader" && (
        <Header
          view={view}
          setView={navigate}
          openSearch={() => setSearch(true)}
        />
      )}
      {view === "archive" && (
        <Archive
          openReader={() => navigate("reader")}
          openKeyword={() => navigate("keyword")}
        />
      )}
      {view === "random" && (
        <RandomPage
          openReader={() => navigate("reader")}
          openKeyword={() => navigate("keyword")}
        />
      )}
      {view === "feed" && <FeedPage openReader={() => navigate("reader")} />}
      {view === "contents" && (
        <ContentsPage openReader={() => navigate("reader")} />
      )}
      {view === "index" && (
        <IndexPage openKeyword={() => navigate("keyword")} />
      )}
      {view === "graph" && <GraphPage openReader={() => navigate("reader")} />}
      {view === "keyword" && (
        <KeywordPage
          openReader={() => navigate("reader")}
          back={() => navigate(previousView)}
        />
      )}
      {view === "reader" && <Reader back={() => navigate(previousView)} />}
      {view === "guide" && <StyleGuide />}
      {view !== "reader" && (
        <footer className="site-footer">
          <span>Midnight University · Digital archive</span>
          <button onClick={() => navigate("guide")}>Style guide</button>
          <span>Chiang Mai · 1997—∞</span>
        </footer>
      )}
      {search && (
        <SearchOverlay close={() => setSearch(false)} openView={navigate} />
      )}
    </div>
  )
}
