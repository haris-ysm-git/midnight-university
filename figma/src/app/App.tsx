import { useState, useEffect } from "react";
import { ArticleArchive } from "./components/ArticleArchive";
import { MobileArchive } from "./components/MobileArchive";

// Responsive breakpoint: ≥768px → desktop 4-col, <768px → mobile unified list
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export default function App() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileArchive /> : <ArticleArchive />;
}
