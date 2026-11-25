"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { BookOpen, ChevronDown, GraduationCap, LayoutDashboard, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/misc";

type Props = { name: string; email: string; image?: string | null; role: "LEARNER" | "TUTOR" | "ADMIN" };

export function UserMenu({ name, email, image, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const items = [
    { href: "/dashboard", label: "My learning", icon: BookOpen },
    ...(role === "TUTOR" || role === "ADMIN" ? [{ href: "/tutor", label: "Tutor studio", icon: GraduationCap }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin console", icon: ShieldCheck }] : []),
    { href: "/dashboard/profile", label: "Profile & settings", icon: UserRound },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-muted cursor-pointer"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={name} src={image} size={32} />
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="border-b px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <span className="mt-2 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
              {role.toLowerCase()}
            </span>
          </div>
          <div className="p-1.5">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                role="menuitem"
              >
                <it.icon className="h-4 w-4 text-muted-foreground" />
                {it.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft cursor-pointer"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardIcon() {
  return <LayoutDashboard className="h-4 w-4" />;
}
