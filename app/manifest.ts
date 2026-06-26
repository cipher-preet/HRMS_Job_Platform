import type { MetadataRoute } from "next";
import { siteConfig } from "./seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} Jobs`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
