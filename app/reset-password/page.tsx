"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";
import { PasswordRecoveryShell } from "../_components/password-recovery-shell";
import { useCandidateResetPasswordMutation } from "../_redux/api/AuthApi";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const [resetPassword, { isLoading }] = useCandidateResetPasswordMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const response = await resetPassword({
        token,
        password,
        confirmPassword,
      }).unwrap();
      setMessage(response.message);
      setResetComplete(true);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to reset candidate password"));
    }
  };

  return (
    <PasswordRecoveryShell
      subtitle="Choose a new password for your candidate account."
      title="Reset password"
    >
      {!token ? (
        <StatusMessage
          icon={FiAlertCircle}
          message="This password reset link is invalid or incomplete."
          tone="error"
        />
      ) : resetComplete ? (
        <div className="space-y-4">
          <StatusMessage
            icon={FiCheckCircle}
            message={message ?? "Candidate password reset successfully"}
            tone="success"
          />
          <Link
            className="flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/profile"
          >
            Continue to login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordField
            autoComplete="new-password"
            label="New password"
            name="password"
            onToggle={() => setShowPassword((visible) => !visible)}
            showPassword={showPassword}
          />
          <PasswordField
            autoComplete="new-password"
            label="Confirm new password"
            name="confirmPassword"
            onToggle={() => setShowPassword((visible) => !visible)}
            showPassword={showPassword}
          />
          {message ? (
            <StatusMessage icon={FiAlertCircle} message={message} tone="error" />
          ) : null}
          <button
            className="h-11 w-full rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}

type PasswordFieldProps = {
  autoComplete: string;
  label: string;
  name: string;
  onToggle: () => void;
  showPassword: boolean;
};

function PasswordField({
  autoComplete,
  label,
  name,
  onToggle,
  showPassword,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700" htmlFor={name}>
        {label}
      </label>
      <div className="relative mt-2">
        <FiLock
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          autoComplete={autoComplete}
          className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          id={name}
          minLength={8}
          name={name}
          required
          type={showPassword ? "text" : "password"}
        />
        <button
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          onClick={onToggle}
          title={showPassword ? "Hide password" : "Show password"}
          type="button"
        >
          {showPassword ? (
            <FiEyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <FiEye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

type StatusMessageProps = {
  icon: typeof FiAlertCircle;
  message: string;
  tone: "error" | "success";
};

function StatusMessage({ icon: Icon, message, tone }: StatusMessageProps) {
  const colors =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-red-100 bg-red-50 text-red-700";

  return (
    <div className={`flex gap-3 rounded-md border px-3 py-3 text-sm ${colors}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  }

  return fallback;
}
