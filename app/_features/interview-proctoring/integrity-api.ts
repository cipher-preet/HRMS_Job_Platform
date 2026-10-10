type InterviewType = "mcq" | "coding";
type Envelope<T> = { success: boolean; message: string; data?: T };

export type IntegrityStatus = {
  state: "agent_missing" | "awaiting_pairing" | "agent_disconnected" | "ready" | "blocked";
  ready: boolean;
  platform?: string | null;
  agentVersion?: string | null;
  lastHeartbeatAt?: string | null;
  reasons?: string[];
  violationCount: number;
};

const headers = (interviewType: InterviewType, token: string) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  [interviewType === "mcq" ? "x-mcq-invite-token" : "x-coding-invite-token"]: token,
});

async function request<T>(interviewType: InterviewType, sessionId: string, token: string, suffix: string, init?: RequestInit) {
  const response = await fetch(`/api/interview-integrity/${interviewType}/sessions/${encodeURIComponent(sessionId)}/${suffix}`, {
    ...init,
    cache: "no-store",
    headers: { ...headers(interviewType, token), ...init?.headers },
  });
  const result = await response.json() as Envelope<T>;
  if (!response.ok || !result.success || result.data === undefined) throw new Error(result.message || "Integrity service request failed");
  return result.data;
}

export const getIntegrityStatus = (type: InterviewType, sessionId: string, token: string) =>
  request<IntegrityStatus>(type, sessionId, token, "status");

export const createAgentPairing = (type: InterviewType, sessionId: string, token: string) =>
  request<{ pairingToken: string; pairingExpiresAt: string; launchUrl: string }>(type, sessionId, token, "pairing", { method: "POST" });

export const recordBrowserIntegrityEvent = (
  type: InterviewType,
  sessionId: string,
  token: string,
  eventType: string,
  details?: Record<string, unknown>,
) => request<{ recorded: boolean }>(type, sessionId, token, "events", {
  method: "POST",
  body: JSON.stringify({ eventType, severity: "warning", occurredAt: new Date().toISOString(), details }),
});
