import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import SWUnregister from "./SWUnregister";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsProvider } from "@/lib/analytics/AnalyticsProvider";

// DESIGN.md type system, self-hosted by next/font (no render-blocking Google
// Fonts request). Exposed as CSS variables consumed by tailwind.config.ts.
const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-outfit" });

// Applies the saved theme (or prefers-color-scheme) before first paint so the
// page never flashes the wrong theme. Keep the storage key and resolution
// rules in sync with src/hooks/use-theme.tsx.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("source_io_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){document.documentElement.classList.add("dark")}})()`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sourceio.app"),
  title: "AI Study Notes, Flashcards & Quizzes with Citations | Source.io",
  description:
    "Transform textbooks, lecture recordings, and research papers into verified study notes, 3D flashcards, quizzes, and podcasts with exact source citations. Start free.",
  openGraph: {
    title: "AI Study Notes, Flashcards & Quizzes with Citations | Source.io",
    description:
      "Transform textbooks, lecture recordings, and research papers into verified study notes, 3D flashcards, quizzes, and podcasts with exact source citations.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Source.io — Turn any source into 5 verified study modes",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Study Notes, Flashcards & Quizzes with Citations | Source.io",
    description:
      "Transform textbooks, lecture recordings, and research papers into verified study notes, 3D flashcards, quizzes, and podcasts with exact source citations.",
    images: ["/og-image.png"],
  },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms.txt"
          title="AI Context Specification"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <SWUnregister />
        <Analytics />
        <SpeedInsights />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
