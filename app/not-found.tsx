import Link from "next/link";
import { FiArrowRight, FiBriefcase, FiHome, FiSearch, FiUser } from "react-icons/fi";
import { DashboardFooter } from "./_components/dashboard-footer";
import { DashboardHeader } from "./_components/dashboard-header";

const quickLinks = [
  {
    href: "/",
    title: "Browse jobs",
    description: "Return to the latest software, remote and startup jobs.",
    icon: FiBriefcase,
  },
  {
    href: "/profile",
    title: "Candidate profile",
    description: "Upload your resume and keep your profile ready for applications.",
    icon: FiUser,
  },
];

export default function NotFound() {
  return (
    <div className="min-h-screen text-slate-700">
      <DashboardHeader />

      <main className="mx-auto w-full max-w-[1200px] px-3 py-6 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm shadow-blue-100/50">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            <div className="min-w-0 px-4 py-8 sm:px-8 sm:py-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
                <FiSearch className="h-3.5 w-3.5" aria-hidden />
                404 not found
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-semibold text-slate-950 sm:text-4xl">
                This page is not available
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                The link may be broken, moved or no longer published. You can continue from the jobs board or manage your candidate profile.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
                  href="/"
                >
                  <FiHome className="mr-2 h-4 w-4" aria-hidden />
                  Go to jobs
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700"
                  href="/profile"
                >
                  Open profile
                  <FiArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <aside className="min-w-0 border-t border-blue-100 bg-blue-50/50 p-4 sm:p-6 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-500">
                Quick paths
              </p>
              <div className="mt-4 grid gap-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      className="group rounded-lg border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/40 transition hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/70"
                      href={link.href}
                      key={link.href}
                    >
                      <span className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="break-anywhere block text-sm font-semibold text-slate-950">
                            {link.title}
                          </span>
                          <span className="break-anywhere mt-1 block text-xs leading-5 text-slate-500">
                            {link.description}
                          </span>
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>
      </main>

      <DashboardFooter />
    </div>
  );
}
