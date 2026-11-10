import {
  Source_Serif_4,
  Noto_Serif_Thai,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Thai_Looped,
} from "next/font/google";

export const fontSourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--ff-source-serif",
  display: "swap",
  preload: true,
});

export const fontNotoSerifThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  style: ["normal"],
  variable: "--ff-noto-serif-thai",
  display: "swap",
  preload: true,
});

export const fontPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--ff-plex-sans",
  display: "swap",
  preload: false,
});

export const fontPlexThaiLooped = IBM_Plex_Sans_Thai_Looped({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  variable: "--ff-plex-thai-looped",
  display: "swap",
  preload: false,
});
