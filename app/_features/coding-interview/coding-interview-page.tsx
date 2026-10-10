"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiLoader,
  FiPlay,
  FiSend,
  FiShield,
} from "react-icons/fi";
import {
  acceptCodingInvite,
  finishCodingInterview,
  getCodingProblems,
  runCodingSolution,
  submitCodingSolution,
  type CodingProblem,
  type CodingSession,
} from "./api";
import { InterviewDeviceCheck, InterviewFaceMonitor, InterviewIntegrityChecklist, InterviewSecurityGuard } from "../interview-proctoring/interview-device-check";
import { InterviewAgentGuard } from "../interview-proctoring/interview-agent-guard";

type Phase = "invite" | "loading" | "integrity" | "assessment" | "submitted" | "error";
type Action = "run" | "submit" | "finish" | null;

export function CodingInterviewPage({ token, websocketBaseUrl }: { token: string; websocketBaseUrl: string }) {
  const [phase, setPhase] = useState<Phase>("invite");
  const [session, setSession] = useState<CodingSession | null>(null);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState("");
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>({});
  const [submittedProblems, setSubmittedProblems] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [output, setOutput] = useState("Run your code to see the public test results.");
  const [error, setError] = useState("");
  const [action, setAction] = useState<Action>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [devicesReady, setDevicesReady] = useState(false);
  const autoSubmitStarted = useRef(false);
  const integrityStarting = useRef(false);

  const currentProblem = problems[currentIndex];
  const currentCode = currentProblem ? codeByProblem[currentProblem.id] ?? "" : "";
  const allProblemsSubmitted = problems.length > 0 && submittedProblems.length === problems.length;

  const formattedTime = useMemo(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    return [hours, minutes, seconds]
      .filter((_, index) => hours > 0 || index > 0)
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }, [remainingSeconds]);

  useEffect(() => {
    if (phase !== "assessment" || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, remainingSeconds]);

  useEffect(() => {
    if (phase !== "assessment" || remainingSeconds !== 0 || !session || autoSubmitStarted.current) return;
    autoSubmitStarted.current = true;
    setAction("finish");
    void finishCodingInterview(session.id, token)
      .then(() => setPhase("submitted"))
      .catch((caught) => {
        setError(getErrorMessage(caught));
        setPhase("error");
      })
      .finally(() => setAction(null));
  }, [phase, remainingSeconds, session, token]);

  async function handleStart() {
    if (!termsAccepted || !devicesReady) return;
    setPhase("loading");
    setError("");
    try {
      const accepted = await acceptCodingInvite(token);
      const activeSession = accepted.session;
      setSession(activeSession);
      setRemainingSeconds(activeSession.remainingSeconds);
      setPhase("integrity");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setPhase("error");
    }
  }

  async function beginAfterIntegrity() {
    if (!session || integrityStarting.current) return;
    integrityStarting.current = true;
    try {
      const problemData = await getCodingProblems(session.id, token);
      const firstLanguage = session.allowedLanguages[0] ?? "javascript";
      setProblems(problemData.problems);
      setLanguage(firstLanguage);
      setCodeByProblem(Object.fromEntries(problemData.problems.map((problem) => [problem.id, starterCodeFor(problem, firstLanguage)])));
      setRemainingSeconds(problemData.remainingSeconds);
      setPhase("assessment");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setPhase("error");
    } finally {
      integrityStarting.current = false;
    }
  }

  function changeLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    setCodeByProblem((current) => {
      const next = { ...current };
      for (const problem of problems) {
        const previousStarter = starterCodeFor(problem, language);
        if (!next[problem.id] || next[problem.id] === previousStarter) {
          next[problem.id] = starterCodeFor(problem, nextLanguage);
        }
      }
      return next;
    });
  }

  async function handleRun() {
    if (!session || !currentProblem || !currentCode.trim()) return;
    setAction("run");
    setOutput("Running against public test cases…");
    try {
      const result = await runCodingSolution(
        session.id,
        currentProblem.id,
        token,
        language,
        currentCode,
      );
      const nextRemaining = Number(result.remainingSeconds);
      if (Number.isFinite(nextRemaining)) setRemainingSeconds(nextRemaining);
      setOutput(formatRunResult(result));
    } catch (caught) {
      setOutput(`Run failed\n\n${getErrorMessage(caught)}`);
    } finally {
      setAction(null);
    }
  }

  async function handleProblemSubmit() {
    if (!session || !currentProblem || !currentCode.trim()) return;
    setAction("submit");
    try {
      const result = await submitCodingSolution(
        session.id,
        currentProblem.id,
        token,
        language,
        currentCode,
      );
      setRemainingSeconds(result.remainingSeconds);
      setSubmittedProblems((current) =>
        current.includes(currentProblem.id) ? current : [...current, currentProblem.id],
      );
      setOutput("Solution saved for final evaluation.");
      if (currentIndex < problems.length - 1) setCurrentIndex(currentIndex + 1);
    } catch (caught) {
      setOutput(`Submission failed\n\n${getErrorMessage(caught)}`);
    } finally {
      setAction(null);
    }
  }

  async function handleFinish(automatic = false) {
    if (!session || action) return;
    if (!automatic && !window.confirm("Finish and submit this coding interview? You cannot edit it afterward.")) return;
    setAction("finish");
    try {
      await finishCodingInterview(session.id, token);
      setPhase("submitted");
    } catch (caught) {
      setError(getErrorMessage(caught));
      if (automatic) setPhase("error");
    } finally {
      setAction(null);
    }
  }

  if (phase === "invite" || phase === "loading" || phase === "error") {
    return (
      <InterviewGate
        error={error}
        loading={phase === "loading"}
        onStart={handleStart}
        onTryAgain={() => setPhase("invite")}
        termsAccepted={termsAccepted}
        setTermsAccepted={setTermsAccepted}
        devicesReady={devicesReady}
        setDevicesReady={setDevicesReady}
      />
    );
  }

  if (phase === "integrity" && session) {
    return <InterviewAgentGuard interviewType="coding" sessionId={session.id} token={token} onReady={() => void beginAfterIntegrity()} />;
  }

  if (phase === "submitted") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef2f8] px-4 py-10 text-slate-800">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <FiCheckCircle className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-slate-950">Coding interview submitted</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Your solutions have been sent for evaluation. The hiring team will contact you about the next step.
          </p>
          <p className="mt-6 text-sm font-semibold text-slate-500">You can safely close this window.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#eef2f8] text-slate-800">
      {session ? <InterviewAgentGuard interviewType="coding" sessionId={session.id} token={token} /> : null}
      {session ? <InterviewSecurityGuard interviewType="coding" sessionId={session.id} token={token} /> : null}
      {session ? <InterviewFaceMonitor interviewType="coding" sessionId={session.id} token={token} websocketBaseUrl={websocketBaseUrl} /> : null}
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0b0d12] px-4 py-3 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white p-1">
            <Image alt="HireOnDeck" height={36} priority src="/logo.png" width={36} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold sm:text-base">{session?.jobTitle}</p>
            <p className="text-xs text-slate-400">Coding interview</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold tabular-nums ${remainingSeconds < 300 ? "bg-rose-500/15 text-rose-300" : "bg-white/10 text-white"}`}>
            <FiClock aria-hidden /> {formattedTime}
          </span>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={action !== null}
            onClick={() => void handleFinish()}
            type="button"
          >
            {action === "finish" ? <FiLoader className="animate-spin" aria-hidden /> : <FiSend aria-hidden />}
            <span className="hidden sm:inline">Finish interview</span>
            <span className="sm:hidden">Finish</span>
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-3 p-3 lg:grid-cols-[minmax(320px,42%)_1fr] lg:overflow-hidden">
        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-88px)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Problem {currentIndex + 1} of {problems.length}</p>
              <h1 className="mt-1 text-xl font-bold text-slate-950">{currentProblem.title}</h1>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
              {currentProblem.difficulty}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <p className="whitespace-pre-wrap leading-7 text-slate-700">{currentProblem.description}</p>
            {currentProblem.constraints ? (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-950">Constraints</h2>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-700">{currentProblem.constraints}</pre>
              </div>
            ) : null}
            {currentProblem.publicTestCases?.length ? (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-950">Public examples</h2>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200">{JSON.stringify(currentProblem.publicTestCases, null, 2)}</pre>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 p-4">
            <button aria-label="Previous problem" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-35" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)} type="button"><FiArrowLeft aria-hidden /></button>
            <div className="flex gap-2" aria-label="Problem progress">
              {problems.map((problem, index) => (
                <button key={problem.id} aria-label={`Open problem ${index + 1}`} className={`grid h-9 min-w-9 place-items-center rounded-lg text-xs font-bold ${index === currentIndex ? "bg-blue-600 text-white" : submittedProblems.includes(problem.id) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`} onClick={() => setCurrentIndex(index)} type="button">{submittedProblems.includes(problem.id) ? <FiCheck aria-hidden /> : index + 1}</button>
              ))}
            </div>
            <button aria-label="Next problem" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-35" disabled={currentIndex === problems.length - 1} onClick={() => setCurrentIndex((index) => index + 1)} type="button"><FiArrowRight aria-hidden /></button>
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-88px)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 font-bold text-slate-950"><FiCode className="text-blue-600" aria-hidden /> Code editor</div>
            <select aria-label="Programming language" className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onChange={(event) => changeLanguage(event.target.value)} value={language}>
              {session?.allowedLanguages.map((item) => <option key={item} value={item}>{languageLabel(item)}</option>)}
            </select>
          </div>
          <textarea
            aria-label="Source code"
            className="min-h-[360px] flex-[3] resize-none bg-[#111827] p-5 font-mono text-[14px] leading-6 text-slate-100 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onChange={(event) => setCodeByProblem((current) => ({ ...current, [currentProblem.id]: event.target.value }))}
            spellCheck={false}
            value={currentCode}
          />
          <div className="flex min-h-[190px] flex-1 flex-col border-t border-slate-700 bg-[#0b1120]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <span className="text-sm font-bold text-white">Console</span>
              <div className="flex gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50" disabled={action !== null || !currentCode.trim()} onClick={() => void handleRun()} type="button">{action === "run" ? <FiLoader className="animate-spin" aria-hidden /> : <FiPlay aria-hidden />} Run</button>
                <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50" disabled={action !== null || !currentCode.trim()} onClick={() => void handleProblemSubmit()} type="button">{action === "submit" ? <FiLoader className="animate-spin" aria-hidden /> : <FiCheck aria-hidden />} {submittedProblems.includes(currentProblem.id) ? "Update solution" : "Submit solution"}</button>
              </div>
            </div>
            <pre aria-live="polite" className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-slate-300">{output}</pre>
          </div>
          {allProblemsSubmitted ? <p className="border-t border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-emerald-700">All solutions are saved. Use “Finish interview” when you are ready.</p> : null}
        </section>
      </div>
    </main>
  );
}

function InterviewGate({ error, loading, onStart, onTryAgain, termsAccepted, setTermsAccepted, devicesReady, setDevicesReady }: { error: string; loading: boolean; onStart: () => void; onTryAgain: () => void; termsAccepted: boolean; setTermsAccepted: (checked: boolean) => void; devicesReady: boolean; setDevicesReady: (ready: boolean) => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef2f8] px-4 py-10 text-slate-800">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-[#0b0d12] px-6 py-8 text-white sm:px-10">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1"><Image alt="HireOnDeck" height={40} priority src="/logo.png" width={40} /></span><span className="font-bold">HireOnDeck</span></div>
          <div className="mt-8 flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600"><FiCode className="h-6 w-6" aria-hidden /></span><div><p className="text-sm font-semibold text-blue-300">Candidate assessment</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Scheduled coding interview</h1></div></div>
        </div>
        <div className="p-6 sm:p-10">
          {error ? (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><div className="flex gap-3"><FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden /><div><h2 className="font-bold text-rose-900">Unable to join</h2><p className="mt-1 text-sm leading-6 text-rose-700">{error}</p></div></div><button className="mt-5 h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white" onClick={onTryAgain} type="button">Try again</button></div>
          ) : (
            <>
              <p className="leading-7 text-slate-600">This secure link is assigned to one scheduled candidate. Access will open only during the time configured by the hiring organization.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2"><GateItem icon={<FiClock />} text="A server-controlled timer starts when you join." /><GateItem icon={<FiShield />} text="Do not refresh or share this private interview link." /></div>
              <InterviewIntegrityChecklist />
              <InterviewDeviceCheck onReadyChange={setDevicesReady} />
              <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><input checked={termsAccepted} className="mt-1 h-5 w-5 accent-blue-600" onChange={(event) => setTermsAccepted(event.target.checked)} type="checkbox" /><span className="text-sm leading-6 text-slate-700">I confirm that I am the invited candidate and will complete this assessment independently.</span></label>
              <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={!termsAccepted || !devicesReady || loading} onClick={onStart} type="button">{loading ? <><FiLoader className="animate-spin" aria-hidden /> Verifying schedule…</> : <>Join coding round <FiArrowRight aria-hidden /></>}</button>
              {!devicesReady ? <p className="mt-2 text-center text-xs text-slate-500">Complete the camera and microphone check to enable joining.</p> : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function GateItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><span className="mt-0.5 text-blue-600" aria-hidden>{icon}</span><p className="text-sm leading-6 text-slate-600">{text}</p></div>;
}

function starterCodeFor(problem: CodingProblem, language: string) {
  const starters = problem.starterCode ?? {};
  return starters[language] ?? starters[language.toLowerCase()] ?? Object.values(starters)[0] ?? "// Write your solution here\n";
}

function languageLabel(language: string) {
  const labels: Record<string, string> = { cpp: "C++", c: "C", javascript: "JavaScript", java: "Java", python: "Python", python3: "Python 3", go: "Go", golang: "Go", ruby: "Ruby", r: "R" };
  return labels[language.toLowerCase()] ?? language;
}

function formatRunResult(result: Record<string, unknown>) {
  const visibleResult = { ...result };
  delete visibleResult.remainingSeconds;
  return JSON.stringify(visibleResult, null, 2);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to continue the coding interview";
}
