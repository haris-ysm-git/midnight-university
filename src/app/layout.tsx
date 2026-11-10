import type { Metadata } from "next";
import "@/styles/globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";
import {
  fontSourceSerif,
  fontNotoSerifThai,
  fontPlexSans,
  fontPlexThaiLooped,
} from "@/lib/reading-fonts";

export const metadata: Metadata = {
  title: "Midnight University Archive · กลางวันมืด กลางคืนกลับสว่าง",
  description: "A curation of critical futures, history, linguistics, human rights, and philosophy archive.",
};

const antiFlashScript = `
(function() {
  try {
    var stored = localStorage.getItem('midnight_reading_settings');
    var theme = 'midnight';
    var ambience = 'on';
    var readingFont = 'serif';
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed.theme) theme = parsed.theme;
      if (parsed.ambience === false) ambience = 'off';
      if (parsed.typeface === 'sans') readingFont = 'sans';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-ambience', ambience);
    document.documentElement.setAttribute('data-reading-font', readingFont);
    if (theme === 'dawn') document.documentElement.classList.add('theme-dawn');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = `${fontSourceSerif.variable} ${fontNotoSerifThai.variable} ${fontPlexSans.variable} ${fontPlexThaiLooped.variable}`;

  return (
    <html lang="th" suppressHydrationWarning className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
      </head>
      <body className="antialiased min-h-screen text-[var(--text)] bg-[var(--bg)]">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
