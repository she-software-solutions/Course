import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Verify a certificate" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  let notFoundCode = "";
  if (code) {
    const c = code.trim().toUpperCase();
    const cert = await db.certificate.findUnique({ where: { code: c }, select: { code: true } });
    if (cert) redirect(`/certificates/${cert.code}`);
    notFoundCode = c;
  }
  return (
    <div className="container-page flex justify-center py-20">
      <Card className="w-full max-w-lg p-8 text-center">
        <BadgeCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Verify a certificate</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter the certificate ID printed at the bottom of a She Software Solutions certificate.</p>
        <form action="/verify" className="mt-6 flex gap-2">
          <Input name="code" defaultValue={code} placeholder="SHE-2026-XXXXXXXXXX" required className="font-mono uppercase" />
          <Button type="submit">Verify</Button>
        </form>
        {notFoundCode ? <p className="mt-4 rounded-lg bg-danger-soft p-3 text-sm text-danger">No certificate found with ID {notFoundCode}.</p> : null}
      </Card>
    </div>
  );
}
