"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import Image from "next/image";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiHeart,
  FiLogIn,
  FiMapPin,
  FiMenu,
  FiSearch,
  FiStar,
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

const JOBS_PAGE_LIMIT = 10;

const logoStyles: Record<LogoTone, string> = {
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-rose-50 text-rose-600",
  blue: "bg-sky-50 text-sky-700",
  teal: "bg-teal-50 text-teal-700",
  purple: "bg-violet-50 text-violet-700",
  dark: "bg-slate-900 text-white",
};

type FilterKey = "location" | "workMode" | "jobType" | "experience";
type Filters = Record<FilterKey, string[]>;
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
type SortKey = "recent" | "applicants";
type JobTag = {
  label: string;
  tone: "purple" | "green" | "peach";
};

const defaultFilters: Filters = {
  location: [],
  workMode: [],
  jobType: [],
  experience: [],
};

const heroPhotos = [
  {
    alt: "Product team collaborating around a laptop",
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=240&h=240&q=80",
  },
  {
    alt: "Hiring conversation in an office",
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=420&h=420&q=80",
  },
  {
    alt: "Candidate preparing for an interview",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80",
  },
];

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
  const [keywordInput, setKeywordInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [search, setSearch] = useState({ keyword: "", location: "" });
  const [sort, setSort] = useState<SortKey>("recent");
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<ApplicationSuccess | null>(null);
  const {
    data: selectedJobDetail,
    isError: isJobDetailError,
    isLoading: isJobDetailLoading,
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

  const filteredJobs = useMemo(() => {
    const keyword = search.keyword.trim().toLowerCase();
    const location = search.location.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesKeyword =
        !keyword ||
        [job.title, job.company, job.description, ...(job.tags ?? [])].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(keyword),
        );
      const matchesLocationSearch = !location || cleanValue(job.location).toLowerCase().includes(location);

      return (
        matchesKeyword &&
        matchesLocationSearch &&
        matchesFilter(cleanValue(job.location), filters.location) &&
        matchesFilter(cleanValue(job.workMode), filters.workMode) &&
        matchesFilter(cleanValue(job.jobType ?? job.employmentType), filters.jobType) &&
        matchesFilter(cleanValue(job.experience), filters.experience)
      );
    });
  }, [filters, jobs, search]);

  const sortedJobs = useMemo(() => {
    const nextJobs = [...filteredJobs];

    if (sort === "applicants") {
      return nextJobs.sort((first, second) => (second.applicantsCount ?? 0) - (first.applicantsCount ?? 0));
    }

    return nextJobs.sort(
      (first, second) => new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime(),
    );
  }, [filteredJobs, sort]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).reduce((count, values) => count + values.length, 0),
    [filters],
  );

  useEffect(() => {
    if (!isFilterDrawerOpen) {
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
  }, [isFilterDrawerOpen]);

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
  }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, selectedJob, sortedJobs.length]);

  useEffect(() => {
    if (!isFilterDrawerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFilterDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    if (!selectedJob) {
      return;
    }

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [selectedJob?.id]);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => {
      const selected = current[key];
      const isSelected = selected.includes(value);

      return {
        ...current,
        [key]: isSelected ? selected.filter((item) => item !== value) : [...selected, value],
      };
    });
  }

  function clearFilters() {
    setFilters(defaultFilters);
  }

  function toggleSavedJob(jobId: string) {
    setSavedJobIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId],
    );
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch({
      keyword: keywordInput,
      location: locationInput,
    });
    setSelectedJob(null);
  }

  const visibleJob = selectedJobDetail ?? selectedJob;

  return (
    <div className="min-h-screen bg-[#eef2f8] text-slate-700">
      <DashboardHeader />

      <section className="relative overflow-hidden bg-[#0b0d12]">
        <div className="relative mx-auto w-full max-w-[1440px] px-3 sm:px-6">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[380px] lg:block">
            <HeroCollage />
          </div>

          <div className="relative z-10 pt-8 sm:pt-10 lg:pt-12">
            <h1 className="max-w-[640px] text-[26px] font-semibold tracking-tight text-white sm:text-[34px] lg:text-[42px]">
              Find Your Dream Job Here
              <span className="ml-2 inline-block align-middle text-white" aria-hidden>
                ✦
              </span>
            </h1>

            {!selectedJob ? (
              <form
                className="relative z-20 mt-7 flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_12px_40px_rgb(15_23_42_/_0.18)] sm:mt-10 sm:h-[58px] sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5 sm:pl-5"
                onSubmit={handleSearch}
              >
                <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:px-0 sm:py-0">
                  <FiSearch className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    onChange={(event) => setKeywordInput(event.target.value)}
                    placeholder="Job title or keyword"
                    value={keywordInput}
                  />
                </label>
                <span className="hidden h-7 w-px shrink-0 bg-slate-200 sm:mx-4 sm:block" />
                <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:px-0 sm:py-0">
                  <FiMapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    onChange={(event) => setLocationInput(event.target.value)}
                    placeholder="Add country or city"
                    value={locationInput}
                  />
                </label>
                <button
                  className="h-11 w-full shrink-0 rounded-full bg-[#3b82f6] px-7 text-sm font-semibold text-white transition hover:bg-[#2563eb] sm:ml-3 sm:w-auto"
                  type="submit"
                >
                  Search
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <div className={selectedJob ? "h-8 sm:h-10" : "h-10 sm:h-12"} />
      </section>

      <main className={`mx-auto w-full max-w-[1440px] px-3 sm:px-6 ${selectedJob ? "py-4 sm:py-5" : "pb-8 pt-6 sm:pb-10 sm:pt-8"}`}>
        {selectedJob && visibleJob ? (
          <JobWorkspace
            fallbackJob={selectedJob}
            isError={isJobDetailError}
            isLoading={isJobDetailLoading}
            jobs={sortedJobs}
            loadMoreRef={loadMoreRef}
            onBack={() => setSelectedJob(null)}
            onRetry={refetchJobDetail}
            onSelect={setSelectedJob}
            onAppliedSuccess={setApplicationSuccess}
            onToggleSave={toggleSavedJob}
            savedJobIds={savedJobIds}
            selectedJob={visibleJob}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-7">
            <aside className="hidden min-w-0 lg:sticky lg:top-24 lg:block lg:self-start">
              <FilterPanel
                filterOptions={filterOptions}
                filters={filters}
                onClear={clearFilters}
                onUpdate={updateFilter}
              />
            </aside>

            <section className="min-w-0">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[20px] font-semibold tracking-tight text-slate-950 sm:text-[24px]">
                  Recommended jobs
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    aria-expanded={isFilterDrawerOpen}
                    aria-controls="mobile-filter-drawer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 sm:flex-none lg:hidden"
                    onClick={() => setIsFilterDrawerOpen(true)}
                    type="button"
                  >
                    <FiMenu className="h-4 w-4" aria-hidden />
                    Filters
                    {activeFilterCount > 0 ? (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#3b82f6] px-1 text-[10px] leading-none text-white">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </button>
                  <label className="inline-flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 sm:flex-none">
                    <select
                      className="min-w-0 flex-1 bg-transparent outline-none"
                      onChange={(event) => setSort(event.target.value as SortKey)}
                      value={sort}
                    >
                      <option value="recent">Most recent</option>
                      <option value="applicants">Most applicants</option>
                    </select>
                  </label>
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
              </div>

              {isLoading ? <JobsState message="Fetching the latest published jobs..." /> : null}
              {isError ? <JobsState message="Unable to load jobs. Please try again." /> : null}
              {!isLoading && !isError && sortedJobs.length === 0 ? (
                <JobsState message="No jobs match the selected filters." />
              ) : null}

              {!isLoading && !isError ? (
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sortedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onToggleSave={() => toggleSavedJob(job.id)}
                      onView={() => setSelectedJob(job)}
                      saved={savedJobIds.includes(job.id)}
                    />
                  ))}
                </div>
              ) : null}

              {!isLoading && !isError && hasNextPage ? <div ref={loadMoreRef} className="h-px" /> : null}
              {isFetchingNextPage ? (
                <p className="mt-4 text-center text-sm font-medium text-slate-400">Loading more roles...</p>
              ) : null}
            </section>
          </div>
        )}
      </main>

      <DashboardFooter />

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isFilterDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          aria-label="Close filters"
          className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            isFilterDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsFilterDrawerOpen(false)}
          type="button"
        />
        <section
          aria-modal="true"
          className={`absolute inset-y-0 left-0 flex w-[min(92vw,360px)] flex-col overflow-hidden bg-[#eef2f8] shadow-2xl shadow-slate-950/25 transition-transform duration-300 ease-out ${
            isFilterDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          id="mobile-filter-drawer"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-3 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#3b82f6] shadow-sm">
                <FiFilter className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-950">Filters</h2>
                <p className="text-xs text-slate-500">Refine your recommended jobs</p>
              </div>
            </div>
            <button
              aria-label="Close filters"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-800"
              onClick={() => setIsFilterDrawerOpen(false)}
              type="button"
            >
              <FiX className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <div className="rounded-[22px] bg-white p-4">
              <FilterPanel
                filterOptions={filterOptions}
                filters={filters}
                onClear={clearFilters}
                onUpdate={updateFilter}
                variant="drawer"
              />
            </div>
          </div>
          <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              className="h-11 w-full rounded-full bg-[#3b82f6] px-5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
              onClick={() => setIsFilterDrawerOpen(false)}
              type="button"
            >
              Show {sortedJobs.length} jobs
            </button>
          </div>
        </section>
      </div>

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

function HeroCollage() {
  return (
    <div className="relative h-full w-full">
      <div className="hero-burst absolute right-0 top-2 h-[180px] w-[180px] lg:h-[210px] lg:w-[210px]">
        <div className="relative h-full w-full">
          <Image alt={heroPhotos[1]!.alt} className="object-cover" fill priority sizes="210px" src={heroPhotos[1]!.src} />
        </div>
      </div>
      <div className="absolute left-6 top-14 h-[88px] w-[88px] overflow-hidden rounded-[24px] shadow-lg shadow-black/35 lg:h-[100px] lg:w-[100px]">
        <div className="relative h-full w-full">
          <Image alt={heroPhotos[0]!.alt} className="object-cover" fill priority sizes="100px" src={heroPhotos[0]!.src} />
        </div>
      </div>
      <div className="absolute right-28 top-[7.5rem] h-[72px] w-[72px] overflow-hidden rounded-full shadow-lg shadow-black/35 lg:right-32 lg:h-[84px] lg:w-[84px]">
        <div className="relative h-full w-full">
          <Image alt={heroPhotos[2]!.alt} className="object-cover" fill priority sizes="84px" src={heroPhotos[2]!.src} />
        </div>
      </div>
    </div>
  );
}

function createFilterOptions(jobs: Job[], getValue: (job: Job) => string) {
  const counts = new Map<string, number>();

  jobs.forEach((job) => {
    const value = getValue(job);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([value]) => value !== "Not specified")
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([value, count]) => ({ label: value, value, count }));
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

function matchesFilter(value: string, selectedValues: string[]) {
  return selectedValues.length === 0 || selectedValues.includes(value);
}

function getSalaryLabel(salaryRange: string | null | undefined) {
  const value = String(salaryRange ?? "").trim();

  if (!value || value === "Not specified") {
    return null;
  }

  return `${value} LPA`;
}

function formatPostedAt(publishedAt: string | null | undefined) {
  const timestamp = publishedAt ? new Date(publishedAt).getTime() : Number.NaN;

  if (!Number.isFinite(timestamp)) {
    return "Recently posted";
  }

  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));

  if (days === 0) {
    return "Posted today";
  }

  if (days === 1) {
    return "Posted 1 day ago";
  }

  return `Posted ${days} days ago`;
}

function getJobTags(job: Job): JobTag[] {
  const tags: JobTag[] = [];
  const experience = cleanValue(job.experience);
  const jobType = cleanValue(job.jobType ?? job.employmentType);
  const workMode = cleanValue(job.workMode);

  if (experience !== "Not specified") {
    tags.push({ label: experience, tone: "purple" });
  }

  if (jobType !== "Not specified") {
    tags.push({ label: jobType, tone: "green" });
  }

  if (workMode !== "Not specified" && workMode !== jobType) {
    tags.push({ label: workMode, tone: workMode.toLowerCase().includes("remote") ? "peach" : "green" });
  }

  return tags.slice(0, 3);
}

function tagClassName(tone: JobTag["tone"]) {
  if (tone === "green") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (tone === "peach") {
    return "bg-orange-50 text-orange-600";
  }

  return "bg-violet-50 text-violet-700";
}

function FilterPanel({
  filterOptions,
  filters,
  onClear,
  onUpdate,
  variant = "sidebar",
}: {
  filterOptions: Record<FilterKey, FilterOption[]>;
  filters: Filters;
  onClear: () => void;
  onUpdate: (key: FilterKey, value: string) => void;
  variant?: "sidebar" | "drawer";
}) {
  const hasActiveFilters = Object.values(filters).some((values) => values.length > 0);

  return (
    <div
      className={
        variant === "drawer"
          ? "min-w-0"
          : "rounded-[22px] bg-white p-5 shadow-[0_10px_40px_rgb(15_23_42_/_0.05)]"
      }
    >
      <div className={variant === "drawer" ? "mb-4 flex items-center justify-end" : "mb-5 flex items-center justify-between gap-3"}>
        {variant === "sidebar" ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3b82f6]">Refine</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">Filters</h2>
          </div>
        ) : null}
        {hasActiveFilters ? (
          <button
            className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
            onClick={onClear}
            type="button"
          >
            Clear all
          </button>
        ) : null}
      </div>
      <FilterBox
        onChange={(value) => onUpdate("jobType", value)}
        options={filterOptions.jobType}
        selectedValues={filters.jobType}
        title="Job Type"
      />
      <FilterBox
        onChange={(value) => onUpdate("experience", value)}
        options={filterOptions.experience}
        selectedValues={filters.experience}
        showCount
        title="Experience Level"
      />
      <FilterBox
        onChange={(value) => onUpdate("workMode", value)}
        options={filterOptions.workMode}
        selectedValues={filters.workMode}
        title="Work mode"
      />
      <FilterBox
        onChange={(value) => onUpdate("location", value)}
        options={filterOptions.location}
        selectedValues={filters.location}
        title="Location"
      />
    </div>
  );
}

function FilterBox({
  title,
  options,
  selectedValues,
  onChange,
  showCount = false,
}: {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (value: string) => void;
  showCount?: boolean;
}) {
  return (
    <section className="border-t border-slate-100 py-4">
      <h3 className="mb-3 text-[13px] font-semibold text-slate-950">{title}</h3>
      <div className="thin-scrollbar max-h-48 space-y-1 overflow-y-auto pr-1">
        {options.length === 0 ? (
          <p className="text-xs text-slate-400">No options yet</p>
        ) : (
          options.map((option) => {
            const checked = selectedValues.includes(option.value);

            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-[13px] transition ${
                  checked ? "bg-sky-50 text-slate-950" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition ${
                    checked
                      ? "border-[#3b82f6] bg-[#3b82f6] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {checked ? <FiCheck className="h-3 w-3" aria-hidden /> : null}
                </span>
                <input
                  checked={checked}
                  className="sr-only"
                  onChange={() => onChange(option.value)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1 break-anywhere">{option.label}</span>
                {showCount ? <span className="text-xs text-slate-400">{option.count}</span> : null}
              </label>
            );
          })
        )}
      </div>
    </section>
  );
}

function JobsState({ message }: { message: string }) {
  return (
    <div className="rounded-[22px] bg-white px-5 py-12 text-center text-sm font-medium text-slate-500 shadow-[0_10px_40px_rgb(15_23_42_/_0.04)]">
      {message}
    </div>
  );
}

function JobCard({
  job,
  onToggleSave,
  onView,
  saved,
  selected = false,
  compact = false,
}: {
  job: Job;
  onToggleSave: () => void;
  onView: () => void;
  saved: boolean;
  selected?: boolean;
  compact?: boolean;
}) {
  const tags = getJobTags(job);
  const salary = getSalaryLabel(job.salaryRange);
  const location = cleanValue(job.location);
  const applicantLabel =
    typeof job.applicantsCount === "number" ? `${job.applicantsCount} Applicants` : null;

  return (
    <article
      className={`group flex w-full min-w-0 cursor-pointer flex-col items-stretch rounded-lg border bg-white text-left transition hover:border-blue-200 hover:shadow-[0_8px_24px_rgb(37_99_235_/_0.08)] ${
        compact ? "p-4" : "h-full p-4"
      } ${selected ? "border-[#3b82f6] shadow-[0_8px_24px_rgb(37_99_235_/_0.08)]" : "border-slate-200"}`}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo job={job} />
          <div className="min-w-0">
            <h3 className={`font-semibold text-slate-950 ${compact ? "truncate text-[14px] leading-5" : "truncate text-[15px]"}`}>
              {cleanValue(job.title)}
            </h3>
            <p className={`truncate text-[12px] leading-5 text-slate-500 ${compact ? "mt-1.5" : "mt-0.5"}`}>
              {cleanValue(job.company)}
              {applicantLabel ? (
                <>
                  <span className="mx-1.5 text-slate-300">•</span>
                  {applicantLabel}
                </>
              ) : null}
            </p>
          </div>
        </div>
        <button
          aria-label={saved ? "Remove saved job" : "Save job"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-slate-50 hover:text-rose-500"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSave();
          }}
          type="button"
        >
          <FiHeart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} aria-hidden />
        </button>
      </div>

      {tags.length > 0 ? (
        <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-3.5" : "mt-3"}`}>
          {tags.map((tag) => (
            <span
              key={`${tag.tone}-${tag.label}`}
              className={`rounded-md px-2 py-1 text-[11px] font-medium leading-none ${tagClassName(tag.tone)}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}

      <p className={`line-clamp-2 text-slate-500 ${compact ? "mt-3.5 text-[12px] leading-5" : "mt-3 text-[13px] leading-5"}`}>
        {cleanValue(job.description)}
      </p>

      {!compact && location !== "Not specified" ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400">
          <FiMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{location}</span>
        </p>
      ) : null}

      <div className={`mt-auto flex items-center justify-between gap-3 ${compact ? "pt-3.5" : "pt-3"}`}>
        {salary ? (
          <p className={`font-semibold text-slate-950 ${compact ? "text-[14px]" : "text-[15px]"}`}>{salary}</p>
        ) : (
          <span />
        )}
        <p className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-slate-400">
          <FiClock className="h-3.5 w-3.5" aria-hidden />
          {formatPostedAt(job.publishedAt)}
        </p>
      </div>
    </article>
  );
}

function CompanyLogo({ job }: { job: Job }) {
  const logoTone = logoStyles[job.logoTone] ? job.logoTone : "blue";

  return (
    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[13px] font-semibold ${logoStyles[logoTone]}`}>
      {cleanValue(job.logoText)}
    </div>
  );
}

function JobWorkspace({
  fallbackJob,
  isError,
  isLoading,
  jobs,
  loadMoreRef,
  onAppliedSuccess,
  onBack,
  onRetry,
  onSelect,
  onToggleSave,
  savedJobIds,
  selectedJob,
}: {
  fallbackJob: Job;
  isError: boolean;
  isLoading: boolean;
  jobs: Job[];
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onAppliedSuccess: (success: ApplicationSuccess) => void;
  onBack: () => void;
  onRetry: () => void;
  onSelect: (job: Job) => void;
  onToggleSave: (jobId: string) => void;
  savedJobIds: string[];
  selectedJob: Job;
}) {
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState(0);

  useLayoutEffect(() => {
    const element = descriptionRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.round(element.getBoundingClientRect().height);

      setListHeight((currentHeight) => {
        if (nextHeight <= 0) {
          return currentHeight;
        }

        if (isLoading && currentHeight > 0) {
          return currentHeight;
        }

        return nextHeight;
      });
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [isError, isLoading, selectedJob.id]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(260px,280px)_minmax(0,1fr)_minmax(260px,300px)]">
      <aside
        className="job-list-panel hidden min-h-[min(640px,calc(100dvh-180px))] min-w-0 flex-col self-start overflow-hidden lg:col-start-1 lg:row-start-1 lg:flex"
        style={listHeight > 0 ? { height: listHeight, minHeight: listHeight } : undefined}
      >
        <button
          className="mb-3 inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          onClick={onBack}
          type="button"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          All jobs
        </button>
        <div className="job-list-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {jobs.map((job) => (
            <JobCard
              compact
              key={job.id}
              job={job}
              onToggleSave={() => onToggleSave(job.id)}
              onView={() => onSelect(job)}
              saved={savedJobIds.includes(job.id)}
              selected={job.id === selectedJob.id}
            />
          ))}
          <div ref={loadMoreRef} className="h-px" />
        </div>
      </aside>

      <div
        ref={descriptionRef}
        className="min-w-0 self-start lg:col-start-2 lg:row-start-1"
        style={isLoading && listHeight > 0 ? { minHeight: listHeight } : undefined}
      >
        <JobDetailPanel
          fallbackJob={fallbackJob}
          isError={isError}
          isLoading={isLoading}
          job={selectedJob}
          onBack={onBack}
          onRetry={onRetry}
        />
      </div>

      <div className="min-w-0 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:self-start">
        <CompanyPanel job={isLoading ? fallbackJob : selectedJob} onAppliedSuccess={onAppliedSuccess} />
      </div>
    </div>
  );
}

