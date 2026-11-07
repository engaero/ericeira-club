import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ericeira-club.vercel.app";
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/become-a-partner`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
