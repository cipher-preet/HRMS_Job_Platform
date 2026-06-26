import type { MetadataRoute } from "next";
import { absoluteUrl } from "./seo";

const lastModified = new Date("2026-06-26");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/profile"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
