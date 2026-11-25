import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PRIVATE = ["/app", "/api/", "/auth"];

// Search engines, link previews and AI search crawlers (which ground live answers with citations).
const SEARCH_AGENTS = [
  "Googlebot",
  "Bingbot",
  "Twitterbot",
  "facebookexternalhit",
  "OAI-SearchBot",
  "PerplexityBot",
  "Claude-SearchBot",
];

// Bulk model-training crawlers: opted out, while search discovery above stays allowed.
const TRAINING_AGENTS = ["GPTBot", "ClaudeBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...SEARCH_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
      ...TRAINING_AGENTS.map((userAgent) => ({ userAgent, disallow: "/" })),
      {
        // The signed-in app is private; public sample documents live at /demo, not under /app.
        userAgent: "*",
        allow: ["/", "/demo", "/pricing.md", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/app", "/app/settings", "/auth"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
