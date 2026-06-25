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
      <main className="mx-auto w-full max-w-[1200px] px-4 py-7 sm:px-6">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-5 shadow-sm shadow-blue-100/50 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-600">
            HireOnDeck workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article key={item} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
              <div className="h-2 w-16 rounded-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8]" />
              <h2 className="mt-5 text-lg font-semibold text-slate-900">{item}</h2>
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
