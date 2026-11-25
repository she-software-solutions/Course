import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { formatDate, formatDuration } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";

type Params = Promise<{ code: string }>;

async function load(code: string) {
  return db.certificate.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      user: { select: { name: true } },
      course: {
        select: {
          title: true,
          slug: true,
          tutor: { select: { name: true } },
          sections: { select: { lessons: { select: { durationMin: true } } } },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const cert = await load(code);
  if (!cert) return { title: "Certificate not found" };
  return {
    title: `${cert.user.name} — ${cert.course.title} certificate`,
    description: `Verified certificate of completion issued by ${site.name}.`,
  };
}

export default async function CertificatePage({ params }: { params: Params }) {
  const { code } = await params;
  const cert = await load(code);
  if (!cert) notFound();
  const minutes = cert.course.sections.flatMap((s) => s.lessons).reduce((a, l) => a + l.durationMin, 0);
  const verifyUrl = `${site.url}/certificates/${cert.code}`;

  return (
    <div className="min-h-dvh bg-muted/60 px-4 py-8 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-success-soft px-4 py-2 text-sm font-semibold text-success">
          <BadgeCheck className="h-4 w-4" /> Verified certificate · ID {cert.code}
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/certificates" className="inline-flex h-10 items-center rounded-lg border bg-card px-4 text-sm font-semibold hover:bg-muted">
            My certificates
          </Link>
          <PrintButton />
        </div>
      </div>

      <article
        className="relative mx-auto aspect-[1.414/1] w-full max-w-5xl overflow-hidden bg-white text-[#1e1233] shadow-2xl print:max-w-none print:shadow-none"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#ff69b4]/15" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#9b3dd6]/10" />
        <div className="absolute inset-0 border-[14px] border-[#1e1233]" />
        <div className="absolute inset-[22px] border-2 border-[#ff69b4]" />

        <div className="relative flex h-full flex-col items-center justify-between px-[8%] py-[6%] text-center">
          <Image src="/brand/logo-light.png" alt={site.name} width={628} height={323} className="h-auto w-[18%]" />
          <div>
            <p className="font-display text-[clamp(14px,2.6vw,30px)] font-semibold tracking-[0.3em] text-[#d63384]">CERTIFICATE</p>
            <p className="mt-1 text-[clamp(9px,1.2vw,14px)] uppercase tracking-[0.35em] text-[#5f5668]">of completion</p>
          </div>
          <div className="w-full">
            <p className="text-[clamp(9px,1.3vw,15px)] text-[#5f5668]">This is to certify that</p>
            <p className="mx-auto mt-2 w-fit border-b-2 border-[#ff69b4]/60 px-6 pb-2 font-display text-[clamp(20px,4.4vw,52px)] font-bold">{cert.user.name}</p>
            <p className="mt-4 text-[clamp(9px,1.3vw,15px)] text-[#5f5668]">has successfully completed the online course</p>
            <p className="mt-2 text-[clamp(13px,2.3vw,28px)] font-bold">{cert.course.title}</p>
            <p className="mt-2 text-[clamp(8px,1.1vw,13px)] text-[#5f5668]">
              {formatDuration(minutes)} of video instruction · assessments passed · instructed by {cert.course.tutor.name}
            </p>
          </div>
          <div className="grid w-full grid-cols-3 items-end text-[clamp(8px,1.1vw,13px)]">
            <div className="text-left">
              <p className="font-semibold">{formatDate(cert.issuedAt, { dateStyle: "long" })}</p>
              <p className="border-t border-[#1e1233]/30 pt-1 text-[#5f5668]">Date of issue</p>
            </div>
            <div className="flex justify-center">
              <div className="flex h-[clamp(48px,9vw,104px)] w-[clamp(48px,9vw,104px)] items-center justify-center rounded-full bg-gradient-to-br from-[#ff69b4] to-[#d63384] p-1">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-white/70 text-white">
                  <BadgeCheck className="h-1/3 w-1/3" />
                  <span className="font-display text-[clamp(5px,0.8vw,9px)] font-bold tracking-widest">VERIFIED</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{cert.course.tutor.name}</p>
              <p className="border-t border-[#1e1233]/30 pt-1 text-[#5f5668]">Course instructor</p>
            </div>
          </div>
          <p className="text-[clamp(6px,0.85vw,11px)] text-[#5f5668]">
            {site.name} · Certificate ID <span className="font-mono font-semibold">{cert.code}</span> · Verify at {verifyUrl}
          </p>
        </div>
      </article>
      <p className="no-print mx-auto mt-4 max-w-5xl text-center text-xs text-muted-foreground">
        Tip: choose “Save as PDF” and landscape orientation in the print dialog to download your certificate.
      </p>
    </div>
  );
}
