import React from "react";
import Link from "next/link";
import { slugifyHeading } from "@/lib/zone-parser";
import { Icon } from "@/components/icons";

export function getMdxComponents() {
  return {
    h1: (props: any) => {
      // Visually hidden so title isn't shown twice
      return <h1 className="sr-only" {...props} />;
    },

    h2: (props: any) => {
      const text = String(props.children || "");
      const slug = slugifyHeading(text);
      return (
        <h2 id={slug} className="scroll-mt-24 group flex items-baseline gap-2">
          <span className="flex-1">{props.children}</span>
          <a
            href={`#${slug}`}
            className="opacity-0 group-hover:opacity-60 text-xs font-mono text-[var(--gold)] no-underline"
            aria-label="Link to section"
          >
            #
          </a>
        </h2>
      );
    },

    h3: (props: any) => {
      const text = String(props.children || "");
      const slug = slugifyHeading(text);
      return (
        <h3 id={slug} className="scroll-mt-24 group flex items-baseline gap-2">
          <span className="flex-1">{props.children}</span>
          <a
            href={`#${slug}`}
            className="opacity-0 group-hover:opacity-60 text-xs font-mono text-[var(--gold)] no-underline"
            aria-label="Link to section"
          >
            #
          </a>
        </h3>
      );
    },

    h4: (props: any) => {
      const text = String(props.children || "");
      const slug = slugifyHeading(text);
      return (
        <h4 id={slug} className="scroll-mt-24 group flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-[var(--gold)] mr-1">✦</span>
          <span className="flex-1">{props.children}</span>
          <a
            href={`#${slug}`}
            className="opacity-0 group-hover:opacity-60 text-xs font-mono text-[var(--gold)] no-underline"
            aria-label="Link to subsection"
          >
            #
          </a>
        </h4>
      );
    },

    p: (props: any) => {
      const children = props.children;

      // Detect figure caption: entirely italic and begins with (ภาพ:
      if (typeof children === "string" && /^\(ภาพ:/i.test(children.trim())) {
        return (
          <p className="text-center text-xs font-mono text-[var(--muted)] my-6">
            {children}
          </p>
        );
      }

      // Check for speaker turn in children
      // Often React element with <strong>Speaker</strong> followed by " : " or similar
      if (Array.isArray(children)) {
        const first = children[0];
        const second = children[1];

        const isBoldSpeaker =
          first &&
          typeof first === "object" &&
          (first.type === "strong" || first.props?.node?.tagName === "strong");

        const hasColonPrefix =
          typeof second === "string" && second.trimStart().startsWith(":");

        if (isBoldSpeaker && hasColonPrefix) {
          const speakerName = first.props?.children || first;
          const restText = [
            second.replace(/^[\s:]+/, ""),
            ...children.slice(2),
          ];

          return (
            <div className="speaker-turn my-6 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-2 md:gap-6 items-baseline">
              <div className="speaker-label font-mono text-xs text-[var(--gold-bright)] tracking-wider uppercase font-semibold">
                {speakerName}
              </div>
              <div className="speaker-speech text-[var(--text)] leading-relaxed">
                {restText}
              </div>
            </div>
          );
        }
      }

      // Plain string check for speaker turn if passed as text
      if (typeof children === "string") {
        const match = children.match(/^\*\*([^*]+)\*\*\s*:\s*([\s\S]*)$/);
        if (match) {
          return (
            <div className="speaker-turn my-6 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-2 md:gap-6 items-baseline">
              <div className="speaker-label font-mono text-xs text-[var(--gold-bright)] tracking-wider uppercase font-semibold">
                {match[1]}
              </div>
              <div className="speaker-speech text-[var(--text)] leading-relaxed">
                {match[2]}
              </div>
            </div>
          );
        }
      }

      return <p {...props} />;
    },

    blockquote: (props: any) => {
      // Check for labelled note (หมายเหตุผู้แปล, หมายเหตุกองบรรณาธิการ, etc.)
      const text = String(props.children?.[0]?.props?.children || "");
      const labelMatch = text.match(
        /^(หมายเหตุผู้แปล|หมายเหตุกองบรรณาธิการ|หมายเหตุผู้เขียน|หมายเหตุ|คำชี้แจง|เชิงอรรถ)\s*[:：]?\s*([\s\S]*)$/i
      );

      if (labelMatch) {
        const label = labelMatch[1];
        return (
          <blockquote className="my-8 p-6 bg-[var(--raised)] border border-dashed border-[var(--line-strong)] not-italic rounded-sm">
            <div className="mb-2">
              <span className="chip !text-[9px] !min-h-[24px] !py-0 !px-2 border-[var(--gold)] text-[var(--gold-bright)]">
                {label}
              </span>
            </div>
            <div className="text-sm text-[var(--secondary)] leading-relaxed">
              {props.children}
            </div>
          </blockquote>
        );
      }

      return (
        <blockquote className="my-8 pl-6 border-l-2 border-[var(--gold)] bg-[var(--raised)] p-6 italic font-serif text-[1.05em] text-[var(--text)]">
          {props.children}
        </blockquote>
      );
    },

    table: (props: any) => (
      <div className="my-8 overflow-x-auto border border-[var(--line)]">
        <table className="w-full text-left border-collapse" {...props} />
      </div>
    ),

    th: (props: any) => (
      <th
        className="border-b border-[var(--line-strong)] p-3 font-mono text-xs uppercase tracking-wider text-[var(--gold)] bg-[var(--sunken)]"
        {...props}
      />
    ),

    td: (props: any) => (
      <td
        className="border-b border-[var(--line)] p-3 text-sm text-[var(--secondary)]"
        {...props}
      />
    ),

    hr: () => (
      <div className="relative my-16 text-center">
        <hr className="border-t border-[var(--line)]" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg)] px-3 text-[var(--gold)] text-xs font-mono">
          ✦
        </span>
      </div>
    ),

    a: (props: any) => {
      const href = props.href || "";

      // Unresolved wikilinks
      if (href === "#unresolved" || href.startsWith("#unresolved")) {
        return (
          <span
            className="unresolved-wikilink text-[var(--muted)] border-b border-dotted border-[var(--muted)] cursor-help inline-block px-0.5"
            title={props.title ? `Unresolved link: ${props.title}` : "Unresolved link"}
          >
            {props.children}
          </span>
        );
      }

      // Footnote references
      if (href.startsWith("#fn-")) {
        return (
          <a
            href={href}
            className="footnote-ref text-[var(--gold)] font-mono text-[10px] hover:underline"
            {...props}
          />
        );
      }

      // Internal links
      if (href.startsWith("/")) {
        return (
          <Link
            href={href}
            className="internal text-[var(--gold-bright)] border-b border-dotted border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--bg)] transition-colors rounded-xs px-0.5 no-underline"
            {...props}
          >
            {props.children}
          </Link>
        );
      }

      // External links
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="external inline-flex items-baseline gap-1 text-[var(--text)] border-b border-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors no-underline"
          {...props}
        >
          <span>{props.children}</span>
          <Icon name="arrow" size={10} className="inline opacity-70" />
        </a>
      );
    },
  };
}
