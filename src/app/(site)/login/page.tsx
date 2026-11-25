import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { GoogleButton, LoginForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

function safeCallback(url?: string) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : "/dashboard";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  const callbackUrl = safeCallback(sp.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your learning journey.">
      {googleEnabled ? <GoogleButton callbackUrl={callbackUrl} /> : null}
      <LoginForm callbackUrl={callbackUrl} initialError={sp.error} />
      <p className="text-center text-sm text-muted-foreground">
        New to She Learn?{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-primary hover:underline">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}
