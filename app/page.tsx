import type { Metadata } from "next";
import { JsonLd } from "./json-ld";
import { HomePage } from "./_features/home/home-page";
import { jobs } from "./_features/home/data";
import { absoluteUrl, siteConfig } from "./seo";

export const metadata: Metadata = {
  title: "Find Software, Full Stack, Remote and Startup Jobs in India",
  description:
    "Browse verified software engineering, full-stack, backend, frontend, remote and startup jobs across Bangalore, Noida, Pune, Mumbai, Gurgaon, Chennai and more.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Find Software, Full Stack, Remote and Startup Jobs in India",
    description:
      "Browse verified developer and startup jobs across India, filter by location, work mode, job type and experience, then apply with your candidate profile.",
  },
  twitter: {
    title: "Find Software and Remote Jobs in India",
    description:
      "Explore developer, full-stack, backend, frontend, startup and remote jobs on HireOnDeck.",
  },
};

export default function Page() {
  const featuredJobs = jobs.slice(0, 10).map((job, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Thing",
      name: `${job.title} at ${job.company}`,
      description: job.description,
      url: absoluteUrl("/"),
      additionalType: "https://schema.org/JobPosting",
      keywords: job.tags.join(", "),
    },
  }));

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: absoluteUrl("/logo.png"),
      description: siteConfig.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      inLanguage: "en-IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Featured software jobs in India",
      itemListElement: featuredJobs,
    },
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <HomePage />
    </>
  );
}
