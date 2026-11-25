import type { MetadataRoute } from "next";
import { DEMO_SAMPLES } from "@/features/demo/demoData";
import { SITE_URL } from "@/lib/site";
import { USE_CASES } from "@/features/seo/useCases";
import { ALTERNATIVE_PAGES } from "@/features/seo/alternatives";
import { CHANGELOG_UPDATED } from "@/features/seo/changelog";

/** Latest of a list of ISO dates, so index pages change when any child page does. */
const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a));

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = SITE_URL;

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/vs-notebooklm`,
      lastModified: new Date("2026-10-22"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date("2026-10-18"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/demo`,
      lastModified: new Date("2026-11-26"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...DEMO_SAMPLES.map((s) => ({
      url: `${siteUrl}/demo/${s.slug}`,
      lastModified: new Date("2026-11-26"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/use-cases`,
      lastModified: new Date(latest(USE_CASES.map((u) => u.updated))),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...USE_CASES.map((u) => ({
      url: `${siteUrl}/use-cases/${u.slug}`,
      lastModified: new Date(u.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/alternatives`,
      lastModified: new Date(latest(ALTERNATIVE_PAGES.map((a) => a.updated))),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...ALTERNATIVE_PAGES.map((a) => ({
      url: `${siteUrl}${a.path}`,
      lastModified: new Date(a.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/changelog`,
      lastModified: new Date(CHANGELOG_UPDATED),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-11-26"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date("2026-11-26"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/refunds`,
      lastModified: new Date("2026-11-26"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/pricing.md`,
      lastModified: new Date("2026-10-15"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: new Date("2026-10-15"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/llms-full.txt`,
      lastModified: new Date("2026-10-15"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
