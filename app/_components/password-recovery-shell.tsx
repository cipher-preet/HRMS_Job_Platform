import type { ReactNode } from "react";
import Link from "next/link";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import { DashboardFooter } from "./dashboard-footer";
import { DashboardHeader } from "./dashboard-header";

type PasswordRecoveryShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function PasswordRecoveryShell({
  children,
  title,
  subtitle,
}: PasswordRecoveryShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-[#2f3747]">
      <DashboardHeader />
      <main className="flex flex-1 items-center justify-center px-3 py-10 sm:px-4">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
            <FiShield className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <Link
            className="mt-6 inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            href="/profile"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to candidate login
          </Link>
        </section>
      </main>
      <DashboardFooter />
    </div>
  );
}
