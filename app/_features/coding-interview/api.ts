export type CodingSession = {
  id: string;
  status: string;
  applicationId: string;
  jobTitle: string;
  totalProblems: number;
  allowedLanguages: string[];
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  remainingSeconds: number;
};

export type CodingProblem = {
  id: string;
  sequence: number;
  title: string;
  description: string;
  difficulty: string;
  functionName?: string | null;
  constraints?: string | null;
  starterCode?: Record<string, string>;
  publicTestCases?: unknown[];
  maxScore: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/coding-interviews/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-coding-invite-token": token,
      ...init?.headers,
    },
  });
  const result = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message || "Unable to continue the coding interview");
  }

  return result.data;
}

export function acceptCodingInvite(token: string) {
  return request<{ session: CodingSession }>(`invites/${encodeURIComponent(token)}/accept`, token, {
    method: "POST",
    body: JSON.stringify({ acceptedTerms: true }),
  });
}

export function getCodingProblems(sessionId: string, token: string) {
  return request<{ problems: CodingProblem[]; remainingSeconds: number }>(
    `sessions/${encodeURIComponent(sessionId)}/problems`,
    token,
  );
}

export function runCodingSolution(
  sessionId: string,
  problemId: string,
  token: string,
  language: string,
  sourceCode: string,
) {
  return request<Record<string, unknown>>(
    `sessions/${encodeURIComponent(sessionId)}/problems/${encodeURIComponent(problemId)}/run`,
    token,
    { method: "POST", body: JSON.stringify({ language, sourceCode }) },
  );
}

export function submitCodingSolution(
  sessionId: string,
  problemId: string,
  token: string,
  language: string,
  sourceCode: string,
) {
  return request<{ submissionId: string; status: string; remainingSeconds: number }>(
    `sessions/${encodeURIComponent(sessionId)}/problems/${encodeURIComponent(problemId)}/submit`,
    token,
    { method: "POST", body: JSON.stringify({ language, sourceCode }) },
  );
}

export function finishCodingInterview(sessionId: string, token: string) {
  return request<CodingSession>(`sessions/${encodeURIComponent(sessionId)}/submit`, token, {
    method: "POST",
  });
}
