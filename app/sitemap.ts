import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sourceio.app";

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
      url: `${siteUrl}/app/doc/demo-quantum`,
      lastModified: new Date("2026-10-19"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/app/doc/demo-linalg`,
      lastModified: new Date("2026-10-19"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/app/doc/demo-networking`,
      lastModified: new Date("2026-10-19"),
      changeFrequency: "weekly",
      priority: 0.8,
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
