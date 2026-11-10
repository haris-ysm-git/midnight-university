"use client";

import React, { useMemo } from "react";

export function Thai({
  children,
  className = "",
  as: Component = "span",
}: {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  const isString = typeof children === "string";

  const parts = useMemo(() => {
    if (!isString || typeof children !== "string") {
      return null;
    }
    if (typeof Intl === "undefined" || !("Segmenter" in Intl)) {
      return [children];
    }
    try {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      return Array.from(segmenter.segment(children), (x) => x.segment);
    } catch {
      return [children];
    }
  }, [children, isString]);

  if (!isString || !parts) {
    return (
      <Component className={className} lang="th">
        {children}
      </Component>
    );
  }

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
