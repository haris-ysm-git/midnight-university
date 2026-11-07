"use client";

import React, { useMemo } from "react";

export function Thai({
  children,
  className = "",
  as: Component = "span",
}: {
  children?: React.ReactNode;
  className?: string;
  as?: any;
}) {
  if (typeof children !== "string") {
    return (
      <Component className={className} lang="th">
        {children}
      </Component>
    );
  }

  const parts = useMemo(() => {
    if (typeof Intl === "undefined" || !("Segmenter" in Intl)) {
      return [children];
    }
    try {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      return Array.from(segmenter.segment(children), (x) => x.segment);
    } catch {
      return [children];
    }
  }, [children]);

  return (
    <Component className={className} lang="th">
      {parts.map((part, i) => (
        <React.Fragment key={`${part}-${i}`}>
          {part}
          <wbr />
        </React.Fragment>
      ))}
    </Component>
  );
}
