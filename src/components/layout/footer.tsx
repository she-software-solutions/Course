import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { Logo } from "@/components/layout/logo";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "All courses" },
      { href: "/courses?price=free", label: "Free courses" },
      { href: "/internships", label: "Internships" },
      { href: "/events", label: "Workshops & events" },
      { href: "/verify", label: "Verify a certificate" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/teach", label: "Teach with us" },
      { href: "/contact", label: "Contact" },
      { href: site.website, label: "Our IT services" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/legal/terms", label: "Terms of use" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/refunds", label: "Refund policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
        <div>
          <Logo invert height={52} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            Empowering students, freshers and professionals with accessible, ethical and industry-ready learning. A women-led
            technology company.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={site.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-lg bg-white/10 p-2 hover:bg-brand hover:text-white">
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a href={site.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-lg bg-white/10 p-2 hover:bg-brand hover:text-white">
              <LinkedinIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {site.emails.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <a href={`mailto:${e}`} className="break-all hover:text-brand">
                  {e}
                </a>
              </li>
            ))}
            {site.phones.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <a href={`tel:${p.replace(/-/g, "")}`} className="hover:text-brand">
                  {p}
                </a>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{site.locations.join(" · ")}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="font-display tracking-wide text-white/60">{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
