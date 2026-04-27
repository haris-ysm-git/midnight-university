// ─── Shared Article Data ───────────────────────────────────────
export interface Article {
  id: number;
  title: string;
  author: string;
  volume: string;
  issue: string;
  date: string;
  readTime: string;
  genres: string[];
  index: string;
  tag: string;
}

export const articles: Article[] = [
  { id: 0,  title: "The Architecture of Silence",     author: "Elena Vasquez", volume: "Vol. 01", issue: "No. 04", date: "Mar 2024", readTime: "12 min read", genres: ["Architecture", "Philosophy", "Space"],       index: "001", tag: "Essay"    },
  { id: 1,  title: "Digital Ruins of Tomorrow",       author: "Marcus Chen",   volume: "Vol. 01", issue: "No. 05", date: "Apr 2024", readTime: "8 min read",  genres: ["Technology", "Future", "Design"],           index: "002", tag: "Critical" },
  { id: 2,  title: "Gravity as a Design Tool",        author: "Sofía Morales", volume: "Vol. 02", issue: "No. 01", date: "May 2024", readTime: "15 min read", genres: ["Physics", "Architecture", "Craft"],          index: "003", tag: "Research" },
  { id: 3,  title: "On the Language of Rain",         author: "James Okafor",  volume: "Vol. 02", issue: "No. 02", date: "Jun 2024", readTime: "10 min read", genres: ["Nature", "Poetry", "Climate"],               index: "004", tag: "Essay"    },
  { id: 4,  title: "Memory as Infrastructure",        author: "Yuki Tanaka",   volume: "Vol. 02", issue: "No. 03", date: "Jul 2024", readTime: "14 min read", genres: ["Psychology", "Urban", "Memory"],             index: "005", tag: "Research" },
  { id: 5,  title: "The Mathematics of Beauty",       author: "Aria Patel",    volume: "Vol. 02", issue: "No. 04", date: "Aug 2024", readTime: "9 min read",  genres: ["Mathematics", "Aesthetics", "Art"],          index: "006", tag: "Essay"    },
  { id: 6,  title: "Brutalism & the Body Politic",    author: "Elena Vasquez", volume: "Vol. 03", issue: "No. 01", date: "Sep 2024", readTime: "18 min read", genres: ["Politics", "Architecture", "Society"],       index: "007", tag: "Critical" },
  { id: 7,  title: "Signals from the Anthropocene",  author: "Marcus Chen",   volume: "Vol. 03", issue: "No. 02", date: "Oct 2024", readTime: "11 min read", genres: ["Climate", "Science", "Future"],              index: "008", tag: "Research" },
  { id: 8,  title: "When Interfaces Dream",           author: "Yuki Tanaka",   volume: "Vol. 03", issue: "No. 03", date: "Nov 2024", readTime: "7 min read",  genres: ["Technology", "AI", "Design"],               index: "009", tag: "Essay"    },
  { id: 9,  title: "The Slow Violence of Beauty",     author: "Sofía Morales", volume: "Vol. 03", issue: "No. 04", date: "Dec 2024", readTime: "13 min read", genres: ["Aesthetics", "Politics", "Culture"],         index: "010", tag: "Critical" },
  { id: 10, title: "Cartographies of Longing",        author: "James Okafor",  volume: "Vol. 04", issue: "No. 01", date: "Jan 2025", readTime: "16 min read", genres: ["Geography", "Emotion", "Travel"],            index: "011", tag: "Essay"    },
  { id: 11, title: "Form Follows Feeling",            author: "Aria Patel",    volume: "Vol. 04", issue: "No. 02", date: "Feb 2025", readTime: "10 min read", genres: ["Design", "Psychology", "Form"],              index: "012", tag: "Research" },
];

export const uniqueAuthors = Array.from(new Set(articles.map(a => a.author)));
