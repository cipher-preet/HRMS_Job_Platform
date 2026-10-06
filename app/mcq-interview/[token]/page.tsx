import type { Metadata } from "next";
import { getBackendWebSocketUrl } from "@/lib/backend";
import { McqInterviewPage } from "../../_features/mcq-interview/mcq-interview-page";

export const metadata: Metadata = { title: "MCQ interview | HireOnDeck", description: "Complete your scheduled MCQ interview.", robots: { index: false, follow: false } };

export default async function Page({ params }: PageProps<"/mcq-interview/[token]">) {
  const { token } = await params;
  return <McqInterviewPage token={token} websocketBaseUrl={getBackendWebSocketUrl()} />;
}
