"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiArrowLeft, FiArrowRight, FiCheckCircle, FiClock, FiFileText, FiLoader, FiSend, FiShield } from "react-icons/fi";
import { acceptMcqInvite, getMcqQuestions, saveMcqAnswers, submitMcqInterview, type McqQuestion, type McqSession } from "./api";
import { InterviewDeviceCheck, InterviewFaceMonitor } from "../interview-proctoring/interview-device-check";

type Phase = "invite" | "loading" | "test" | "submitted" | "error";

export function McqInterviewPage({ token, websocketBaseUrl }: { token: string; websocketBaseUrl: string }) {
  const [phase, setPhase] = useState<Phase>("invite");
  const [accepted, setAccepted] = useState(false);
  const [session, setSession] = useState<McqSession | null>(null);
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devicesReady, setDevicesReady] = useState(false);
  const autoSubmitted = useRef(false);
  const current = questions[index];
  const answeredCount = Object.keys(answers).length;
  const allGenerated = Boolean(session && questions.length >= session.totalQuestions);
  const time = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);

  useEffect(() => { if (phase !== "test" || seconds <= 0) return; const timer = window.setTimeout(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => window.clearTimeout(timer); }, [phase, seconds]);
  useEffect(() => {
    if (phase !== "test" || seconds !== 0 || !session || autoSubmitted.current) return;
    autoSubmitted.current = true;
    setBusy(true);
    void submitMcqInterview(session.id, token)
      .then(() => setPhase("submitted"))
      .catch((caught) => { setError(message(caught)); setPhase("error"); })
      .finally(() => setBusy(false));
  }, [phase, seconds, session, token]);

  async function start() {
    if (!accepted || !devicesReady) return;
    setPhase("loading"); setError("");
    try {
      const { session: nextSession } = await acceptMcqInvite(token);
      const batch = await getMcqQuestions(nextSession.id, token, nextSession.batchSize);
      setSession(nextSession); setQuestions(batch.questions); setSeconds(batch.remainingSeconds); setPhase("test");
    } catch (caught) { setError(message(caught)); setPhase("error"); }
  }

  async function selectAnswer(option: string) {
    if (!session || !current || busy) return;
    const previous = answers[current.id];
    setAnswers((value) => ({ ...value, [current.id]: option }));
    setBusy(true);
    try { const result = await saveMcqAnswers(session.id, token, [{ questionId: current.id, selectedOptionKey: option }]); setSeconds(result.remainingSeconds); }
    catch (caught) { setAnswers((value) => { const nextAnswers = { ...value }; if (previous) nextAnswers[current.id] = previous; else delete nextAnswers[current.id]; return nextAnswers; }); setError(message(caught)); }
    finally { setBusy(false); }
  }

  async function next() {
    if (!session) return;
    if (index < questions.length - 1) { setIndex(index + 1); return; }
    if (!allGenerated) {
      setBusy(true);
      try { const batch = await getMcqQuestions(session.id, token, session.batchSize); const merged = mergeQuestions(questions, batch.questions); setQuestions(merged); setSeconds(batch.remainingSeconds); if (merged.length > index + 1) setIndex(index + 1); }
      catch (caught) { setError(message(caught)); }
      finally { setBusy(false); }
    }
  }

  async function finish(automatic = false) {
    if (!session || busy) return;
    if (!automatic && !window.confirm(`Submit this interview with ${answeredCount} of ${session.totalQuestions} questions answered?`)) return;
    setBusy(true);
    try { await submitMcqInterview(session.id, token); setPhase("submitted"); }
    catch (caught) { setError(message(caught)); if (automatic) setPhase("error"); }
    finally { setBusy(false); }
  }

  if (phase === "invite" || phase === "loading" || phase === "error") return <McqGate accepted={accepted} devicesReady={devicesReady} error={error} loading={phase === "loading"} onAccepted={setAccepted} onDevicesReady={setDevicesReady} onStart={start} onTryAgain={() => { setError(""); setPhase("invite"); }} />;
  if (phase === "submitted") return <main className="grid min-h-screen place-items-center bg-[#eef2f8] p-4"><section className="max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl"><FiCheckCircle className="mx-auto h-16 w-16 text-emerald-600" aria-hidden /><h1 className="mt-5 text-2xl font-bold text-slate-950">MCQ interview submitted</h1><p className="mt-3 leading-7 text-slate-600">Your answers were saved and sent for evaluation. You can safely close this window.</p></section></main>;

  return <main className="min-h-screen bg-[#eef2f8] text-slate-800">
    {session ? <InterviewFaceMonitor interviewType="mcq" sessionId={session.id} token={token} websocketBaseUrl={websocketBaseUrl} /> : null}
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 bg-[#0b0d12] px-4 py-3 text-white sm:px-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white p-1"><Image alt="HireOnDeck" height={36} priority src="/logo.png" width={36} /></span><div><p className="font-bold">{session?.jobTitle}</p><p className="text-xs text-slate-400">MCQ interview</p></div></div><div className="flex items-center gap-2"><span className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold tabular-nums ${seconds < 300 ? "bg-rose-500/15 text-rose-300" : "bg-white/10"}`}><FiClock aria-hidden />{time}</span><button className="inline-flex h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50" disabled={busy} onClick={() => void finish()} type="button"><FiSend aria-hidden />Submit</button></div></header>
    <div className="mx-auto grid w-full max-w-[1280px] gap-5 p-3 sm:p-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:self-start"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress</p><p className="mt-2 text-2xl font-bold text-slate-950">{answeredCount}/{session?.totalQuestions}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${session ? answeredCount / session.totalQuestions * 100 : 0}%` }} /></div><div className="mt-5 grid grid-cols-5 gap-2">{Array.from({ length: session?.totalQuestions ?? 0 }, (_, itemIndex) => <button aria-label={`Question ${itemIndex + 1}`} className={`grid h-10 place-items-center rounded-lg text-xs font-bold ${itemIndex === index ? "bg-blue-600 text-white" : questions[itemIndex] && answers[questions[itemIndex].id] ? "bg-emerald-100 text-emerald-700" : questions[itemIndex] ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-300"}`} disabled={!questions[itemIndex]} key={itemIndex} onClick={() => setIndex(itemIndex)} type="button">{itemIndex + 1}</button>)}</div></aside>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Question {index + 1} of {session?.totalQuestions}</p><h1 className="mt-4 text-xl font-bold leading-8 text-slate-950 sm:text-2xl">{current?.question}</h1><fieldset className="mt-7 space-y-3" disabled={busy}><legend className="sr-only">Choose one answer</legend>{Object.entries(current?.options ?? {}).map(([key, value]) => <label className={`flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${answers[current.id] === key ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`} key={key}><input checked={answers[current.id] === key} className="h-5 w-5 accent-blue-600" name={current.id} onChange={() => void selectAnswer(key)} type="radio" /><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-slate-700 ring-1 ring-slate-200">{key}</span><span className="text-sm leading-6 text-slate-700 sm:text-base">{value}</span></label>)}</fieldset>{error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<div className="mt-7 flex justify-between"><button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50 disabled:opacity-35" disabled={index === 0 || busy} onClick={() => setIndex(index - 1)} type="button"><FiArrowLeft aria-hidden />Previous</button><button className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50" disabled={busy || (index === questions.length - 1 && allGenerated)} onClick={() => void next()} type="button">{busy ? <FiLoader className="animate-spin" aria-hidden /> : null}{index === questions.length - 1 && !allGenerated ? "Load more" : "Next"}<FiArrowRight aria-hidden /></button></div></section>
    </div>
  </main>;
}

function McqGate({ accepted, devicesReady, error, loading, onAccepted, onDevicesReady, onStart, onTryAgain }: { accepted: boolean; devicesReady: boolean; error: string; loading: boolean; onAccepted: (value: boolean) => void; onDevicesReady: (ready: boolean) => void; onStart: () => void; onTryAgain: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#eef2f8] p-4"><section className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl"><div className="bg-[#0b0d12] p-8 text-white"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1"><Image alt="HireOnDeck" height={40} priority src="/logo.png" width={40} /></span><b>HireOnDeck</b></div><div className="mt-8 flex gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600"><FiFileText aria-hidden /></span><div><p className="text-sm font-semibold text-blue-300">Candidate assessment</p><h1 className="text-3xl font-bold">Scheduled MCQ interview</h1></div></div></div><div className="p-7 sm:p-10">{error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><div className="flex gap-3"><FiAlertCircle className="text-rose-600" aria-hidden /><p className="text-sm leading-6 text-rose-700">{error}</p></div><button className="mt-4 h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white" onClick={onTryAgain} type="button">Try again</button></div> : <><p className="leading-7 text-slate-600">This assessment is available only to the candidate selected by the hiring organization and only during its scheduled window.</p><div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4"><FiShield className="mt-1 shrink-0 text-blue-600" aria-hidden /><p className="text-sm leading-6 text-slate-600">Answers save as you select them. Do not share this private link or leave the assessment unattended.</p></div><InterviewDeviceCheck onReadyChange={onDevicesReady} /><label className="mt-6 flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4"><input checked={accepted} className="mt-1 h-5 w-5 accent-blue-600" onChange={(event) => onAccepted(event.target.checked)} type="checkbox" /><span className="text-sm leading-6">I confirm I am the invited candidate and will complete this assessment independently.</span></label><button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-500 disabled:opacity-50" disabled={!accepted || !devicesReady || loading} onClick={onStart} type="button">{loading ? <><FiLoader className="animate-spin" aria-hidden />Verifying schedule…</> : <>Join MCQ interview <FiArrowRight aria-hidden /></>}</button>{!devicesReady ? <p className="mt-2 text-center text-xs text-slate-500">Complete the camera and microphone check to enable joining.</p> : null}</>}</div></section></main>;
}
function mergeQuestions(current: McqQuestion[], next: McqQuestion[]) { const map = new Map(current.map((question) => [question.id, question])); next.forEach((question) => map.set(question.id, question)); return [...map.values()].sort((a, b) => a.sequence - b.sequence); }
function message(error: unknown) { return error instanceof Error ? error.message : "Unable to continue the MCQ interview"; }
