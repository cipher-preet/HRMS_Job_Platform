"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FiAlertCircle, FiBriefcase, FiLogOut, FiUpload, FiUser, FiX } from "react-icons/fi";
import { useGetCandidateSessionQuery, useUploadCandidateResumeMutation } from "../_redux/api/AuthApi";

const navItems = [
  { label: "Jobs", href: "/", badge: "15", icon: FiBriefcase },
  { label: "Profile", href: "/profile", icon: FiUser },
];

const AUTH_STORAGE_KEY = "hireondeck-auth";

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isLocallySignedOut, setIsLocallySignedOut] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ title: string; message: string } | null>(null);
  const { data: candidateSession, refetch: refetchCandidateSession } = useGetCandidateSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [uploadCandidateResume, { isLoading: isUploadingResume }] = useUploadCandidateResumeMutation();
  const isSignedIn = !isLocallySignedOut && Boolean(candidateSession?.success);

  const handleResumeUpload = async (file: File) => {
    if (!isSignedIn) {
      setUploadMessage({
        title: "Login required",
        message: "Please login first before uploading your resume.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await uploadCandidateResume(formData).unwrap();

      if (!response.success) {
        setUploadMessage({
          title: "Upload failed",
          message: response.message,
        });
        return;
      }

      setUploadMessage({
        title: "Resume uploaded",
        message: response.message,
      });
      refetchCandidateSession();
    } catch {
      setUploadMessage({
        title: "Upload failed",
        message: "Unable to upload resume.",
      });
    }
  };

  const handleConfirmSignOut = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "signed-out");
    setIsLocallySignedOut(true);
    setShowSignOutConfirm(false);
    router.push("/profile");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2.5 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link className="flex w-fit items-center gap-2.5" href="/">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
              <Image
                alt="HireOnDeck logo"
                className="h-full w-full object-contain"
                height={48}
                priority
                src="/logo.png"
                width={48}
              />
            </span>
            <span className="flex min-w-0 flex-col justify-center">
              <span className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-slate-950 sm:text-lg">
                HireOnDeck
              </span>
              <span className="mt-0.5 hidden text-[9px] font-semibold uppercase leading-4 tracking-[0.16em] text-slate-400 sm:block">
                Opportunities open. Careers begin.
              </span>
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="thin-scrollbar flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 text-[11px] font-semibold lg:w-auto"
          >
            <label
              className={`flex h-9 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3.5 text-white shadow-sm shadow-blue-200 transition ${
                isUploadingResume ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-blue-700"
              }`}
            >
              <FiUpload className="h-3.5 w-3.5" aria-hidden />
              <span className="whitespace-nowrap">{isUploadingResume ? "Uploading..." : "Upload resume"}</span>
              <input
                accept=".pdf,.doc,.docx"
                className="sr-only"
                disabled={isUploadingResume}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    handleResumeUpload(file);
                  }

                  event.target.value = "";
                }}
                type="file"
              />
            </label>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 transition ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                  }`}
                  href={item.href}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] leading-none text-blue-700 ring-1 ring-blue-100">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            {isSignedIn ? (
              <button
                className="flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
                onClick={() => setShowSignOutConfirm(true)}
                type="button"
              >
                <FiLogOut className="h-3.5 w-3.5" aria-hidden />
                <span className="whitespace-nowrap">Sign Out</span>
              </button>
            ) : null}
          </nav>
        </div>
      </header>

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
                className="rounded-lg px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setShowSignOutConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                onClick={handleConfirmSignOut}
                type="button"
              >
                Yes, sign out
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {uploadMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5 sm:px-4">
          <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/15 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{uploadMessage.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{uploadMessage.message}</p>
              </div>
              <button
                aria-label="Close resume upload message"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setUploadMessage(null)}
                type="button"
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                onClick={() => setUploadMessage(null)}
                type="button"
              >
                Got it
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
