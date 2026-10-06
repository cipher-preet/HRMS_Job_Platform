export type McqSession = { id: string; status: string; jobTitle: string; totalQuestions: number; batchSize: number; remainingSeconds: number };
export type McqQuestion = { id: string; sequence: number; question: string; options: Record<string, string>; selectedOptionKey?: string | null };
type Envelope<T> = { success: boolean; message: string; data?: T };

async function request<T>(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`/api/mcq-interviews/${path}`, { ...init, cache: "no-store", headers: { Accept: "application/json", "Content-Type": "application/json", "x-mcq-invite-token": token, ...init?.headers } });
  const result = await response.json() as Envelope<T>;
  if (!response.ok || !result.success || result.data === undefined) throw new Error(result.message || "Unable to continue the MCQ interview");
  return result.data;
}

export const acceptMcqInvite = (token: string) => request<{ session: McqSession }>(`invites/${encodeURIComponent(token)}/accept`, token, { method: "POST", body: JSON.stringify({ acceptedTerms: true }) });
export const getMcqQuestions = (sessionId: string, token: string, batchSize: number) => request<{ questions: McqQuestion[]; remainingSeconds: number; generatedCount: number; totalQuestions: number }>(`sessions/${encodeURIComponent(sessionId)}/questions`, token, { method: "POST", body: JSON.stringify({ batchSize }) });
export const saveMcqAnswers = (sessionId: string, token: string, answers: Array<{ questionId: string; selectedOptionKey: string }>) => request<{ saved: number; totalAnswered: number; remainingSeconds: number }>(`sessions/${encodeURIComponent(sessionId)}/answers`, token, { method: "POST", body: JSON.stringify({ answers }) });
export const submitMcqInterview = (sessionId: string, token: string) => request<McqSession>(`sessions/${encodeURIComponent(sessionId)}/submit`, token, { method: "POST" });
