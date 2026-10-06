import { baseApi } from "./baseApi";

export type LogoTone = "green" | "red" | "blue" | "teal" | "purple" | "dark";

export type Job = {
  id: string;
  organizationId?: number;
  title: string;
  company: string;
  location: string;
  founded: string;
  size: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  tags?: string[];
  logoText: string;
  logoTone: LogoTone;
  experience: string;
  recruiter?: string;
  recruiterRole?: string;
  salaryRange?: string;
  jobType: string;
  workMode: string | null;
  employmentType: string | null;
  education?: string;
  industry?: string;
  noticePeriod?: string;
  interviewProcess?: string;
  hiringPriority?: string | null;
  reportingTo?: string;
  openings?: number;
  applicantsCount?: number;
  publishedAt: string;
};

type JobsResponse = {
  success: boolean;
  message: string;
  data: Job[];
  meta?: {
    pagination?: {
      limit: number;
      nextCursor: string | null;
      hasNextPage: boolean;
    };
  };
};

type JobsPage = {
  jobs: Job[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
  };
};

type GetJobsQueryArg = {
  limit?: number;
};

type JobResponse = {
  success: boolean;
  message: string;
  data: Job;
};

type ApplyJobResponse = {
  success: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
    appliedAt: string;
  };
};

export const jobApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.infiniteQuery<JobsPage, GetJobsQueryArg | void, string | undefined>({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) =>
          lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: "/jobs",
        params: {
          limit: queryArg?.limit ?? 10,
          cursor: pageParam,
        },
      }),
      transformResponse: (response: JobsResponse): JobsPage => ({
        jobs: response.data,
        pagination: response.meta?.pagination ?? {
          limit: response.data.length,
          nextCursor: null,
          hasNextPage: false,
        },
      }),
    }),
    getJobById: builder.query<Job, string>({
      query: (id) => `/jobs/${id}`,
      transformResponse: (response: JobResponse) => response.data,
    }),
    applyJob: builder.mutation<ApplyJobResponse, string>({
      query: (id) => ({
        url: `/jobs/apply/${id}`,
        method: "POST",
        body: {},
      }),
    }),
  }),
});

export const {
  useApplyJobMutation,
  useGetJobByIdQuery,
  useGetJobsInfiniteQuery: useGetJobsQuery,
} = jobApi;
