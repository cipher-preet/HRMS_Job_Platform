import { baseApi } from "./baseApi";

export type CandidateRegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type CandidateLoginRequest = {
  email: string;
  password: string;
};

export type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  currentCompany: string | null;
  experienceYears: number | null;
  resumeUrl: string | null;
};

export type CandidateRegisterResponse = {
  success: boolean;
  message: string;
  details?: {
    path: string;
    message: string;
  }[];
  data?: {
    candidate: Candidate;
  };
};

export type CandidateLoginResponse = {
  success: boolean;
  message: string;
  data?: {
    candidate: Candidate;
  };
};

export type CandidateResumeUploadResponse = {
  success: boolean;
  message: string;
  data?: {
    resume?: {
      id: string;
      fileName: string;
      url: string;
      parseStatus: string;
      uploadedAt: string;
    };
    candidate: Candidate;
  };
};

export type CandidateSessionResponse = {
  success: boolean;
  message: string;
  data?: {
    candidate: Candidate;
  };
};

export type CandidateSignOutResponse = {
  success: boolean;
  message: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidateSession: builder.query<CandidateSessionResponse, void>({
      query: () => "/candidates/me",
    }),
    candidateRegister: builder.mutation<CandidateRegisterResponse, CandidateRegisterRequest>({
      query: (body) => ({
        url: "/candidates/register",
        method: "POST",
        body,
      }),
    }),
    candidateLogin: builder.mutation<CandidateLoginResponse, CandidateLoginRequest>({
      query: (body) => ({
        url: "/candidates/login",
        method: "POST",
        body,
      }),
    }),
    uploadCandidateResume: builder.mutation<CandidateResumeUploadResponse, FormData>({
      query: (body) => ({
        url: "/candidates/resume",
        method: "POST",
        body,
      }),
    }),
    candidateSignOut: builder.mutation<CandidateSignOutResponse, void>({
      query: () => ({
        url: "/candidates/sign-out",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useCandidateLoginMutation,
  useCandidateRegisterMutation,
  useCandidateSignOutMutation,
  useUploadCandidateResumeMutation,
  useGetCandidateSessionQuery,
  useLazyGetCandidateSessionQuery,
} = authApi;
