"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCamera,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiMail,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSquare,
  FiUploadCloud,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { DashboardFooter } from "../_components/dashboard-footer";
import { DashboardHeader } from "../_components/dashboard-header";
import { AUTH_STORAGE_KEY } from "../_hooks/use-candidate-sign-out";
import {
  useCandidateLoginMutation,
  useCandidateRegisterMutation,
  useGetLatestCandidateFaceVideoQuery,
  useGetCandidateSessionQuery,
  useUploadCandidateFaceVideoMutation,
  useUploadCandidateResumeMutation,
} from "../_redux/api/AuthApi";

type AuthMode = "login" | "register";
type CaptureStep = "ready" | "center" | "left" | "right" | "complete";
type FaceVisibilityStatus = "loading" | "visible" | "not-visible" | "unsupported";
type TrackingRect = { height: number; width: number; x: number; y: number };
type TrackingEvent = { data: TrackingRect[] };
type TrackingTracker = {
  on: (event: "track", callback: (event: TrackingEvent) => void) => void;
  setEdgesDensity?: (value: number) => void;
  setInitialScale?: (value: number) => void;
  setStepSize?: (value: number) => void;
};
type TrackingTask = { stop: () => void };
type TrackingRuntime = {
  ObjectTracker: new (classifiers: string | string[]) => TrackingTracker;
  track: (element: HTMLVideoElement, tracker: TrackingTracker) => TrackingTask;
};
type FaceVideoUploadSuccess = {
  fileName: string;
  message: string;
  trainingStatus: string;
} | null;

const FACE_VIDEO_MAX_SIZE_BYTES = 80 * 1024 * 1024;
const FACE_VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,video/mpeg,video/x-matroska,.mp4,.mov,.webm,.mpeg,.mpg,.mkv";
const FACE_VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  webm: "video/webm",
};

declare global {
  interface Window {
    __trackingFacePromise?: Promise<TrackingRuntime>;
    tracking?: TrackingRuntime;
  }
}

