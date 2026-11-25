"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean; badge?: number };

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto scrollbar-thin lg:flex-col">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="[&_svg]:h-4 [&_svg]:w-4">{it.icon}</span>
            <span className="flex-1">{it.label}</span>
            {it.badge ? <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{it.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
