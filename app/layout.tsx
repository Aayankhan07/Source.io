import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Source.io: AI study workspace for any content",
  description:
    "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
  openGraph: {
    title: "Source.io: AI study workspace for any content",
    description:
      "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d4536bf5-0950-46b4-a3a9-668a58eecb92",
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Source.io: AI study workspace for any content",
    description:
      "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d4536bf5-0950-46b4-a3a9-668a58eecb92",
    ],
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;0,7..72,700;1,7..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}