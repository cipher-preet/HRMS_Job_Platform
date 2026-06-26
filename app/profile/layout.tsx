import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidate Profile and Resume Upload",
  description:
    "Log in or register on HireOnDeck to manage your candidate profile, upload your resume and apply faster to relevant jobs.",
  alternates: {
    canonical: "/profile",
  },
  openGraph: {
    url: "/profile",
    title: "Candidate Profile and Resume Upload",
    description:
      "Manage your HireOnDeck candidate profile, upload your resume and keep your basic details ready for recruiters.",
  },
  twitter: {
    title: "Candidate Profile and Resume Upload",
    description: "Manage your profile and resume on HireOnDeck.",
  },
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
