"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function MobileNav({ links, signedIn }: { links: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted cursor-pointer"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-full z-40 border-b bg-background shadow-lg">
          <nav className="container-page flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
                {l.label}
              </Link>
            ))}
            {!signedIn ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className={buttonClass("outline")}>
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className={buttonClass("primary")}>
                  Join for free
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
