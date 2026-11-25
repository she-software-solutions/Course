import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo height={56} />
      <p className="mt-10 font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-3 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted-foreground">It may have moved, or the link might be incorrect.</p>
      <div className="mt-6 flex gap-3">
        <LinkButton href="/">Back to home</LinkButton>
        <LinkButton href="/courses" variant="outline">
          Browse courses
        </LinkButton>
      </div>
      <Link href="/contact" className="mt-6 text-sm text-primary hover:underline">
        Need help? Contact us
      </Link>
    </div>
  );
}
