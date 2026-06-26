"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiExternalLink,
  FiFilter,
  FiLogIn,
  FiInstagram,
  FiLinkedin,
  FiMapPin,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { DashboardFooter } from "../../_components/dashboard-footer";
import { DashboardHeader } from "../../_components/dashboard-header";
import { useLazyGetCandidateSessionQuery } from "../../_redux/api/AuthApi";
import {
  Job,
  LogoTone,
  useApplyJobMutation,
  useGetJobByIdQuery,
  useGetJobsQuery,
} from "../../_redux/api/jobApi";

const ALL_FILTER = "All";
const JOBS_PAGE_LIMIT = 10;

const logoStyles: Record<LogoTone, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  red: "bg-red-50 text-red-600 border-red-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  teal: "bg-teal-50 text-teal-700 border-teal-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
  dark: "bg-slate-900 text-white border-slate-800",
};

type FilterKey = "location" | "workMode" | "jobType" | "experience";
type Filters = Record<FilterKey, string>;
type FilterOption = {
  label: string;
  value: string;
  count: number;
};
type ApplyNotice = {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};
type ApplicationSuccess = {
  title: string;
  message: string;
};

const defaultFilters: Filters = {
  location: ALL_FILTER,
  workMode: ALL_FILTER,
  jobType: ALL_FILTER,
  experience: ALL_FILTER,
};

export function HomePage() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    data: jobsData,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useGetJobsQuery({ limit: JOBS_PAGE_LIMIT });
  const jobs = useMemo(() => getUniqueJobs(jobsData?.pages.flatMap((page) => page.jobs) ?? []), [jobsData]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<ApplicationSuccess | null>(null);
  const {
    data: selectedJobDetail,
    isError: isJobDetailError,
    isFetching: isJobDetailLoading,
    refetch: refetchJobDetail,
  } = useGetJobByIdQuery(selectedJob?.id ?? "", {
    skip: !selectedJob,
  });

  const filterOptions = useMemo(
    () => ({
      location: createFilterOptions(jobs, (job) => cleanValue(job.location)),
      workMode: createFilterOptions(jobs, (job) => cleanValue(job.workMode)),
      jobType: createFilterOptions(jobs, (job) => cleanValue(job.jobType ?? job.employmentType)),
      experience: createFilterOptions(jobs, (job) => cleanValue(job.experience)),
    }),
    [jobs],
  );

  const filteredJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          matchesFilter(cleanValue(job.location), filters.location) &&
          matchesFilter(cleanValue(job.workMode), filters.workMode) &&
          matchesFilter(cleanValue(job.jobType ?? job.employmentType), filters.jobType) &&
          matchesFilter(cleanValue(job.experience), filters.experience),
      ),
    [filters, jobs],
  );

  useEffect(() => {
    if (!selectedJob) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedJob]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !hasNextPage || isFetching || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(defaultFilters);
  }

  return (
    <div className="min-h-screen text-slate-700">
      <DashboardHeader />

      <main className="mx-auto grid w-full max-w-[1200px] gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
            <div className="border-b border-blue-100/70 bg-blue-50/50 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                  <FiFilter className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-500">
                    Filters
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-950">Refine matches</h2>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 p-3">
              <FilterBox
                title="Filter by location"
                name="location"
                options={filterOptions.location}
                selectedValue={filters.location}
                onChange={(value) => updateFilter("location", value)}
              />
              <FilterBox
                title="Filter by work mode"
                name="workMode"
                options={filterOptions.workMode}
                selectedValue={filters.workMode}
                onChange={(value) => updateFilter("workMode", value)}
              />
              <FilterBox
                title="Filter by job type"
                name="jobType"
                options={filterOptions.jobType}
                selectedValue={filters.jobType}
                onChange={(value) => updateFilter("jobType", value)}
              />
              <FilterBox
                title="Filter by experience"
                name="experience"
                options={filterOptions.experience}
                selectedValue={filters.experience}
                onChange={(value) => updateFilter("experience", value)}
              />
              <button
                className="h-9 w-full rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700"
                onClick={clearFilters}
                type="button"
              >
                Clear filters
              </button>
            </div>
          </div>
          <FollowUsCard />
        </aside>

        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-[13px] shadow-sm shadow-slate-200/40">
            <p className="font-medium text-slate-700">
              {isLoading ? "Loading jobs..." : `${filteredJobs.length} jobs found`}
            </p>
            {isError ? (
              <button
                className="text-xs font-semibold text-slate-700 underline underline-offset-4"
                onClick={() => refetch()}
                type="button"
              >
                Retry
              </button>
            ) : null}
          </div>

          {isLoading ? <JobsState message="Fetching latest published jobs..." /> : null}
          {isError ? <JobsState message="Unable to load jobs. Please try again." /> : null}
          {!isLoading && !isError && filteredJobs.length === 0 ? (
            <JobsState message="No jobs match the selected filters." />
          ) : null}

          {!isLoading && !isError
            ? filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} onView={() => setSelectedJob(job)} />
              ))
            : null}

          {!isLoading && !isError && hasNextPage ? <div ref={loadMoreRef} className="h-px" /> : null}
        </section>
      </main>

      <DashboardFooter />

      {selectedJob ? (
        <JobModal
          fallbackJob={selectedJob}
          isError={isJobDetailError}
          isLoading={isJobDetailLoading}
          job={selectedJobDetail ?? selectedJob}
          onClose={() => setSelectedJob(null)}
          onAppliedSuccess={setApplicationSuccess}
          onRetry={refetchJobDetail}
        />
      ) : null}

      {applicationSuccess ? (
        <ApplicationSuccessDialog
          message={applicationSuccess.message}
          onClose={() => setApplicationSuccess(null)}
          title={applicationSuccess.title}
        />
      ) : null}
    </div>
  );
}

