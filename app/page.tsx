"use client";

import { motion } from "motion/react";
import { LandingPage } from "@/components/landing/LandingPage";

export default function HomePage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://sourceio.app/#organization",
        "name": "Source.io",
        "url": "https://sourceio.app",
        "logo": "https://sourceio.app/favicon.png",
        "description": "Educational AI technology creating grounded, citation-backed study workspaces for students and researchers."
      },
      {
        "@type": "WebSite",
        "@id": "https://sourceio.app/#website",
        "url": "https://sourceio.app",
        "name": "Source.io",
        "publisher": {
          "@id": "https://sourceio.app/#organization"
        }
      },
      {
        "@type": "WebApplication",
        "@id": "https://sourceio.app/#webapp",
        "name": "Source.io",
        "url": "https://sourceio.app",
        "description": "AI study workspace that converts textbooks, lecture recordings, and research papers into verified study notes, flashcards, quizzes, and podcasts with exact source citations.",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All modern web browsers",
        "offers": [
          {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "name": "Free Forever Plan"
          },
          {
            "@type": "Offer",
            "price": "9",
            "priceCurrency": "USD",
            "name": "Scholar Pass"
          }
        ],
        "featureList": [
          "Page and line-level citation proofs",
          "5 coordinated study modes (Notes, Cards, Quiz, Audio, Chat)",
          "KaTeX formula and LaTeX math rendering",
          "Audio podcast recap with synchronized waveforms",
          "3D Leitner spaced repetition flashcards"
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.3 }}
      >
        <LandingPage />
      </motion.div>
    </>
  );
}