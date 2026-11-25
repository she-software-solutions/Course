import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";
import type { SessionUser } from "@/lib/session";

const areas = [
  { href: "/dashboard", label: "Learner", roles: ["LEARNER", "TUTOR", "ADMIN"] },
  { href: "/tutor", label: "Tutor studio", roles: ["TUTOR", "ADMIN"] },
  { href: "/admin", label: "Admin console", roles: ["ADMIN"] },
];

export function DashboardShell({
  user,
  area,
  nav,
  children,
}: {
  user: SessionUser;
  area: "Learner" | "Tutor studio" | "Admin console";
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const switchable = areas.filter((a) => a.roles.includes(user.role) && a.label !== area);
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <Navbar />
      <div className="container-page flex flex-1 flex-col gap-6 py-6 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="rounded-2xl border bg-card p-3 lg:sticky lg:top-20">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-primary">{area}</p>
            <SidebarNav items={nav} />
            {switchable.length ? (
              <div className="mt-3 border-t pt-3">
                {switchable.map((a) => (
                  <Link key={a.href} href={a.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Switch to {a.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
