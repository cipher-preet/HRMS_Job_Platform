"use client";

import type { ComponentType, FormEvent } from "react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import {
  FiAlertCircle,
  FiFileText,
  FiLock,
  FiLogOut,
  FiMail,
  FiPaperclip,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import { DashboardFooter } from "../_components/dashboard-footer";
import { DashboardHeader } from "../_components/dashboard-header";
import {
  useCandidateLoginMutation,
  useCandidateRegisterMutation,
  useGetCandidateSessionQuery,
  useUploadCandidateResumeMutation,
} from "../_redux/api/AuthApi";

type AuthMode = "login" | "register";

const AUTH_STORAGE_KEY = "hireondeck-auth";
export default function ProfilePage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isLocallySignedOut, setIsLocallySignedOut] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeUploadMessage, setResumeUploadMessage] = useState<string | null>(null);
  const [candidateLogin, { isLoading: isLoggingIn }] = useCandidateLoginMutation();
  const [candidateRegister, { isLoading: isRegistering }] = useCandidateRegisterMutation();
  const [uploadCandidateResume, { isLoading: isUploadingResume }] = useUploadCandidateResumeMutation();
  const {
    data: candidateSession,
    isLoading: isSessionLoading,
    refetch: refetchCandidateSession,
  } = useGetCandidateSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const candidate =
    !isLocallySignedOut && candidateSession?.success ? candidateSession.data?.candidate : undefined;
  const isSignedIn = Boolean(candidate);
  const basicDetails = [
    { icon: FiUser, label: "Full name", value: candidate?.name ?? "Not specified" },
    { icon: FiMail, label: "Email", value: candidate?.email ?? "Not specified" },
  ];
  const resumeUrl = candidate?.resumeUrl ?? null;
  const visibleResumeName = resumeName ?? getResumeFileName(resumeUrl);

  const signIn = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "signed-in");
    setIsLocallySignedOut(false);
  };

  const signOut = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "signed-out");
    setIsLocallySignedOut(true);
    setAuthMode("login");
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

  return (
    <div className="min-h-screen text-slate-700">
      <DashboardHeader />

      <main className="mx-auto grid w-full max-w-[1200px] gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-6">
        <section className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-4 shadow-sm shadow-blue-100/50 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-500">
                  Candidate profile
                </p>
                <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-slate-950">
                  {isSessionLoading ? "Checking session..." : isSignedIn ? candidate?.name : "Welcome back"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {isSessionLoading
                    ? "Validating your candidate session."
                    : isSignedIn
                    ? "Upload your documents and review the basic details recruiters will see."
                    : "Log in or register to manage your candidate workspace."}
                </p>
              </div>

              {isSignedIn ? (
                <button
                  className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                  onClick={() => setShowSignOutConfirm(true)}
                  type="button"
                >
                  <FiLogOut className="mr-2 h-4 w-4 text-slate-400" aria-hidden />
                  Sign out
                </button>
              ) : null}
            </div>
          </div>

          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
            <div className="grid gap-3">
              <UploadButton
                disabled={!isSignedIn || isUploadingResume}
                label="Upload resume"
                onChange={handleResumeUpload}
              />
              {resumeUploadMessage ? (
                <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {resumeUploadMessage}
                </p>
              ) : null}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <h2 className="text-base font-semibold text-slate-950">Uploaded documents</h2>
              <div className="mt-3 grid gap-3">
                <UploadedDocument fileName={visibleResumeName} title="Resume" url={resumeUrl} />
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <h2 className="text-base font-semibold text-slate-950">Basic details</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {basicDetails.map((detail) => (
                  <BasicDetail
                    icon={detail.icon}
                    key={detail.label}
                    label={detail.label}
                    value={detail.value}
                  />
                ))}
              </div>
            </div>
          </section>
        </section>

        {!isSessionLoading && !isSignedIn ? (
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
            <div className="border-b border-slate-100 bg-blue-50/40 p-4">
              <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                    isLogin
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                      : "text-slate-500 hover:bg-white hover:text-slate-800"
                  }`}
                  onClick={() => {
                    setAuthMessage(null);
                    setAuthMode("login");
                  }}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                    !isLogin
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                      : "text-slate-500 hover:bg-white hover:text-slate-800"
                  }`}
                  onClick={() => {
                    setAuthMessage(null);
                    setAuthMode("register");
                  }}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-500">
                {isLogin ? "Login" : "Register"}
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.01em] text-slate-950">
                {isLogin ? "Login" : "Register"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isLogin
                  ? "Access your saved jobs, profile and recruiter messages."
                  : "Create your candidate profile and start matching with companies."}
              </p>

              <button
                className="mt-5 flex h-11 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  signIn();
                  refetchCandidateSession();
                }}
                type="button"
              >
                <FcGoogle className="mr-2 h-5 w-5" aria-hidden />
                {isLogin ? "Login with Google" : "Register with Google"}
              </button>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  or
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form
                className="space-y-4"
                onSubmit={handleAuthSubmit}
              >
                {!isLogin ? (
                  <>
                    <AuthField
                      autoComplete="given-name"
                      icon={FiUser}
                      label="First name"
                      name="firstName"
                      placeholder="Enter your first name"
                      type="text"
                    />
                    <AuthField
                      autoComplete="family-name"
                      icon={FiUser}
                      label="Last name"
                      name="lastName"
                      placeholder="Enter your last name"
                      type="text"
                    />
                  </>
                ) : null}
                <AuthField
                  autoComplete="email"
                  icon={FiMail}
                  label="Email address"
                  name="email"
                  placeholder="Enter your email"
                  type="email"
                />
                <AuthField
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  icon={FiLock}
                  label="Password"
                  name="password"
                  placeholder="Enter your password"
                  type="password"
                />

                {authMessage ? (
                  <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    {authMessage}
                  </p>
                ) : null}

                <button
                  className="h-10 w-full rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isLoggingIn || isRegistering}
                  type="submit"
                >
                  {isLogin ? (isLoggingIn ? "Logging in..." : "Login") : isRegistering ? "Registering..." : "Register"}
                </button>
              </form>
            </div>
          </section>
        </aside>
        ) : null}
      </main>

      <DashboardFooter />

      {showSignOutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5 sm:px-4">
          <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/15 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                  <FiAlertCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Sign out?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You will be signed out of this candidate workspace.
                  </p>
                </div>
              </div>
              <button
                aria-label="Close sign out confirmation"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setShowSignOutConfirm(false)}
                type="button"
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-md px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setShowSignOutConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                onClick={() => {
                  signOut();
                  setShowSignOutConfirm(false);
                }}
                type="button"
              >
                Yes, sign out
              </button>
            </div>
          </section>
        </div>
      ) : null}

    </div>
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

function UploadButton({
  disabled = false,
  label,
  onChange,
}: {
  disabled?: boolean;
  label: string;
  onChange: (file: File) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-blue-200 hover:bg-blue-50/40"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <FiUploadCloud className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">{label}</span>
          <span className="mt-0.5 block text-xs text-slate-500">PDF, DOC or DOCX</span>
        </span>
      </span>
      <FiPaperclip className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
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

function UploadedDocument({
  fileName,
  title,
  url,
}: {
  fileName: string;
  title: string;
  url: string | null;
}) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-slate-500 ring-1 ring-slate-100">
        <FiFileText className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {title}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{fileName}</p>
      </div>
    </>
  );

  if (!url) {
    return (
      <article className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
        {content}
      </article>
    );
  }

  return (
    <a
      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}

function BasicDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function AuthField({
  autoComplete,
  icon: Icon,
  label,
  name,
  placeholder,
  type,
}: {
  autoComplete: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  name: string;
  placeholder: string;
  type: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <span className="mt-2 flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <Icon className="mr-2 h-4 w-4 text-slate-400" aria-hidden />
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          name={name}
          placeholder={placeholder}
          required
          type={type}
        />
      </span>
    </label>
  );
}