export default function ProfilePage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeUploadMessage, setResumeUploadMessage] = useState<string | null>(null);
  const [verificationVideoName, setVerificationVideoName] = useState<string | null>(null);
  const [verificationVideoPreviewUrl, setVerificationVideoPreviewUrl] = useState<string | null>(null);
  const [verificationVideoMessage, setVerificationVideoMessage] = useState<string | null>(null);
  const [uploadedFaceVideoUrl, setUploadedFaceVideoUrl] = useState<string | null>(null);
  const [faceVideoUploadSuccess, setFaceVideoUploadSuccess] = useState<FaceVideoUploadSuccess>(null);
  const [candidateLogin, { isLoading: isLoggingIn }] = useCandidateLoginMutation();
  const [candidateRegister, { isLoading: isRegistering }] = useCandidateRegisterMutation();
  const [uploadCandidateResume, { isLoading: isUploadingResume }] = useUploadCandidateResumeMutation();
  const [uploadCandidateFaceVideo, { isLoading: isUploadingFaceVideo }] = useUploadCandidateFaceVideoMutation();
  const {
    data: candidateSession,
    isLoading: isSessionLoading,
    refetch: refetchCandidateSession,
  } = useGetCandidateSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const candidate = candidateSession?.success ? candidateSession.data?.candidate : undefined;
  const isSignedIn = Boolean(candidate);
  const {
    data: latestFaceVideoResponse,
    isLoading: isLatestFaceVideoLoading,
    refetch: refetchLatestFaceVideo,
  } = useGetLatestCandidateFaceVideoQuery(undefined, {
    skip: !isSignedIn,
  });
  const latestFaceVideo = latestFaceVideoResponse?.success ? latestFaceVideoResponse.data?.faceVideo ?? null : null;
  const visibleFaceVideoName =
    latestFaceVideo?.fileName ??
    verificationVideoName ??
    (isLatestFaceVideoLoading ? "Checking verification video..." : "No verification video uploaded");
  const visibleFaceVideoUrl = latestFaceVideo?.url ?? uploadedFaceVideoUrl;
  const hasUploadedFaceVideo = Boolean(latestFaceVideo || verificationVideoName || uploadedFaceVideoUrl);
  const isCheckingFaceVideoStatus = isSessionLoading || (isSignedIn && isLatestFaceVideoLoading);
  const shouldShowFaceVideoSection = !hasUploadedFaceVideo && !isCheckingFaceVideoStatus;
  const resumeUrl = candidate?.resumeUrl ?? null;
  const visibleResumeName = resumeName ?? getResumeFileName(resumeUrl);
  const profileCompletenessItems = [
    { complete: Boolean(resumeUrl), label: "Resume uploaded" },
    { complete: hasUploadedFaceVideo, label: "Verification video" },
  ];
  const completedProfileItems = profileCompletenessItems.filter((item) => item.complete).length;
  const profileCompleteness = Math.round((completedProfileItems / profileCompletenessItems.length) * 100);
  const identityChips = [
    candidate?.location,
    candidate?.currentCompany,
    formatExperienceYears(candidate?.experienceYears ?? null, true),
  ].filter((chip): chip is string => Boolean(chip));

  useEffect(() => {
    return () => {
      if (verificationVideoPreviewUrl) {
        URL.revokeObjectURL(verificationVideoPreviewUrl);
      }
    };
  }, [verificationVideoPreviewUrl]);

  useEffect(() => {
    if (!faceVideoUploadSuccess) {
      return;
    }

    const toastTimer = window.setTimeout(() => {
      setFaceVideoUploadSuccess(null);
    }, 5000);

    return () => {
      window.clearTimeout(toastTimer);
    };
  }, [faceVideoUploadSuccess]);

  const signIn = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "signed-in");
  };

  const isLogin = authMode === "login";

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = getFormValue(formData, "email");
    const password = getFormValue(formData, "password");

    try {
      if (isLogin) {
        const response = await candidateLogin({
          email,
          password,
        }).unwrap();

        if (!response.success) {
          setAuthMessage(getAuthResponseMessage(response));
          return;
        }

        signIn();
        refetchCandidateSession();
        return;
      }

      const firstName = getFormValue(formData, "firstName");
      const lastName = getFormValue(formData, "lastName");
      const response = await candidateRegister({
        firstName,
        lastName,
        email,
        password,
      }).unwrap();

      if (!response.success) {
        setAuthMessage(getAuthResponseMessage(response));
        return;
      }

      signIn();
      refetchCandidateSession();
    } catch (error) {
      setAuthMessage(
        getApiErrorMessage(error, isLogin ? "Unable to login candidate" : "Unable to register candidate"),
      );
    }
  };

  const handleResumeUpload = async (file: File) => {
    setResumeUploadMessage(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await uploadCandidateResume(formData).unwrap();

      if (!response.success) {
        setResumeUploadMessage(getAuthResponseMessage(response));
        return;
      }

      setResumeName(response.data?.resume?.fileName ?? file.name);
      refetchCandidateSession();
    } catch (error) {
      setResumeUploadMessage(getApiErrorMessage(error, "Unable to upload resume"));
    }
  };

  const handleVerificationVideoUpload = async (file: File, knownDuration?: number) => {
    setVerificationVideoMessage(null);
    setFaceVideoUploadSuccess(null);
    const uploadFile = getUploadableFaceVideoFile(file);

    if (!uploadFile) {
      setVerificationVideoMessage("Only MP4, MOV, WEBM, MPEG, and MKV video files are allowed.");
      return;
    }

    if (uploadFile.size > FACE_VIDEO_MAX_SIZE_BYTES) {
      setVerificationVideoMessage("Video file must be 80 MB or smaller.");
      return;
    }

    const duration = knownDuration ?? (await getVideoDuration(uploadFile));

    if (duration < 10) {
      setVerificationVideoMessage("Video must be at least 10 seconds long.");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(uploadFile);
    setVerificationVideoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });

    const formData = new FormData();
    formData.append("video", uploadFile);

    try {
      const response = await uploadCandidateFaceVideo(formData).unwrap();

      if (!response.success) {
        setVerificationVideoMessage(getAuthResponseMessage(response));
        return;
      }

      const uploadedFaceVideo = response.data?.faceVideo;
      const uploadedFileName = uploadedFaceVideo?.fileName ?? uploadFile.name;

      setVerificationVideoName(uploadedFileName);
      setUploadedFaceVideoUrl(uploadedFaceVideo?.url ?? null);
      setFaceVideoUploadSuccess({
        fileName: uploadedFileName,
        message: response.message || "Face video uploaded and queued for training",
        trainingStatus: uploadedFaceVideo?.trainingStatus ?? "queued",
      });
      refetchCandidateSession();
      refetchLatestFaceVideo();
    } catch (error) {
      setVerificationVideoMessage(getApiErrorMessage(error, "Unable to upload face video"));
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-white text-slate-700">
        <DashboardHeader />
        <ProfileAuthSkeleton />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white text-slate-700">
        <DashboardHeader />
        <ProfileAuthScreen
          authMessage={authMessage}
          authMode={authMode}
          isLoggingIn={isLoggingIn}
          isRegistering={isRegistering}
          onGoogleClick={() => {
            signIn();
            refetchCandidateSession();
          }}
          onModeChange={(mode) => {
            setAuthMessage(null);
            setAuthMode(mode);
          }}
          onSubmit={handleAuthSubmit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef2f8] text-slate-700">
      <DashboardHeader />

      <main className="mx-auto grid w-full max-w-[1440px] gap-5 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-6">
        <section className="min-w-0 space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="relative h-[76px] overflow-hidden rounded-t-lg bg-[#0b0d12] px-4 pt-4 sm:h-[92px] sm:px-6 sm:pt-5">
              <div className="absolute -left-10 top-[-40px] h-40 w-40 rounded-full bg-[#3b82f6]/30 blur-2xl" />
              <div className="absolute right-8 top-[-30px] h-32 w-32 rounded-full bg-[#2563eb]/25 blur-2xl" />
              <p className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                Profile
              </p>
            </div>
            <div className="px-4 pb-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-3 sm:gap-4">
                  <span className="grid h-14 w-14 shrink-0 -translate-y-4 place-items-center rounded-lg bg-[#3b82f6] text-lg font-semibold text-white ring-4 ring-white sm:h-16 sm:w-16 sm:-translate-y-5 sm:text-xl">
                    {getProfileInitials(candidate?.name ?? "Candidate")}
                  </span>
                  <div className="min-w-0 pb-1">
                    <h1 className="break-anywhere text-[22px] font-semibold tracking-tight text-slate-950 sm:text-[28px]">
                      {candidate?.name}
                    </h1>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
                      <FiMail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{candidate?.email}</span>
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex h-9 w-fit items-center rounded-md px-3 text-xs font-semibold ${
                    profileCompleteness === 100
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-[#2563eb]"
                  }`}
                >
                  {profileCompleteness === 100 ? "Ready to apply" : `${profileCompleteness}% complete`}
                </span>
              </div>
              {identityChips.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {identityChips.map((chip) => (
                    <span
                      className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                      key={chip}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <ProfileSection
            description="This file is attached when you apply to jobs."
            icon={FiFileText}
            title="Resume"
          >
            <UploadedDocument
              complete={Boolean(resumeUrl)}
              fileName={visibleResumeName}
              title="Resume"
              url={resumeUrl}
            />
            <div className="mt-3">
              <UploadButton
                disabled={isUploadingResume}
                label={isUploadingResume ? "Uploading resume..." : resumeUrl ? "Replace resume" : "Upload resume"}
                onChange={handleResumeUpload}
                primary={!resumeUrl}
              />
            </div>
            {resumeUploadMessage ? (
              <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {resumeUploadMessage}
              </p>
            ) : null}
          </ProfileSection>

          <ProfileSection
            description="A 10-second face check used to verify your identity."
            icon={FiShield}
            title="Identity verification"
          >
            {isCheckingFaceVideoStatus ? <FaceVideoStatusLoader /> : null}

            {shouldShowFaceVideoSection ? (
              <VideoVerificationSection
                disabled={isUploadingFaceVideo}
                message={verificationVideoMessage}
                onChange={handleVerificationVideoUpload}
                previewUrl={verificationVideoPreviewUrl}
                uploadLabel={isUploadingFaceVideo ? "Uploading video..." : "Upload verification video"}
                videoName={verificationVideoName}
              />
            ) : null}

            {!isCheckingFaceVideoStatus && !shouldShowFaceVideoSection ? (
              <UploadedDocument
                complete={hasUploadedFaceVideo}
                fileName={visibleFaceVideoName}
                icon={FiVideo}
                title="Verification video"
                url={visibleFaceVideoUrl}
              />
            ) : null}
          </ProfileSection>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Application checklist
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <h2 className="text-[16px] font-semibold text-slate-950">Profile status</h2>
              <p className="text-[22px] font-semibold tracking-tight text-slate-950">{profileCompleteness}%</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#3b82f6] transition-all"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {completedProfileItems === profileCompletenessItems.length
                ? "Your resume and verification video are ready for applications."
                : `${completedProfileItems} of ${profileCompletenessItems.length} required documents uploaded.`}
            </p>
            <div className="mt-4 space-y-3">
              {profileCompletenessItems.map((item) => (
                <StatusRow complete={item.complete} key={item.label} label={item.label} />
              ))}
            </div>
            <Link
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b82f6] px-4 text-sm font-semibold transition hover:bg-[#2563eb]"
              href="/"
              style={{ color: "#ffffff" }}
            >
              <FiSearch className="h-4 w-4 shrink-0" aria-hidden />
              Browse jobs
            </Link>
          </section>
        </aside>
      </main>

      <DashboardFooter />

      {faceVideoUploadSuccess ? (
        <FaceVideoUploadSuccessToast
          onClose={() => setFaceVideoUploadSuccess(null)}
          success={faceVideoUploadSuccess}
        />
      ) : null}
    </div>
  );
}

function ProfileAuthScreen({
  authMessage,
  authMode,
  isLoggingIn,
  isRegistering,
  onGoogleClick,
  onModeChange,
  onSubmit,
}: {
  authMessage: string | null;
  authMode: AuthMode;
  isLoggingIn: boolean;
  isRegistering: boolean;
  onGoogleClick: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isLogin = authMode === "login";

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-64px)] w-full max-w-[1440px] bg-white sm:min-h-[calc(100dvh-72px)] lg:grid-cols-2">
      <section className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex items-center gap-3 sm:mb-8 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-slate-200">
              <Image alt="HireOnDeck logo" className="h-full w-full object-contain" height={40} src="/logo.png" width={40} />
            </span>
            <p className="text-base font-semibold text-slate-950">HireOnDeck</p>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-950 sm:text-[32px]">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isLogin
              ? "Sign in to manage your candidate profile and job applications."
              : "Let’s get started with your candidate workspace."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            {!isLogin ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <AuthField
                  autoComplete="given-name"
                  label="First name"
                  name="firstName"
                  placeholder="Your first name"
                  type="text"
                />
                <AuthField
                  autoComplete="family-name"
                  label="Last name"
                  name="lastName"
                  placeholder="Your last name"
                  type="text"
                />
              </div>
            ) : null}
            <AuthField
              autoComplete="email"
              label="Email address"
              name="email"
              placeholder="Your email address"
              type="email"
            />
            <AuthField
              autoComplete={isLogin ? "current-password" : "new-password"}
              key={`password-${authMode}`}
              label="Password"
              name="password"
              placeholder="Your password"
              type="password"
            />

            {authMessage ? (
              <p className="rounded-full border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
                {authMessage}
              </p>
            ) : null}

            <button
              className="h-12 w-full cursor-pointer rounded-full bg-[#0b0d12] px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoggingIn || isRegistering}
              type="submit"
            >
              {isLogin ? (isLoggingIn ? "Signing in..." : "Sign in") : isRegistering ? "Creating account..." : "Create account"}
            </button>
          </form>

          <button
            className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            onClick={onGoogleClick}
            type="button"
          >
            <FcGoogle className="mr-2 h-5 w-5" aria-hidden />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button
              className="cursor-pointer font-semibold text-slate-950 underline underline-offset-2"
              onClick={() => onModeChange(isLogin ? "register" : "login")}
              type="button"
            >
              {isLogin ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </section>

      <section className="hidden p-4 lg:block lg:p-6">
        <div className="relative flex h-full min-h-[560px] overflow-hidden rounded-[28px] bg-[#0b0d12] text-white xl:min-h-[640px]">
          <Image
            alt="Hiring team meeting candidates in a modern office"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d12] via-[#0b0d12]/75 to-[#0b0d12]/25" />

          <div className="relative z-10 flex w-full flex-col justify-between p-6 xl:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1">
                <Image alt="HireOnDeck logo" className="h-full w-full object-contain" height={44} src="/logo.png" width={44} />
              </span>
              <p className="text-lg font-semibold tracking-tight">HireOnDeck</p>
            </div>

            <div className="pointer-events-none absolute right-8 top-28 hidden w-[230px] rounded-lg border border-white/15 bg-white p-3.5 text-slate-900 shadow-2xl shadow-slate-950/30 xl:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b82f6]">Open role</p>
              <p className="mt-1.5 text-sm font-semibold">Product Designer</p>
              <p className="mt-1 text-xs text-slate-500">Remote · Full-time</p>
              <span className="mt-3 inline-flex h-8 items-center rounded-md bg-[#3b82f6] px-3 text-[11px] font-semibold text-white">
                Apply now
              </span>
            </div>

            <div className="max-w-md">
              <div className="mb-4 flex flex-wrap gap-2">
                {["Open jobs", "Resume upload", "Fast apply"].map((label) => (
                  <span
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white"
                    key={label}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <h2 className="text-[28px] font-semibold leading-tight tracking-tight xl:text-[40px]">
                {isLogin ? "Find your dream job here" : "Start applying to jobs today"}
              </h2>
              <p className="mt-4 text-base leading-7 text-white/80">
                {isLogin
                  ? "Sign in to search roles, upload your resume, and apply with a complete candidate profile."
                  : "Create your profile, add your resume, and match with companies that are hiring now."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileAuthSkeleton() {
  return (
    <main className="mx-auto grid min-h-[calc(100dvh-64px)] w-full max-w-[1440px] bg-white sm:min-h-[calc(100dvh-72px)] lg:grid-cols-2">
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px] space-y-4" aria-busy="true">
          <span className="block h-8 w-56 animate-pulse rounded bg-slate-100" />
          <span className="block h-4 w-72 animate-pulse rounded bg-slate-100" />
          <span className="mt-6 block h-12 w-full animate-pulse rounded-full bg-slate-100" />
          <span className="block h-12 w-full animate-pulse rounded-full bg-slate-100" />
          <span className="block h-12 w-full animate-pulse rounded-full bg-slate-100" />
        </div>
      </section>
      <section className="hidden p-6 lg:block">
        <div className="h-full min-h-[640px] animate-pulse rounded-[28px] bg-slate-100" />
      </section>
    </main>
  );
}

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (isAuthResponse(data)) {
      return getAuthResponseMessage(data);
    }
  }

  return fallback;
}

function getResumeFileName(resumeUrl: string | null) {
  if (!resumeUrl) {
    return "No resume uploaded";
  }

  try {
    const pathname = new URL(resumeUrl).pathname;
    const fileName = pathname.split("/").filter(Boolean).at(-1);

    return fileName ? decodeURIComponent(fileName) : "Resume.pdf";
  } catch {
    return "Resume.pdf";
  }
}

function getProfileInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatExperienceYears(years: number | null, hideWhenEmpty = false) {
  if (years == null) {
    return hideWhenEmpty ? null : "Not specified";
  }

  const label = years === 1 ? "1 year" : `${years} years`;
  return hideWhenEmpty ? `${label} experience` : label;
}

function getVideoDuration(file: File) {
  return new Promise<number>((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
    video.src = objectUrl;
  });
}

function getUploadableFaceVideoFile(file: File) {
  const extension = getFileExtension(file.name);
  const normalizedType = extension ? FACE_VIDEO_MIME_BY_EXTENSION[extension] : undefined;

  if (!normalizedType) {
    return null;
  }

  if (file.type && !file.type.startsWith("video/") && file.type !== "application/octet-stream") {
    return null;
  }

  if (file.type === normalizedType) {
    return file;
  }

  return new File([file], file.name, {
    lastModified: file.lastModified,
    type: normalizedType,
  });
}

function getFileExtension(fileName: string) {
  return fileName.split(".").filter(Boolean).at(-1)?.toLowerCase() ?? "";
}

function getAuthResponseMessage(response: {
  message: string;
  details?: { path: string; message: string }[];
}) {
  const detailMessages = response.details
    ?.map((detail) => detail.message.trim())
    .filter(Boolean);

  if (detailMessages?.length) {
    return detailMessages.join(" ");
  }

  return response.message;
}

function isAuthResponse(value: unknown): value is {
  message: string;
  details?: { path: string; message: string }[];
} {
  return typeof value === "object" && value !== null && "message" in value;
}

function ProfileSection({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-50 text-[#3b82f6]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function UploadButton({
  disabled = false,
  label,
  onChange,
  primary = false,
}: {
  disabled?: boolean;
  label: string;
  onChange: (file: File, knownDuration?: number) => void;
  primary?: boolean;
}) {
  return (
    <label
      className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
        disabled
          ? "cursor-not-allowed bg-slate-100 text-slate-400"
          : primary
            ? "cursor-pointer bg-[#3b82f6] text-white hover:bg-[#2563eb]"
            : "cursor-pointer border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <FiUploadCloud className="h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0">{label}</span>
      <input
        accept=".pdf,.doc,.docx"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onChange(file);
          }

          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}

function VideoVerificationSection({
  disabled,
  message,
  onChange,
  previewUrl,
  uploadLabel,
  videoName,
}: {
  disabled: boolean;
  message: string | null;
  onChange: (file: File, knownDuration?: number) => void;
  previewUrl: string | null;
  uploadLabel: string;
  videoName: string | null;
}) {
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const demoVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedPreviewUrlRef = useRef<string | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingSecondsRef = useRef(0);
  const shouldSaveRecordingRef = useRef(false);
  const demoTimerRef = useRef<number | null>(null);
  const faceTrackerTaskRef = useRef<TrackingTask | null>(null);
  const faceVisibilityStatusRef = useRef<FaceVisibilityStatus>("not-visible");
  const recordingTimerRef = useRef<number | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceVisibilityStatus, setFaceVisibilityStatus] = useState<FaceVisibilityStatus>("not-visible");
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isReviewingRecording, setIsReviewingRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const isCameraOpen = Boolean(cameraStream);
  const captureProgress = Math.min(recordingSeconds / 10, 1);
  const captureStep = getCaptureStep(recordingSeconds, isRecording, Boolean(recordedFile));

  function updateFaceVisibilityStatus(status: FaceVisibilityStatus) {
    faceVisibilityStatusRef.current = status;
    setFaceVisibilityStatus(status);
  }

  useEffect(() => {
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = cameraStream;
    }
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    recordedPreviewUrlRef.current = recordedPreviewUrl;
  }, [recordedPreviewUrl]);

  useEffect(() => {
    return () => {
      stopRecordingTimer(demoTimerRef);
      stopRecordingTimer(recordingTimerRef);
      faceTrackerTaskRef.current?.stop();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordedPreviewUrlRef.current) {
        URL.revokeObjectURL(recordedPreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const video = liveVideoRef.current;

    if (!cameraStream || !video || recordedFile) {
      faceTrackerTaskRef.current?.stop();
      faceTrackerTaskRef.current = null;
      return;
    }

    let isCancelled = false;
    updateFaceVisibilityStatus("loading");

    loadTrackingFaceLibrary()
      .then((trackingRuntime) => {
        if (isCancelled || !liveVideoRef.current) {
          return;
        }

        const tracker = new trackingRuntime.ObjectTracker("face");
        tracker.setInitialScale?.(4);
        tracker.setStepSize?.(2);
        tracker.setEdgesDensity?.(0.1);
        tracker.on("track", (event) => {
          const activeVideo = liveVideoRef.current;

          if (!activeVideo) {
            return;
          }

          const nextStatus = hasProperVisibleFace(event.data, activeVideo) ? "visible" : "not-visible";
          updateFaceVisibilityStatus(nextStatus);
        });

        faceTrackerTaskRef.current?.stop();
        faceTrackerTaskRef.current = trackingRuntime.track(liveVideoRef.current, tracker);
      })
      .catch(() => {
        if (!isCancelled) {
          updateFaceVisibilityStatus("unsupported");
        }
      });

    return () => {
      isCancelled = true;
      faceTrackerTaskRef.current?.stop();
      faceTrackerTaskRef.current = null;
    };
  }, [cameraStream, recordedFile]);

  const stopDemoVideo = () => {
    stopRecordingTimer(demoTimerRef);
    demoVideoRef.current?.pause();
    if (demoVideoRef.current) {
      demoVideoRef.current.currentTime = 0;
    }
    setIsDemoPlaying(false);
  };

  const playDemoVideo = async () => {
    const video = demoVideoRef.current;

    if (!video) {
      return;
    }

    stopRecordingTimer(demoTimerRef);
    video.currentTime = 0;

    try {
      await video.play();
      setIsDemoPlaying(true);
      demoTimerRef.current = window.setTimeout(stopDemoVideo, 10000);
    } catch {
      setIsDemoPlaying(false);
    }
  };

  const openCamera = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      clearRecordedCapture(recordedPreviewUrl, setRecordedFile, setRecordedPreviewUrl, recordedPreviewUrlRef);
      setIsReviewingRecording(false);
      setRecordingSeconds(0);
      updateFaceVisibilityStatus("loading");
      setCameraStream(stream);
    } catch {
      setCameraError("Camera permission was blocked or no camera was found.");
    }
  };

  const closeCamera = (keepRecordedCapture = false) => {
    if (mediaRecorderRef.current?.state === "recording") {
      shouldSaveRecordingRef.current = false;
      mediaRecorderRef.current.stop();
    }

    stopRecordingTimer(recordingTimerRef);
    faceTrackerTaskRef.current?.stop();
    faceTrackerTaskRef.current = null;
    setIsRecording(false);
    if (!keepRecordedCapture) {
      setIsReviewingRecording(false);
    }
    setRecordingSeconds(0);
    updateFaceVisibilityStatus("not-visible");
    recordingSecondsRef.current = 0;
    shouldSaveRecordingRef.current = false;
    recordingChunksRef.current = [];
    mediaRecorderRef.current = null;
    if (!keepRecordedCapture) {
      clearRecordedCapture(recordedPreviewUrl, setRecordedFile, setRecordedPreviewUrl, recordedPreviewUrlRef);
    }
    setCameraStream((stream) => {
      stream?.getTracks().forEach((track) => track.stop());
      return null;
    });
  };

  const startRecording = () => {
    if (!cameraStream) {
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setCameraError("Video recording is not supported in this browser.");
      return;
    }

    if (faceVisibilityStatus !== "visible") {
      setCameraError("Make sure your face is clearly visible before recording.");
      return;
    }

    const mimeType = getSupportedVideoMimeType();
    const mediaRecorder = new MediaRecorder(cameraStream, mimeType ? { mimeType } : undefined);

    recordingChunksRef.current = [];
    recordingSecondsRef.current = 0;
    shouldSaveRecordingRef.current = false;
    clearRecordedCapture(recordedPreviewUrl, setRecordedFile, setRecordedPreviewUrl, recordedPreviewUrlRef);
    setIsReviewingRecording(false);
    setCameraError(null);
    setRecordingSeconds(0);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordingChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const finalRecordingSeconds = recordingSecondsRef.current;

      stopRecordingTimer(recordingTimerRef);
      setIsRecording(false);

      if (!shouldSaveRecordingRef.current) {
        recordingChunksRef.current = [];
        return;
      }

      const blob = new Blob(recordingChunksRef.current, {
        type: "video/webm",
      });

      const file = new File([blob], "verification-video.webm", {
        type: "video/webm",
      });
      const nextRecordedPreviewUrl = URL.createObjectURL(file);

      recordedPreviewUrlRef.current = nextRecordedPreviewUrl;
      setRecordedFile(file);
      setRecordedPreviewUrl(nextRecordedPreviewUrl);
      setIsReviewingRecording(true);
      faceTrackerTaskRef.current?.stop();
      faceTrackerTaskRef.current = null;
      mediaRecorderRef.current = null;
      setCameraStream((stream) => {
        stream?.getTracks().forEach((track) => track.stop());
        return null;
      });
      setRecordingSeconds(finalRecordingSeconds);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((seconds) => {
        const nextSeconds = seconds + 1;
        recordingSecondsRef.current = nextSeconds;

        if (nextSeconds >= 10 && mediaRecorderRef.current?.state === "recording") {
          shouldSaveRecordingRef.current = true;
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }

        return nextSeconds;
      });
    }, 1000);
  };

  const saveRecording = () => {
    if (mediaRecorderRef.current?.state === "recording" && recordingSecondsRef.current >= 10) {
      shouldSaveRecordingRef.current = true;
      mediaRecorderRef.current.stop();
    }
  };

  const uploadRecordedVideo = () => {
    if (recordedFile) {
      onChange(recordedFile, 10);
      clearRecordedCapture(recordedPreviewUrl, setRecordedFile, setRecordedPreviewUrl, recordedPreviewUrlRef);
      setIsReviewingRecording(false);
      setRecordingSeconds(0);
    }
  };

  const retakeRecording = () => {
    clearRecordedCapture(recordedPreviewUrl, setRecordedFile, setRecordedPreviewUrl, recordedPreviewUrlRef);
    setIsReviewingRecording(false);
    openCamera();
  };

  return (
    <div>
        <div className="mb-3 flex flex-wrap gap-2">
            <VerificationBadge tone="green" label="10 sec" />
            <VerificationBadge tone="amber" label="Face visible" />
        </div>

        <div className="mt-3 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-[minmax(230px,270px)_minmax(0,1fr)]">
          <div className="order-2 rounded-lg border border-slate-200 bg-slate-50 p-3 xl:order-1">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-100">
                  <FiCamera className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">Requirements</p>
                  <p className="text-xs text-slate-500">Good light, centered face.</p>
                </div>
              </div>

              <div className="mt-3 grid gap-1.5">
                <InstructionStep value="1" text="Face the camera in good light." />
                <InstructionStep value="2" text="Turn left once, then right." />
              </div>

              <div className="mt-3 grid gap-2">
                <button
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
                    disabled
                      ? "cursor-not-allowed bg-slate-200 text-slate-400"
                      : "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                  }`}
                  disabled={disabled}
                  onClick={openCamera}
                  type="button"
                >
                  <FiCamera className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 text-center">Capture video</span>
                </button>
                <VideoInputButton
                  accept={FACE_VIDEO_ACCEPT}
                  disabled={disabled}
                  icon={FiUploadCloud}
                  label="Upload from gallery"
                  onChange={onChange}
                />
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="break-anywhere text-xs font-medium leading-5 text-slate-600">
                  {videoName ?? uploadLabel}
                </p>
              </div>
              {cameraError && !isCameraOpen && !recordedFile ? (
                <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  {cameraError}
                </p>
              ) : null}
              {message ? (
                <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {message}
                </p>
              ) : null}
            </div>

          {isCameraOpen || isReviewingRecording ? (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-4">
              <div className="mx-auto flex min-h-full w-full items-center justify-center">
                <div className="flex max-h-[calc(100dvh-16px)] w-full max-w-[min(100%,560px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl shadow-slate-950/30 sm:max-h-[calc(100dvh-32px)]">
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-950 sm:text-base">Capture verification video</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">Center your face and record for 10 seconds.</p>
                    </div>
                    <button
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
                      onClick={() => closeCamera()}
                      type="button"
                    >
                      <FiX className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Close camera</span>
                    </button>
                  </div>

                  <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-4">
                    <div className="mx-auto w-full max-w-[420px]">
                      <div className="relative overflow-hidden rounded-lg bg-black">
                        {recordedPreviewUrl ? (
                          <video
                            className="aspect-[4/3] w-full bg-black object-cover"
                            controls
                            key={recordedPreviewUrl}
                            preload="metadata"
                            src={recordedPreviewUrl}
                          >
                            <track kind="captions" />
                          </video>
                        ) : (
                          <video
                            autoPlay
                            className="aspect-[4/3] w-full scale-x-[-1] bg-black object-cover"
                            muted
                            playsInline
                            ref={liveVideoRef}
                          />
                        )}

                        {!recordedPreviewUrl ? (
                          <>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <div
                                className={`aspect-square w-[clamp(112px,34%,160px)] rounded-full border-2 shadow-[0_0_0_999px_rgb(15_23_42_/_0.14)] transition-colors ${
                                  faceVisibilityStatus === "visible" ? "border-emerald-400" : "border-red-400"
                                }`}
                              />
                            </div>
                            <div className="absolute inset-x-0 bottom-3 flex justify-center">
                              <CaptureDirectionCue captureStep={captureStep} />
                            </div>
                          </>
                        ) : null}
                      </div>

                      <div className="mt-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-600">
                            {recordedFile ? "Capture complete" : formatRecordingTime(recordingSeconds)}
                          </p>
                          <p className="text-xs font-medium text-slate-400">10 sec</p>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              recordedFile ? "bg-emerald-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${Math.round(captureProgress * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:mt-4 sm:flex sm:justify-end">
                        {recordedFile ? (
                          <>
                            <button
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 sm:w-auto"
                              onClick={uploadRecordedVideo}
                              type="button"
                            >
                              <FiUploadCloud className="h-4 w-4" aria-hidden />
                              Upload video
                            </button>
                            <button
                              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                              onClick={retakeRecording}
                              type="button"
                            >
                              <FiRefreshCw className="mr-2 h-4 w-4" aria-hidden />
                              Retake video
                            </button>
                          </>
                        ) : isRecording ? (
                          <button
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-40"
                            disabled={recordingSeconds < 10}
                            onClick={saveRecording}
                            type="button"
                          >
                            <FiSquare className="h-4 w-4" aria-hidden />
                            {recordingSeconds < 10 ? `Complete in ${10 - recordingSeconds}s` : "Finish recording"}
                          </button>
                        ) : (
                          <button
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:min-w-40"
                            disabled={faceVisibilityStatus !== "visible"}
                            onClick={startRecording}
                            type="button"
                          >
                            <FiVideo className="h-4 w-4" aria-hidden />
                            Start 10 sec capture
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          </div>

          <div className="order-1 min-w-0 xl:order-2">
            <div className="relative overflow-hidden rounded-lg bg-slate-950 shadow-md shadow-slate-200">
              {previewUrl ? (
                <video className="h-44 w-full bg-black object-cover sm:h-56 lg:h-64" controls src={previewUrl}>
                  <track kind="captions" />
                </video>
              ) : (
                <div className="relative bg-slate-950">
                  <video
                    className="h-44 w-full bg-black object-cover sm:h-56 lg:h-64"
                    muted
                    onEnded={stopDemoVideo}
                    playsInline
                    preload="metadata"
                    ref={demoVideoRef}
                    src="/verification-demo.mp4#t=0.1"
                  >
                    <track kind="captions" />
                  </video>
                  {!isDemoPlaying ? (
                    <button
                      className="absolute inset-0 grid place-items-center bg-slate-950/35 text-white transition hover:bg-slate-950/45"
                      onClick={playDemoVideo}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-slate-950/20">
                        <FiPlay className="h-4 w-4" aria-hidden />
                        Show demo
                      </span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

function getSupportedVideoMimeType() {
  const mimeTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

function loadTrackingFaceLibrary() {
  if (window.tracking?.ObjectTracker) {
    return Promise.resolve(window.tracking);
  }

  if (!window.__trackingFacePromise) {
    window.__trackingFacePromise = loadScript("/tracking/tracking-min.js")
      .then(() => loadScript("/tracking/face-min.js"))
      .then(() => {
        if (!window.tracking?.ObjectTracker) {
          throw new Error("Tracking library did not load.");
        }

        return window.tracking;
      });
  }

  return window.__trackingFacePromise;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}

function hasProperVisibleFace(faces: TrackingRect[], video: HTMLVideoElement) {
  if (faces.length === 0 || video.videoWidth === 0 || video.videoHeight === 0) {
    return false;
  }

  const largestFace = faces.reduce((largest, face) =>
    face.width * face.height > largest.width * largest.height ? face : largest,
  );
  const minFaceWidth = video.videoWidth * 0.08;
  const minFaceHeight = video.videoHeight * 0.08;
  const faceCenterX = largestFace.x + largestFace.width / 2;
  const faceCenterY = largestFace.y + largestFace.height / 2;
  const isLargeEnough = largestFace.width >= minFaceWidth && largestFace.height >= minFaceHeight;
  const isCentered =
    faceCenterX >= video.videoWidth * 0.08 &&
    faceCenterX <= video.videoWidth * 0.92 &&
    faceCenterY >= video.videoHeight * 0.08 &&
    faceCenterY <= video.videoHeight * 0.92;

  return isLargeEnough && isCentered;
}

function VerificationBadge({ label, tone }: { label: string; tone: "amber" | "blue" | "green" }) {
  const toneClasses = {
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex h-8 items-center justify-center rounded-md border px-3 text-[11px] font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function FaceVideoStatusLoader() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <FiVideo className="h-4 w-4 animate-pulse" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">Checking verification video</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">Please wait while we load your upload status.</p>
      </div>
      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
    </div>
  );
}

function FaceVideoUploadSuccessToast({
  onClose,
  success,
}: {
  onClose: () => void;
  success: NonNullable<FaceVideoUploadSuccess>;
}) {
  return (
    <div className="fixed inset-x-0 top-4 z-[70] flex justify-center px-3 sm:top-6" role="status" aria-live="polite">
      <div className="w-full max-w-[440px] overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-2xl shadow-slate-950/15">
        <div className="h-1 bg-emerald-500" />
        <div className="flex gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
            <FiCheck className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">Video uploaded successfully</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{success.message}</p>
              </div>
              <button
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={onClose}
                type="button"
              >
                <FiX className="h-4 w-4" aria-hidden />
                <span className="sr-only">Close notification</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCaptureStep(seconds: number, isRecording: boolean, isComplete: boolean): CaptureStep {
  if (isComplete) {
    return "complete";
  }

  if (!isRecording) {
    return "ready";
  }

  if (seconds < 3) {
    return "center";
  }

  if (seconds < 6) {
    return "left";
  }

  if (seconds < 10) {
    return "right";
  }

  return "complete";
}

function clearRecordedCapture(
  previewUrl: string | null,
  setRecordedFile: (file: File | null) => void,
  setRecordedPreviewUrl: (url: string | null) => void,
  previewUrlRef?: { current: string | null },
) {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  if (previewUrlRef) {
    previewUrlRef.current = null;
  }
  setRecordedFile(null);
  setRecordedPreviewUrl(null);
}

function CaptureDirectionCue({ captureStep }: { captureStep: CaptureStep }) {
  if (captureStep === "complete") {
    return (
      <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-black/25">
        <FiCheck className="h-5 w-5" aria-hidden />
      </div>
    );
  }

  if (captureStep === "left") {
    return (
      <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950 shadow-lg shadow-black/25">
        <FiArrowLeft className="h-5 w-5" aria-hidden />
      </div>
    );
  }

  if (captureStep === "right") {
    return (
      <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950 shadow-lg shadow-black/25">
        <FiArrowRight className="h-5 w-5" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-slate-950 shadow-lg shadow-black/25">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
    </div>
  );
}

function formatRecordingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function stopRecordingTimer(timerRef: { current: number | null }) {
  if (timerRef.current) {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

function InstructionStep({ text, value }: { text: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
        {value}
      </span>
      <span className="min-w-0 text-xs font-medium leading-5 text-slate-600">{text}</span>
    </div>
  );
}

function VideoInputButton({
  accept,
  disabled,
  icon: Icon,
  label,
  onChange,
}: {
  accept: string;
  disabled: boolean;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  onChange: (file: File) => void;
}) {
  return (
    <label
      className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "cursor-pointer border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-100 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0 text-center">{label}</span>
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onChange(file);
          }

          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}

function UploadedDocument({
  complete = false,
  fileName,
  icon: Icon = FiFileText,
  title,
  url,
}: {
  complete?: boolean;
  fileName: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  url: string | null;
}) {
  const content = (
    <>
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
          complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {title}
        </p>
        <p className="break-anywhere mt-0.5 text-sm font-medium text-slate-800">{fileName}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[11px] font-semibold ${
          complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {complete ? "Uploaded" : "Missing"}
      </span>
    </>
  );

  if (!url) {
    return (
      <article className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 sm:px-4">
        {content}
      </article>
    );
  }

  return (
    <a
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 transition hover:border-blue-200 hover:bg-white sm:px-4"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}

function StatusRow({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
          complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {complete ? <FiCheck className="h-3.5 w-3.5" aria-hidden /> : null}
        {complete ? "Complete" : "Pending"}
      </span>
    </div>
  );
}

function AuthField({
  autoComplete,
  label,
  name,
  placeholder,
  type,
}: {
  autoComplete: string;
  label: string;
  name: string;
  placeholder: string;
  type: string;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && isPasswordVisible ? "text" : type;

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <span className="mt-2 flex h-12 items-center rounded-full border border-slate-200 bg-white px-4 transition focus-within:border-[#3b82f6] focus-within:ring-2 focus-within:ring-blue-100">
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          name={name}
          placeholder={placeholder}
          required
          type={inputType}
        />
        {isPasswordField ? (
          <button
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
            type="button"
          >
            {isPasswordVisible ? (
              <FiEyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <FiEye className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </span>
    </label>
  );
}
