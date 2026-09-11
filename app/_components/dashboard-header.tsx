"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiLogOut, FiMenu, FiUpload, FiUser, FiX } from "react-icons/fi";
import { useCandidateSignOut } from "../_hooks/use-candidate-sign-out";
import { useGetCandidateSessionQuery, useUploadCandidateResumeMutation } from "../_redux/api/AuthApi";

const navItems = [
  { label: "Find Jobs", href: "/" },
  { label: "Profile", href: "/profile" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ title: string; message: string } | null>(null);
  const { data: candidateSession, refetch: refetchCandidateSession } = useGetCandidateSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [uploadCandidateResume, { isLoading: isUploadingResume }] = useUploadCandidateResumeMutation();
  const { isSigningOut, signOut } = useCandidateSignOut();
  const candidate = candidateSession?.success ? candidateSession.data?.candidate : undefined;
  const isSignedIn = Boolean(candidate);
  const displayName = candidate?.name?.trim() || "Candidate";
  const initials = getInitials(displayName);

  const closeMenus = () => {
    setIsMobileNavOpen(false);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

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

  const handleConfirmSignOut = async () => {
    await signOut();
    setShowSignOutConfirm(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0b0d12] text-white">
        <div className="relative mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-4 sm:px-6">
          <Link className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5" href="/" onClick={closeMenus}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 sm:h-11 sm:w-11">
              <Image
                alt="HireOnDeck logo"
                className="h-full w-full object-contain"
                height={44}
                priority
                src="/logo.png"
                width={44}
              />
            </span>
            <span className="hidden truncate text-[15px] font-semibold tracking-tight text-white min-[400px]:inline sm:text-base">
              HireOnDeck
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 lg:gap-8 md:flex"
          >
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={`relative whitespace-nowrap pb-1 text-sm font-semibold after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#3b82f6] after:transition ${
                    isActive ? "after:opacity-100" : "after:opacity-0 hover:after:opacity-50"
                  }`}
                  href={item.href}
                  onClick={closeMenus}
                  style={{ color: "#ffffff" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="relative flex shrink-0 items-center justify-end gap-2" ref={menuRef}>
            {isSignedIn ? (
              <button
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 text-left transition hover:bg-white/10"
                onClick={() => {
                  setIsUserMenuOpen((open) => !open);
                }}
                type="button"
              >
                <span className="hidden max-w-[140px] truncate text-sm font-semibold text-white lg:block">{displayName}</span>
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[11px] font-semibold text-white">
                  {initials}
                </span>
              </button>
            ) : (
              <Link
                className="inline-flex h-9 items-center rounded-full bg-[#3b82f6] px-3 text-xs font-semibold text-white transition hover:bg-[#2563eb] sm:h-10 sm:px-4 sm:text-[13px]"
                href="/profile"
                onClick={closeMenus}
                style={{ color: "#ffffff" }}
              >
                Sign in
              </Link>
            )}

            <button
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10 md:hidden"
              onClick={() => setIsMobileNavOpen(true)}
              type="button"
            >
              <FiMenu className="h-5 w-5" aria-hidden />
            </button>

            {isUserMenuOpen && isSignedIn ? (
              <div className="header-menu absolute right-0 top-[48px] z-50 w-[min(calc(100vw-24px),240px)] overflow-hidden rounded-2xl border border-slate-100 bg-white py-1.5 text-slate-700 shadow-2xl shadow-slate-950/15 sm:top-[52px]">
                <Link
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium hover:bg-slate-50"
                  href="/profile"
                  onClick={closeMenus}
                  style={{ color: "#334155" }}
                >
                  <FiUser className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span>View profile</span>
                </Link>
                <label
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition ${
                    isUploadingResume ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-slate-50"
                  }`}
                >
                  <FiUpload className="h-4 w-4 text-slate-400" aria-hidden />
                  {isUploadingResume ? "Uploading..." : "Upload resume"}
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
                      setIsUserMenuOpen(false);
                    }}
                    type="file"
                  />
                </label>
                <button
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  disabled={isSigningOut}
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setShowSignOutConfirm(true);
                  }}
                  type="button"
                >
                  <FiLogOut className="h-4 w-4 text-slate-400" aria-hidden />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 md:hidden ${isMobileNavOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <button
          aria-label="Close menu"
          className={`absolute inset-0 bg-slate-950/50 transition-opacity ${isMobileNavOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMobileNavOpen(false)}
          type="button"
        />
        <section
          className={`absolute inset-y-0 right-0 flex w-[min(86vw,320px)] flex-col bg-[#0b0d12] p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-transform duration-300 ${
            isMobileNavOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Menu</p>
            <button
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              onClick={() => setIsMobileNavOpen(false)}
              type="button"
            >
              <FiX className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <nav className="mt-6 grid gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  href={item.href}
                  onClick={closeMenus}
                  style={{ color: "#ffffff" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </section>
      </div>

      {showSignOutConfirm ? (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-5 sm:px-4">
          <section className="modal-panel-enter w-full max-w-md rounded-[22px] border border-slate-100 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-500">
                  <FiAlertCircle className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-950">Sign out?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
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
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setShowSignOutConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-[#0b0d12] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSigningOut}
                onClick={handleConfirmSignOut}
                type="button"
              >
                {isSigningOut ? "Signing out..." : "Yes, sign out"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {uploadMessage ? (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-5 sm:px-4">
          <section className="modal-panel-enter w-full max-w-md rounded-[22px] border border-slate-100 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-950">{uploadMessage.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{uploadMessage.message}</p>
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
                className="rounded-full bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
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

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
