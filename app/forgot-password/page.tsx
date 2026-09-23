"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import { PasswordRecoveryShell } from "../_components/password-recovery-shell";
import { useCandidateForgotPasswordMutation } from "../_redux/api/AuthApi";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [requestReset, { isLoading }] = useCandidateForgotPasswordMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const response = await requestReset({ email }).unwrap();
      setMessage(response.message);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to request a password reset"));
    }
  };

  return (
    <PasswordRecoveryShell
      subtitle="Enter the email used for your candidate account."
      title="Forgot password"
    >
      {message ? (
        <div className="flex gap-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{message}</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <FiMail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              autoComplete="email"
              className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>
          <button
            className="h-11 w-full rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
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