function JobDetailPanel({
  fallbackJob,
  isError,
  isLoading,
  job,
  onBack,
  onRetry,
}: {
  fallbackJob: Job;
  isError: boolean;
  isLoading: boolean;
  job: Job;
  onBack: () => void;
  onRetry: () => void;
}) {
  const lastReadyJobRef = useRef(job);

  if (!isLoading && !isError) {
    lastReadyJobRef.current = job;
  }

  const displayJob = isLoading ? lastReadyJobRef.current : job;
  const tags = getJobTags(displayJob);
  const responsibilityItems = displayJob.responsibilities ?? [];
  const requirementItems = displayJob.requirements ?? [];
  const skillItems = displayJob.tags ?? [];
  const hasReadyContent = Boolean(displayJob.description || (displayJob.responsibilities?.length ?? 0) > 0);

  return (
    <section className="h-full min-h-full min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <button
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900 lg:hidden"
        onClick={onBack}
        type="button"
      >
        <FiArrowLeft className="h-4 w-4" aria-hidden />
        All jobs
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="break-anywhere text-[22px] font-semibold tracking-tight text-slate-950 sm:text-[26px]">
          {cleanValue(isLoading ? fallbackJob.title : displayJob.title)}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={`${tag.tone}-${tag.label}`}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${tagClassName(tag.tone)}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {isLoading && !hasReadyContent ? (
        <p className="mt-8 text-sm font-medium text-slate-400">Loading job details...</p>
      ) : isError ? (
        <div className="mt-8">
          <p className="text-sm font-medium text-slate-500">Unable to load job details.</p>
          <button
            className="mt-3 rounded-full bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h3 className="text-lg font-semibold text-slate-950">About the role</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{cleanValue(displayJob.description)}</p>
          </section>

          <DetailList items={responsibilityItems} title="Responsibilities" />

          <section className="mt-8">
            <h3 className="text-lg font-semibold text-slate-950">Required skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {skillItems.length > 0
                ? skillItems.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))
                : <p className="text-sm text-slate-500">Not specified</p>}
            </div>
          </section>

          {requirementItems.length > 0 ? <DetailList items={requirementItems} title="What they are looking for" /> : null}
        </>
      )}
    </section>
  );
}

