import Link from "next/link";
import Image from "next/image";

const footerColumns = [
  {
    title: "Jobs by Location",
    links: ["Jobs in Bangalore", "Jobs in Delhi / NCR", "Jobs in Hyderabad", "Jobs in Mumbai"],
  },
  {
    title: "Jobs by Function",
    links: ["Software Engineering Jobs", "Marketing Jobs", "Sales Jobs", "Internship Jobs"],
  },
  {
    title: "For Employers",
    links: ["Post Your Jobs", "Success Stories", "Product Academy", "Resources"],
  },
  {
    title: "HireOnDeck",
    links: ["Workspace", "About", "Privacy", "Terms"],
  },
  {
    title: "Connect",
    links: ["Help Center", "Contact Us"],
  },
];

export function DashboardFooter() {
  return (
    <footer className="mt-8 border-t border-slate-200/80 bg-white/80 sm:mt-10">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-7 sm:px-6 sm:py-8">
        <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <div>
            <Link aria-label="HireOnDeck home" className="flex w-fit items-center" href="/">
              <Image
                alt="HireOnDeck"
                className="h-14 w-14 object-contain"
                height={56}
                src="/logo.png"
                width={56}
              />
            </Link>
            <p className="mt-2 max-w-[220px] text-[13px] leading-6 text-slate-500">
              Matched jobs and candidate workspace for modern hiring.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-[12px] text-slate-500 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="mb-3 text-[12px] font-semibold text-slate-900">{column.title}</h2>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link className="transition hover:text-slate-900" href="#">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 HireOnDeck dashboard.</p>
          <div className="flex flex-wrap gap-4">
            <Link className="hover:text-slate-900" href="#">
              Privacy
            </Link>
            <Link className="hover:text-slate-900" href="#">
              Terms
            </Link>
            <Link className="hover:text-slate-900" href="#">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
