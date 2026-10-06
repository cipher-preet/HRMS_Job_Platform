"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiBriefcase, FiCalendar, FiClock, FiCode, FiExternalLink, FiList, FiLogIn } from "react-icons/fi";
import { DashboardFooter } from "../_components/dashboard-footer";
import { DashboardHeader } from "../_components/dashboard-header";
import { useGetCandidateInterviewsQuery, useGetCandidateSessionQuery, type CandidateInterview } from "../_redux/api/AuthApi";

export default function InterviewsPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [now, setNow] = useState<number | null>(null);
  const { data: session, isLoading: sessionLoading } = useGetCandidateSessionQuery();
  const signedIn = Boolean(session?.success && session.data?.candidate);
  const { data, isLoading, isError, refetch } = useGetCandidateInterviewsQuery(undefined, { skip: !signedIn, refetchOnMountOrArgChange: true });
  const interviews = useMemo(() => data?.data?.interviews ?? [], [data]);
  const interviewsByDate = useMemo(() => groupByLocalDate(interviews), [interviews]);
  const upcoming = useMemo(() => interviews.filter((item) => now === null || interviewEnd(item).getTime() >= now).sort(bySchedule), [interviews, now]);
  const upcomingByCompany = useMemo(() => groupByCompany(upcoming), [upcoming]);
  const days = calendarDays(visibleMonth);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#eef2f8] text-slate-700">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-[1440px] px-3 py-6 sm:px-6 sm:py-9">
        <div className="rounded-2xl bg-[#0b0d12] px-5 py-7 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Candidate workspace</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Interviews</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">See every scheduled assessment in one place and join during the time selected by the interviewer.</p>
        </div>

        {sessionLoading ? <InterviewsSkeleton /> : !signedIn ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <FiLogIn className="mx-auto h-8 w-8 text-blue-600" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-slate-950">Sign in to view your interviews</h2>
            <p className="mt-2 text-sm text-slate-500">Your calendar is private and linked to your candidate account.</p>
            <Link className="mt-5 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500" href="/profile">Sign in</Link>
          </section>
        ) : isLoading ? <InterviewsSkeleton /> : isError ? (
          <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-900">Could not load interviews</h2><button className="mt-3 h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white" onClick={() => void refetch()} type="button">Try again</button></section>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
                <button aria-label="Previous month" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} type="button"><FiArrowLeft aria-hidden /></button>
                <h2 className="text-lg font-bold text-slate-950">{visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
                <button aria-label="Next month" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} type="button"><FiArrowRight aria-hidden /></button>
              </div>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div className="py-3" key={day}>{day}</div>)}</div>
              <div className="grid grid-cols-7">{days.map((day) => {
                const dayInterviews = interviewsByDate.get(dateKey(day)) ?? [];
                const inMonth = day.getMonth() === visibleMonth.getMonth();
                const today = dateKey(day) === dateKey(new Date());
                return <div className={`min-h-24 border-b border-r border-slate-100 p-1.5 sm:min-h-28 sm:p-2 ${inMonth ? "bg-white" : "bg-slate-50/70 text-slate-400"}`} key={day.toISOString()}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${today ? "bg-blue-600 text-white" : ""}`}>{day.getDate()}</span><div className="mt-1 space-y-1">{dayInterviews.slice(0, 2).map((interview) => <InterviewPill interview={interview} key={interview.id} />)}{dayInterviews.length > 2 ? <p className="text-[10px] font-semibold text-slate-500">+{dayInterviews.length - 2} more</p> : null}</div></div>;
              })}</div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:self-start">
              <div className="flex items-center gap-2"><FiList className="text-blue-600" aria-hidden /><h2 className="font-bold text-slate-950">Upcoming interviews</h2></div>
              {upcoming.length ? <p className="mt-1 text-xs text-slate-500">{upcoming.length} {upcoming.length === 1 ? "interview" : "interviews"} across {upcomingByCompany.length} {upcomingByCompany.length === 1 ? "company" : "companies"}</p> : null}
              <div className="mt-4 space-y-5">{upcoming.length ? upcomingByCompany.map(([companyName, companyInterviews]) => <section key={companyName}><div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2"><h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900"><FiBriefcase className="shrink-0 text-blue-600" aria-hidden /><span className="break-words">{companyName}</span></h3><span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">{companyInterviews.length}</span></div><div className="space-y-3">{companyInterviews.map((interview) => <InterviewCard interview={interview} key={interview.id} now={now} />)}</div></section>) : <div className="rounded-xl bg-slate-50 p-6 text-center"><FiCalendar className="mx-auto h-7 w-7 text-slate-400" aria-hidden /><p className="mt-3 text-sm font-semibold text-slate-700">No upcoming interviews</p><p className="mt-1 text-xs leading-5 text-slate-500">New schedules will appear here automatically.</p></div>}</div>
            </aside>
          </div>
        )}
      </main>
      <DashboardFooter />
    </div>
  );
}

function InterviewPill({ interview }: { interview: CandidateInterview }) {
  const companyName = displayCompanyName(interview.companyName);
  const interviewType = interview.mode === "coding" ? "Coding" : "MCQ";
  return <div className={`truncate rounded px-1.5 py-1 text-[10px] font-bold ${interview.mode === "coding" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`} title={`${companyName} · ${interview.jobTitle} · ${interviewType}`}>{new Date(interview.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {companyName}</div>;
}

function InterviewCard({ interview, now }: { interview: CandidateInterview; now: number | null }) {
  const start = new Date(interview.scheduledAt);
  const end = interviewEnd(interview);
  const currentTime = now ?? 0;
  const companyName = displayCompanyName(interview.companyName);
  const canJoin = Boolean(interview.meetingLink) && currentTime >= start.getTime() - 30 * 60_000 && currentTime < end.getTime();
  const finished = now !== null && currentTime >= end.getTime();
  return <article className="rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${interview.mode === "coding" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>{interview.mode === "coding" ? <FiCode aria-hidden /> : <FiList aria-hidden />}</span><div className="min-w-0"><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><FiBriefcase className="shrink-0" aria-hidden /><span className="break-words">{companyName}</span></p><h4 className="mt-1 break-words font-bold text-slate-950">{interview.jobTitle}</h4><p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{interview.mode === "coding" ? "Coding round" : "MCQ interview"}</p></div></div><div className="mt-3 flex items-center gap-2 text-xs text-slate-600"><FiCalendar aria-hidden />{start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div><div className="mt-2 flex items-center gap-2 text-xs text-slate-600"><FiClock aria-hidden />{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {interview.durationMinutes} min</div>{canJoin ? <a className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" href={interview.meetingLink!}>Check system / join <FiExternalLink aria-hidden /></a> : <p className={`mt-4 rounded-lg px-3 py-2 text-center text-xs font-semibold ${finished ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{finished ? "Interview window ended" : interview.meetingLink ? "System check opens 30 minutes before start" : "Use the invitation link sent by the interviewer"}</p>}</article>;
}

function InterviewsSkeleton() { return <div className="mt-5 grid animate-pulse gap-5 xl:grid-cols-[1fr_380px]"><div className="h-[520px] rounded-2xl bg-white" /><div className="h-80 rounded-2xl bg-white" /></div>; }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, value: number) { return new Date(date.getFullYear(), date.getMonth() + value, 1); }
function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function calendarDays(month: Date) { const first = startOfMonth(month); const start = new Date(first); start.setDate(first.getDate() - first.getDay()); return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }
function groupByLocalDate(interviews: CandidateInterview[]) { const map = new Map<string, CandidateInterview[]>(); for (const interview of interviews) { const key = dateKey(new Date(interview.scheduledAt)); map.set(key, [...(map.get(key) ?? []), interview]); } return map; }
function interviewEnd(interview: CandidateInterview) { return new Date(new Date(interview.scheduledAt).getTime() + interview.durationMinutes * 60_000); }
function bySchedule(a: CandidateInterview, b: CandidateInterview) { return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(); }
function displayCompanyName(companyName: string | null) { return companyName?.trim() || "Hiring company"; }
function groupByCompany(interviews: CandidateInterview[]) { const groups = new Map<string, CandidateInterview[]>(); for (const interview of interviews) { const companyName = displayCompanyName(interview.companyName); groups.set(companyName, [...(groups.get(companyName) ?? []), interview]); } return Array.from(groups.entries()); }