function createFilterOptions(jobs: Job[], getValue: (job: Job) => string) {
  const counts = new Map<string, number>();

  jobs.forEach((job) => {
    const value = getValue(job);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  const options = Array.from(counts.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([value, count]) => ({ label: value, value, count }));

  return [{ label: ALL_FILTER, value: ALL_FILTER, count: jobs.length }, ...options];
}

function getUniqueJobs(jobs: Job[]) {
  const uniqueJobs = new Map<string, Job>();

  jobs.forEach((job) => {
    if (!uniqueJobs.has(job.id)) {
      uniqueJobs.set(job.id, job);
    }
  });

  return Array.from(uniqueJobs.values());
}

function cleanValue(value: number | string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : "Not specified";
}

function matchesFilter(value: string, selectedValue: string) {
  return selectedValue === ALL_FILTER || value === selectedValue;
}

function formatSalary(salaryRange: string | null | undefined) {
  const value = cleanValue(salaryRange);
  return value === "Not specified" ? value : `${value} LPA`;
}

function FilterBox({
  title,
  name,
  options,
  selectedValue,
  onChange,
}: {
  title: string;
  name: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-3">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-[12px] font-semibold text-slate-800">{title}</h2>
        <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
      </div>
      <div className="space-y-1">
        {options.map((option) => {
          const checked = selectedValue === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[11px] transition ${
                checked
                  ? "bg-blue-50 font-semibold text-blue-800 ring-1 ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <input
                checked={checked}
                name={name}
                onChange={() => onChange(option.value)}
                type="radio"
                className="h-3.5 w-3.5 shrink-0 accent-blue-600"
              />
              <span>
                {option.label} ({option.count})
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function JobsState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500 shadow-sm shadow-slate-200/40">
      {message}
    </div>
  );
}

function ModalState({
  actionLabel,
  message,
  onAction,
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
}) {
  return (
    <div className="grid min-h-72 place-items-center rounded-lg border border-slate-100 bg-slate-50/70 px-5 py-10 text-center">
      <div>
        <p className="text-sm font-semibold text-slate-700">{message}</p>
        {onAction && actionLabel ? (
          <button
            className="mt-4 rounded-md border border-slate-950 bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DetailList({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="mt-5 border-t border-slate-100 pt-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
              <FiCheckCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[13px] leading-6 text-slate-600">Not specified</p>
      )}
    </section>
  );
}

function FollowUsCard() {
  return (
    <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-4 text-center shadow-sm shadow-blue-100/50">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-500">
        Stay connected
      </p>
      <h2 className="mt-1 text-sm font-semibold text-slate-950">Follow us</h2>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        Get hiring updates, career events and new opportunities first.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0a66c2] px-2 text-[11px] font-semibold text-white transition hover:bg-[#084e96]">
          <FiLinkedin className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          LinkedIn
        </button>
        <button className="inline-flex h-9 items-center justify-center rounded-lg bg-sky-500 px-2 text-[11px] font-semibold text-white transition hover:bg-sky-600">
          <FiInstagram className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Instagram
        </button>
      </div>
    </section>
  );
}

function JobCard({ job, onView }: { job: Job; onView: () => void }) {
  const detailPills = [cleanValue(job.jobType), cleanValue(job.workMode), cleanValue(job.employmentType)]
    .filter((value, index, values) => value !== "Not specified" && values.indexOf(value) === index);

  return (
    <article className="grid overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 transition duration-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60 md:grid-cols-[minmax(0,1fr)_120px] md:hover:-translate-y-0.5">
      <div className="min-w-0 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <CompanyLogo job={job} size="card" />
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-blue-600">{cleanValue(job.company)}</p>
              <h2 className="mt-1 overflow-hidden text-ellipsis text-[16px] font-semibold leading-snug tracking-[-0.01em] text-slate-950 sm:text-[17px]">
                {cleanValue(job.title)}
              </h2>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiMapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                {cleanValue(job.location)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiBriefcase className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                {cleanValue(job.experience)}
              </span>
              <span>Founded: {cleanValue(job.founded)}</span>
              <span>{cleanValue(job.size)}</span>
            </div>

            <p className="mt-2.5 line-clamp-2 max-w-[650px] text-[13px] leading-5.5 text-slate-600">
              {cleanValue(job.description)}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {detailPills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-md bg-blue-50/70 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-blue-100"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-stretch border-t border-slate-100 bg-slate-50/40 px-4 py-3 md:justify-center md:border-l md:border-t-0">
        <button
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 md:w-auto md:min-w-20"
          onClick={onView}
          type="button"
        >
          View
          <FiArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

function CompanyLogo({ job, size }: { job: Job; size: "card" | "modal" }) {
  const dimensions =
    size === "modal"
      ? "h-12 w-12 text-xl sm:h-14 sm:w-14 sm:text-2xl"
      : "h-11 w-11 text-lg sm:h-14 sm:w-14 sm:text-xl";
  const logoTone = logoStyles[job.logoTone] ? job.logoTone : "blue";

  return (
    <div
      className={`${dimensions} grid place-items-center rounded-xl border font-semibold shadow-sm ${logoStyles[logoTone]}`}
    >
      {cleanValue(job.logoText)}
    </div>
  );
}

function JobModal({
  fallbackJob,
  isError,
  isLoading,
  job,
  onClose,
  onAppliedSuccess,
  onRetry,
}: {
  fallbackJob: Job;
  isError: boolean;
  isLoading: boolean;
  job: Job;
  onClose: () => void;
  onAppliedSuccess: (success: ApplicationSuccess) => void;
  onRetry: () => void;
}) {
  const router = useRouter();
  const [applyNotice, setApplyNotice] = useState<ApplyNotice | null>(null);
  const [applyJob, { isLoading: isApplying }] = useApplyJobMutation();
  const [getCandidateSession, { isFetching: isCheckingSession }] = useLazyGetCandidateSessionQuery();
  const visibleJob = isLoading ? fallbackJob : job;
  const responsibilityItems = job.responsibilities ?? [];
  const requirementItems = job.requirements ?? [];
  const benefitItems = job.benefits ?? [];
  const tagItems = job.tags ?? [];
  const roleDetails = [cleanValue(job.jobType), cleanValue(job.workMode), cleanValue(job.employmentType)]
    .filter((value, index, values) => value !== "Not specified" && values.indexOf(value) === index);

  async function handleApply() {
    let response;

    try {
      response = await getCandidateSession().unwrap();
    } catch {
      setApplyNotice({
        title: "Login required",
        message: "Please login or create your candidate profile before applying for this job.",
        actionLabel: "Login to continue",
        actionHref: "/profile",
      });
      return;
    }

    const resumeUrl = response.data?.candidate.resumeUrl;

    if (!response.success) {
      setApplyNotice({
        title: "Login required",
        message: "Please login or create your candidate profile before applying for this job.",
        actionLabel: "Login to continue",
        actionHref: "/profile",
      });
      return;
    }

    if (!resumeUrl) {
      setApplyNotice({
        title: "Resume required",
        message: "Upload your resume once so recruiters can review your profile when you apply.",
        actionLabel: "Upload resume",
        actionHref: "/profile",
      });
      return;
    }

    try {
      const applyResponse = await applyJob(job.id).unwrap();

      if (!applyResponse.success) {
        setApplyNotice({
          title: "Unable to apply",
          message: applyResponse.message,
        });
        return;
      }

      onAppliedSuccess({
        title: "Application submitted",
        message: `Your application for ${cleanValue(job.title)} at ${cleanValue(job.company)} was submitted successfully.`,
      });
      onClose();
    } catch {
      setApplyNotice({
        title: "Unable to apply",
        message: "Please try again in a moment.",
      });
    }
  }

  function handleApplyNoticeAction() {
    if (!applyNotice?.actionHref) {
      setApplyNotice(null);
      return;
    }

    setApplyNotice(null);
    onClose();
    router.push(applyNotice.actionHref);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-slate-950/50 px-2 py-3 backdrop-blur-[2px] sm:px-4 sm:py-6">
      <section className="flex max-h-[calc(100vh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100vh-48px)]">
        <div className="flex items-start justify-between gap-3 border-b border-blue-100/70 bg-blue-50/40 px-4 py-4 sm:gap-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex min-w-0 gap-3">
              <CompanyLogo job={job} size="card" />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-blue-600">{cleanValue(visibleJob.company)}</p>
                <h2 className="mt-1 overflow-hidden text-ellipsis text-lg font-semibold leading-snug text-slate-950 sm:text-xl sm:leading-tight">
                  {cleanValue(visibleJob.title)}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
                    <FiMapPin className="h-3.5 w-3.5" aria-hidden />
                    {cleanValue(visibleJob.location)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
                    <FiBriefcase className="h-3.5 w-3.5" aria-hidden />
                    {cleanValue(visibleJob.experience)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            aria-label="Close job modal"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <FiX className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4 sm:px-5 sm:py-5">
          {isLoading ? (
            <ModalState message="Loading job details..." />
          ) : isError ? (
            <ModalState actionLabel="Retry" message="Unable to load job details." onAction={onRetry} />
          ) : (
            <>
          <div className="grid gap-2 sm:grid-cols-4">
            <SummaryTile label="Job type" value={cleanValue(job.jobType)} />
            <SummaryTile label="Work mode" value={cleanValue(job.workMode)} />
            <SummaryTile label="Founded" value={cleanValue(job.founded)} />
            <SummaryTile label="Openings" value={cleanValue(job.openings)} />
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <SummaryTile label="Salary" value={formatSalary(job.salaryRange)} />
            <SummaryTile label="Education" value={cleanValue(job.education)} />
            <SummaryTile label="Notice" value={cleanValue(job.noticePeriod)} />
            <SummaryTile label="Applicants" value={cleanValue(job.applicantsCount)} />
          </div>

          <section className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="text-base font-semibold text-slate-900">About {cleanValue(job.company)}</h3>
            <div className="mt-2 space-y-3 text-[13px] leading-6 text-slate-600">
              <p>{cleanValue(job.description)}</p>
            </div>
          </section>

          <section className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="text-base font-semibold text-slate-900">Job description</h3>
            <div className="mt-2 space-y-3 text-[13px] leading-6 text-slate-600">
              <p>
                <b>Role:</b> {cleanValue(job.title)}
              </p>
              <p>
                <b>Experience:</b> {cleanValue(job.experience)}
              </p>
              <p>
                <b>Industry:</b> {cleanValue(job.industry)}
              </p>
              <p>
                <b>Interview process:</b> {cleanValue(job.interviewProcess)}
              </p>
              <p>
                <b>Reporting to:</b> {cleanValue(job.reportingTo)}
              </p>
            </div>
          </section>

          <DetailList title="What you will do" items={responsibilityItems} />
          <DetailList title="What they are looking for" items={requirementItems} />
          <DetailList title="Benefits" items={benefitItems} />

          <section className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="text-base font-semibold text-slate-900">Skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagItems.length > 0
                ? tagItems.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100"
                    >
                      {tag}
                    </span>
                  ))
                : "Not specified"}
            </div>
          </section>

          <section className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="text-base font-semibold text-slate-900">Role details</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roleDetails.length > 0
                ? roleDetails.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100"
                    >
                      {detail}
                    </span>
                  ))
                : "Not specified"}
            </div>
            <div className="mt-3 text-[13px] leading-6 text-slate-600">
              <p>
                <b>Recruiter:</b> {cleanValue(job.recruiter)}
              </p>
              <p>
                <b>Recruiter role:</b> {cleanValue(job.recruiterRole)}
              </p>
            </div>
          </section>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs font-medium text-slate-500">
            Applying shares your profile with {cleanValue(visibleJob.company)}.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <button
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              disabled={isCheckingSession || isApplying}
              onClick={handleApply}
              type="button"
            >
              {isCheckingSession ? "Checking..." : isApplying ? "Applying..." : "Apply now"}
              <FiExternalLink className="ml-2 inline h-4 w-4 align-[-2px]" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      {applyNotice ? (
        <section className="absolute inset-x-3 top-1/2 z-10 mx-auto w-full max-w-md -translate-y-1/2 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-2xl shadow-slate-950/20">
          <div className="border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                  <FiAlertCircle className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-500">
                    Application
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{applyNotice.title}</h2>
                </div>
              </div>
              <button
                aria-label="Close apply message"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                onClick={() => setApplyNotice(null)}
                type="button"
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <p className="text-sm leading-6 text-slate-600">{applyNotice.message}</p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setApplyNotice(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
                onClick={handleApplyNoticeAction}
                type="button"
              >
                {applyNotice.actionLabel ?? "Got it"}
                {applyNotice.actionHref ? <FiLogIn className="ml-2 h-4 w-4" aria-hidden /> : null}
              </button>
            </div>
          </div>
        </section>
      ) : null}

    </div>
  );
}

function ApplicationSuccessDialog({
  message,
  onClose,
  title,
}: {
  message: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5 backdrop-blur-[2px] sm:px-4">
      <section className="w-full max-w-md overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-2xl shadow-slate-950/20">
        <div className="border-b border-emerald-100 bg-emerald-50/70 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                <FiCheckCircle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                  Success
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
              </div>
            </div>
            <button
              aria-label="Close success message"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
              onClick={onClose}
              type="button"
            >
              <FiX className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <p className="text-sm leading-6 text-slate-600">{message}</p>
          <div className="mt-5 flex justify-end">
            <button
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
              onClick={onClose}
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100/70 bg-blue-50/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}
