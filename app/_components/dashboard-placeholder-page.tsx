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
    <div className="min-h-screen bg-[#eef2f8] text-slate-700">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-[1440px] px-3 py-8 sm:px-6 sm:py-10">
        <section className="rounded-[22px] bg-white p-5 shadow-[0_10px_40px_rgb(15_23_42_/_0.05)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3b82f6]">
            HireOnDeck workspace
          </p>
          <h1 className="break-anywhere mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          <p className="break-anywhere mt-3 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item} className="min-w-0 rounded-[22px] bg-white p-5 shadow-[0_10px_40px_rgb(15_23_42_/_0.05)] sm:p-6">
              <div className="h-2 w-16 rounded-full bg-[#3b82f6]" />
              <h2 className="break-anywhere mt-5 text-lg font-semibold text-slate-950">{item}</h2>
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