function DetailList({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-slate-500">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">Not specified</p>
      )}
    </section>
  );
}

function CompanyPanel({
  job,
  onAppliedSuccess,
}: {
  job: Job;
  onAppliedSuccess: (success: ApplicationSuccess) => void;
}) {
  const router = useRouter();
  const [applyNotice, setApplyNotice] = useState<ApplyNotice | null>(null);
  const [applyJob, { isLoading: isApplying }] = useApplyJobMutation();
  const [getCandidateSession, { isFetching: isCheckingSession }] = useLazyGetCandidateSessionQuery();
  const skillItems = (job.tags ?? []).slice(0, 8);

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
    router.push(applyNotice.actionHref);
  }

  return (
    <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="break-anywhere text-lg font-semibold text-slate-950">{cleanValue(job.company)}</h2>
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#3b82f6] text-white">
              <FiCheck className="h-2.5 w-2.5" aria-hidden />
            </span>
          </div>
        </div>
        <CompanyLogo job={job} />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Founded</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{cleanValue(job.founded)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Location</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{cleanValue(job.location)}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-950">Other information</h3>
        <div className="mt-3 space-y-3">
          {getSalaryLabel(job.salaryRange) ? (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex text-amber-400">
                <FiStar className="h-4 w-4 fill-amber-400" aria-hidden />
                <FiStar className="h-4 w-4 fill-amber-400" aria-hidden />
                <FiStar className="h-4 w-4 fill-amber-400" aria-hidden />
                <FiStar className="h-4 w-4 fill-amber-400" aria-hidden />
                <FiStar className="h-4 w-4 fill-amber-400" aria-hidden />
              </span>
              {getSalaryLabel(job.salaryRange)}
            </p>
          ) : null}
          <p className="text-sm text-slate-600">{cleanValue(job.size)}</p>
          <p className="text-sm text-slate-600">{cleanValue(job.applicantsCount)} applicants</p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-950">Skills</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {skillItems.length > 0
            ? skillItems.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {tag}
                </span>
              ))
            : <p className="text-sm text-slate-500">Not specified</p>}
        </div>
      </div>

      <button
        className="mt-6 h-11 w-full rounded-lg bg-[#3b82f6] text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isCheckingSession || isApplying}
        onClick={handleApply}
        type="button"
      >
        {isCheckingSession ? "Checking..." : isApplying ? "Applying..." : "Apply now"}
      </button>

      {applyNotice ? (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5">
        <section className="modal-panel-enter w-full max-w-md overflow-hidden rounded-[22px] bg-white shadow-2xl shadow-slate-950/20">
          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-50 text-[#3b82f6]">
                  <FiAlertCircle className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-950">{applyNotice.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{applyNotice.message}</p>
                </div>
              </div>
              <button
                aria-label="Close apply message"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setApplyNotice(null)}
                type="button"
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setApplyNotice(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                onClick={handleApplyNoticeAction}
                type="button"
              >
                {applyNotice.actionLabel ?? "Got it"}
                {applyNotice.actionHref ? <FiLogIn className="ml-2 h-4 w-4" aria-hidden /> : null}
              </button>
            </div>
          </div>
        </section>
        </div>
      ) : null}
    </aside>
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
    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5 backdrop-blur-[2px] sm:px-4">
      <section className="modal-panel-enter w-full max-w-md overflow-hidden rounded-[22px] bg-white shadow-2xl shadow-slate-950/20">
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiCheckCircle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
              </div>
            </div>
            <button
              aria-label="Close success message"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={onClose}
              type="button"
            >
              <FiX className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="rounded-full bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
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
