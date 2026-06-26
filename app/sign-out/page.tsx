import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Signing Out",
  description: "Sign out of your HireOnDeck candidate workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignOutPage() {
  redirect("/profile");
}
