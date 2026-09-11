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
    <footer className="mt-8 border-t border-slate-200/70 bg-white sm:mt-10">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <div>
            <Link aria-label="HireOnDeck home" className="flex w-fit items-center gap-2.5" href="/">
              <Image
                alt="HireOnDeck"
                className="h-11 w-11 object-contain"
                height={44}
                src="/logo.png"
                width={44}
              />
              <span className="text-sm font-semibold text-slate-950">HireOnDeck</span>
            </Link>
            <p className="mt-3 max-w-[240px] text-[13px] leading-6 text-slate-500">
              A modern candidate workspace for discovering roles and applying with a complete profile.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-[13px] text-slate-500 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="mb-3 text-[13px] font-semibold text-slate-900">{column.title}</h2>
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

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 HireOnDeck.</p>
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
