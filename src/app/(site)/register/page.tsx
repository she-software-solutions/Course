import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { GoogleButton, RegisterForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const sp = await searchParams;
  const callbackUrl = sp.callbackUrl?.startsWith("/") && !sp.callbackUrl.startsWith("//") ? sp.callbackUrl : "/dashboard";
  if (await getCurrentUser()) redirect(callbackUrl);

  return (
    <AuthShell title="Create your free account" subtitle="Join thousands of learners building in-demand tech skills.">
      {googleEnabled ? <GoogleButton callbackUrl={callbackUrl} /> : null}
      <RegisterForm callbackUrl={callbackUrl} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
