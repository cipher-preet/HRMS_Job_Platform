"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiCopy, FiDownload, FiLoader, FiLock, FiRefreshCw } from "react-icons/fi";

import { createAgentPairing, getIntegrityStatus, type IntegrityStatus } from "./integrity-api";

type Props = {
  interviewType: "mcq" | "coding";
  sessionId: string;
  token: string;
  onReady?: () => void;
};

const downloadUrls = {
  windows: process.env.NEXT_PUBLIC_INTEGRITY_AGENT_WINDOWS_URL ?? "",
  macos: process.env.NEXT_PUBLIC_INTEGRITY_AGENT_MACOS_URL ?? "",
  linux: process.env.NEXT_PUBLIC_INTEGRITY_AGENT_LINUX_URL ?? "",
};

export function InterviewAgentGuard({ interviewType, sessionId, token, onReady }: Props) {
  const [status, setStatus] = useState<IntegrityStatus | null>(null);
  const [pairing, setPairing] = useState<{ pairingToken: string; launchUrl: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const platform = useMemo(() => detectPlatform(), []);

  const refresh = useCallback(async () => {
    try {
      const next = await getIntegrityStatus(interviewType, sessionId, token);
      setStatus(next);
      setError("");
      if (next.ready) onReady?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify the integrity agent");
    }
  }, [interviewType, onReady, sessionId, token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 4_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function connectAgent() {
    setBusy(true);
    setError("");
    try {
      const next = await createAgentPairing(interviewType, sessionId, token);
      setPairing(next);
      window.location.href = next.launchUrl;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the agent connection");
    } finally {
      setBusy(false);
    }
  }

  if (status?.ready) {
    return status.violationCount ? <div className="fixed left-3 top-32 z-40 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 shadow-lg">Agent violations: {status.violationCount}</div> : null;
  }

  const reasons = status?.reasons ?? [];
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="agent-check-title">
      <section className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><FiLock className="h-6 w-6" aria-hidden /></span>
        <h2 className="mt-5 text-2xl font-bold text-slate-950" id="agent-check-title">Connect the integrity agent</h2>
        <p className="mt-2 leading-6 text-slate-600">The interview remains in this browser. The lightweight agent verifies that prohibited assistance, recording, remote-access, and overlay tools are not active.</p>

        <ol className="mt-5 space-y-3 text-sm text-slate-700">
          <li className="flex gap-3"><b className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100">1</b><span>Download and install the {platformLabel(platform)} agent.</span></li>
          <li className="flex gap-3"><b className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100">2</b><span>Select “Pair and open agent”. If macOS asks, paste the manual pairing link into the agent.</span></li>
          <li className="flex gap-3"><b className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100">3</b><span>Close any application reported by the agent. This screen unlocks automatically.</span></li>
        </ol>

        {reasons.length ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><div className="flex items-center gap-2 font-bold"><FiAlertTriangle aria-hidden /> Security check blocked</div><ul className="mt-2 list-disc space-y-1 pl-5">{reasons.map((reason) => <li key={reason}>{reason.replaceAll("_", " ")}</li>)}</ul></div> : null}
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}
        {pairing ? <div className="mt-4 rounded-xl bg-slate-100 p-3"><p className="text-xs font-semibold text-slate-600">Manual pairing link</p><div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-xs">{pairing.launchUrl}</code><button aria-label="Copy manual pairing link" className="grid h-11 w-11 place-items-center rounded-lg bg-white text-slate-700 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => void navigator.clipboard.writeText(pairing.launchUrl)} type="button"><FiCopy aria-hidden /></button></div></div> : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {downloadUrls[platform] ? <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" href={downloadUrls[platform]}><FiDownload aria-hidden />Download for {platformLabel(platform)}</a> : <div className="flex min-h-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-center text-sm font-semibold text-amber-900">Installer URL not configured</div>}
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" disabled={busy} onClick={() => void connectAgent()} type="button">{busy ? <FiLoader className="animate-spin" aria-hidden /> : <FiLock aria-hidden />}Pair and open agent</button>
        </div>
        <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => void refresh()} type="button"><FiRefreshCw aria-hidden />Check connection again</button>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><FiCheckCircle className="mt-0.5 shrink-0" aria-hidden />The agent sends application names and device security signals. It does not read files, messages, keystrokes, or continuously record the screen.</p>
      </section>
    </div>
  );
}

function detectPlatform(): keyof typeof downloadUrls {
  if (typeof navigator === "undefined") return "windows";
  const value = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (value.includes("mac")) return "macos";
  if (value.includes("linux")) return "linux";
  return "windows";
}

const platformLabel = (value: keyof typeof downloadUrls) => value === "macos" ? "macOS" : value === "linux" ? "Linux" : "Windows";
