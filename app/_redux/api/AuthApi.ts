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

export type CandidateForgotPasswordRequest = {
  email: string;
};

export type CandidateResetPasswordRequest = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type CandidatePasswordResponse = {
  success: boolean;
  message: string;
  details?: {
    path: string;
    message: string;
  }[];
  data?: {
    reset?: boolean;
  } | null;
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

export type CandidateVerificationVideoUploadResponse = {
  success: boolean;
  message: string;
  details?: {
    path: string;
    message: string;
  }[];
  data?: {
    verificationVideo?: {
      id: string;
      fileName: string;
      url: string;
      uploadedAt: string;
    };
    candidate: Candidate;
  };
};

export type CandidateFaceVideo = {
  id: string;
  fileName: string;
  url: string;
  trainingStatus: string;
  trainingError: string | null;
  trainedAt: string | null;
  uploadedAt: string;
};

export type CandidateFaceVideoUploadResponse = {
  success: boolean;
  message: string;
  details?: {
    path: string;
    message: string;
  }[];
  data?: {
    faceVideo?: CandidateFaceVideo;
    candidate?: Candidate;
  };
};

export type CandidateLatestFaceVideoResponse = {
  success: boolean;
  message: string;
  data?: {
    faceVideo: CandidateFaceVideo | null;
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
    candidateForgotPassword: builder.mutation<
      CandidatePasswordResponse,
      CandidateForgotPasswordRequest
    >({
      query: (body) => ({
        url: "/candidates/forgot-password",
        method: "POST",
        body,
      }),
    }),
    candidateResetPassword: builder.mutation<
      CandidatePasswordResponse,
      CandidateResetPasswordRequest
    >({
      query: (body) => ({
        url: "/candidates/reset-password",
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
    uploadCandidateVerificationVideo: builder.mutation<CandidateVerificationVideoUploadResponse, FormData>({
      query: (body) => ({
        url: "/candidates/verification-video",
        method: "POST",
        body,
      }),
    }),
    uploadCandidateFaceVideo: builder.mutation<CandidateFaceVideoUploadResponse, FormData>({
      query: (body) => ({
        url: "/candidates/face/video",
        method: "POST",
        body,
      }),
    }),
    getLatestCandidateFaceVideo: builder.query<CandidateLatestFaceVideoResponse, void>({
      query: () => "/candidates/face/video/latest",
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
  useCandidateForgotPasswordMutation,
  useCandidateResetPasswordMutation,
  useCandidateRegisterMutation,
  useCandidateSignOutMutation,
  useGetLatestCandidateFaceVideoQuery,
  useUploadCandidateFaceVideoMutation,
  useUploadCandidateResumeMutation,
  useUploadCandidateVerificationVideoMutation,
  useGetCandidateSessionQuery,
  useLazyGetCandidateSessionQuery,
} = authApi;
