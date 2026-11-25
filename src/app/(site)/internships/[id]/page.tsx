import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, Clock, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Badge, Card } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { applyInternshipAction } from "@/app/actions/public";
import { formatDate } from "@/lib/utils";
import { applicationTone } from "@/lib/tones";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const i = await db.internship.findUnique({ where: { id }, select: { title: true } });
  return { title: i ? `${i.title} — Internship` : "Internship" };
}

export default async function InternshipDetail({ params }: { params: Params }) {
  const { id } = await params;
  const [internship, user] = await Promise.all([db.internship.findUnique({ where: { id } }), getCurrentUser()]);
  if (!internship) notFound();
  const application = user ? await db.internshipApplication.findUnique({ where: { internshipId_userId: { internshipId: id, userId: user.id } } }) : null;
  const closed = !internship.isOpen || (internship.deadline !== null && internship.deadline < new Date());
  const profile = user ? await db.user.findUnique({ where: { id: user.id }, select: { phone: true } }) : null;

  return (
    <div className="container-page py-10">
      <Link href="/internships" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft className="h-4 w-4" /> All internships
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{internship.domain}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{internship.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {internship.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {internship.mode === "ONLINE" ? "Remote" : `${internship.mode.toLowerCase()} · ${internship.location ?? ""}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {internship.openings} openings
            </span>
            {internship.stipend ? <Badge tone="success">{internship.stipend}</Badge> : null}
          </div>
          <div className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{internship.description}</div>
          <h2 className="mt-8 text-lg font-semibold">Skills you&apos;ll use</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {internship.skills.map((s) => (
              <Badge key={s} tone="brand" className="px-3 py-1 text-sm">
                {s}
              </Badge>
            ))}
          </div>
          <h2 className="mt-8 text-lg font-semibold">What you get</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {["Real project experience on production code", "Code reviews and mentorship", "Git, CI/CD and professional practices", "Internship completion certificate for your resume & LinkedIn"].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> {x}
              </li>
            ))}
          </ul>
        </div>

        <Card className="h-fit p-6 lg:sticky lg:top-20">
          {application ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <p className="mt-3 font-semibold">You have applied</p>
              <p className="mt-1 text-sm text-muted-foreground">Submitted {formatDate(application.createdAt)}</p>
              <Badge tone={applicationTone[application.status]} className="mt-3">
                {application.status.toLowerCase()}
              </Badge>
            </div>
          ) : closed ? (
            <p className="text-center text-sm text-muted-foreground">Applications for this internship are closed.</p>
          ) : !user ? (
            <div className="text-center">
              <p className="font-semibold">Ready to apply?</p>
              <p className="mt-1 text-sm text-muted-foreground">Log in or create a free account to submit your application.</p>
              <LinkButton href={`/login?callbackUrl=/internships/${id}`} className="mt-4 w-full">
                Log in to apply
              </LinkButton>
            </div>
          ) : (
            <ActionForm action={applyInternshipAction.bind(null, id)} className="space-y-4">
              <p className="text-lg font-semibold">Apply now</p>
              {internship.deadline ? <p className="-mt-3 text-xs text-muted-foreground">Apply by {formatDate(internship.deadline)}</p> : null}
              <Field label="Phone / WhatsApp">
                <Input name="phone" defaultValue={profile?.phone ?? ""} required />
              </Field>
              <Field label="College / Organisation">
                <Input name="college" />
              </Field>
              <Field label="Resume link" hint="Google Drive / Dropbox link with view access">
                <Input name="resumeUrl" type="url" required placeholder="https://drive.google.com/…" />
              </Field>
              <Field label="GitHub / portfolio (optional)">
                <Input name="portfolioUrl" type="url" placeholder="https://github.com/…" />
              </Field>
              <Field label="Why are you a good fit? (optional)">
                <Textarea name="coverNote" rows={3} />
              </Field>
              <SubmitButton className="w-full">Submit application</SubmitButton>
            </ActionForm>
          )}
        </Card>
      </div>
    </div>
  );
}
