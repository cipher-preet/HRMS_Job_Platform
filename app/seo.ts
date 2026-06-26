import type { Metadata } from "next";

export const siteConfig = {
  name: "HireOnDeck",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hireondeck.com",
  description:
    "Find software engineering, full-stack, backend, frontend, remote and startup jobs across India with HireOnDeck.",
  ogImage: "/logo.png",
};

export const seoKeywords = [
  "jobs in India",
  "software engineering jobs",
  "full stack developer jobs",
  "frontend developer jobs",
  "backend developer jobs",
  "remote jobs India",
  "startup jobs India",
  "IT jobs in Bangalore",
  "IT jobs in Noida",
  "developer jobs in Pune",
  "React jobs",
  "Node.js jobs",
  "candidate profile",
  "upload resume",
  "job portal India",
  "HireOnDeck jobs",
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | Software Jobs, Remote Jobs and Startup Hiring in India`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: seoKeywords,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Software Jobs, Remote Jobs and Startup Hiring in India`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 512,
        height: 512,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${siteConfig.name} | Find Jobs in India`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "jobs",
};
