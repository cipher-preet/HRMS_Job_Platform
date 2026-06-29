import { DashboardFooter } from "./dashboard-footer";
import { DashboardHeader } from "./dashboard-header";

export function DashboardPlaceholderPage({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="min-h-screen text-slate-700">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-[1200px] px-3 py-6 sm:px-6 sm:py-7">
        <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-4 shadow-sm shadow-blue-100/50 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-600">
            HireOnDeck workspace
          </p>
          <h1 className="break-anywhere mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="break-anywhere mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item} className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
              <div className="h-2 w-16 rounded-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8]" />
              <h2 className="break-anywhere mt-5 text-lg font-semibold text-slate-900">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This route is ready for the next frontend section and uses the same
                reusable dashboard shell.
              </p>
            </article>
          ))}
        </section>
      </main>
      <DashboardFooter />
    </div>
  );
}
