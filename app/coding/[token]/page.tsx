import type { Metadata } from "next";
import { getBackendWebSocketUrl } from "@/lib/backend";
import { CodingInterviewPage } from "../../_features/coding-interview/coding-interview-page";

export const metadata: Metadata = {
  title: "Coding interview | HireOnDeck",
  description: "Complete your scheduled coding interview.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: PageProps<"/coding/[token]">) {
  const { token } = await params;
  return <CodingInterviewPage token={token} websocketBaseUrl={getBackendWebSocketUrl()} />;
}
