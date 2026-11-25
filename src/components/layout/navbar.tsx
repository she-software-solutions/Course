import Link from "next/link";
import { Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LinkButton } from "@/components/ui/button";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/internships", label: "Internships" },
  { href: "/events", label: "Workshops & Events" },
  { href: "/teach", label: "Teach with us" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page relative flex h-16 items-center gap-4">
        <Logo height={40} />
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/courses" className="hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-muted sm:inline-flex xl:hidden" aria-label="Search courses">
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <form action="/courses" className="relative hidden xl:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              placeholder="Search courses"
              aria-label="Search courses"
              className="h-9 w-52 rounded-full border border-input bg-muted/60 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/20"
            />
          </form>
          <ThemeToggle />
          {user ? (
            <UserMenu name={user.name ?? "Learner"} email={user.email ?? ""} image={user.image} role={user.role} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <LinkButton href="/login" variant="ghost" size="sm">
                Log in
              </LinkButton>
              <LinkButton href="/register" size="sm">
                Join for free
              </LinkButton>
            </div>
          )}
          <MobileNav links={links} signedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
