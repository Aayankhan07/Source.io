import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import SWUnregister from "./SWUnregister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sourceio.app"),
  title: "Source.io: AI study workspace for any content",
  description:
    "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
  openGraph: {
    title: "Source.io: AI study workspace for any content",
    description:
      "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
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
    title: "Source.io: AI study workspace for any content",
    description:
      "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Fira+Code:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <SWUnregister />
      </body>
    </html>
  );
}