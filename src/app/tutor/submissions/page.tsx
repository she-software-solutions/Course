import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Avatar, Badge, Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { gradeSubmissionAction } from "@/app/actions/tutor";
import { cn, formatDateTime } from "@/lib/utils";
import { submissionTone } from "@/lib/tones";

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "SUBMITTED" } = await searchParams;
  const user = await requireUser(["TUTOR", "ADMIN"]);
  const scope = user.role === "ADMIN" ? {} : { tutorId: user.id };
  const submissions = await db.submission.findMany({
    where: { assignment: { section: { course: scope } }, ...(status !== "ALL" ? { status: status as "SUBMITTED" | "GRADED" | "RESUBMIT" } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true, image: true } },
      assignment: { select: { title: true, maxScore: true, section: { select: { course: { select: { title: true } } } } } },
    },
  });
  const filters = [
    ["SUBMITTED", "To review"],
    ["RESUBMIT", "Resubmission requested"],
    ["GRADED", "Graded"],
    ["ALL", "All"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Assignment submissions" description="Review learner work and give actionable feedback." />
      <div className="flex flex-wrap gap-2">
        {filters.map(([k, label]) => (
          <Link key={k} href={`/tutor/submissions?status=${k}`} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", status === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-brand/50")}>
            {label}
          </Link>
        ))}
      </div>
      {submissions.length ? (
        <div className="space-y-4">
          {submissions.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar name={s.user.name} src={s.user.image} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {s.user.name} <span className="text-sm font-normal text-muted-foreground">· {s.user.email}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {s.assignment.section.course.title} → {s.assignment.title}
                  </p>
                  <p className="text-xs text-muted-foreground">Updated {formatDateTime(s.updatedAt)}</p>
                </div>
                <Badge tone={submissionTone[s.status]}>{s.status.toLowerCase()}</Badge>
              </div>
              <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
                {s.link ? (
                  <a href={s.link} target="_blank" rel="noreferrer" className="break-all font-medium text-primary hover:underline">
                    {s.link}
                  </a>
                ) : null}
                {s.text ? <p className="mt-2 whitespace-pre-line">{s.text}</p> : null}
              </div>
              <ActionForm action={gradeSubmissionAction.bind(null, s.id)} className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_200px_auto] md:items-start">
                <div>
                  <Input name="score" type="number" min={0} max={s.assignment.maxScore} defaultValue={s.score ?? ""} placeholder={`Score / ${s.assignment.maxScore}`} aria-label="Score" />
                </div>
                <Textarea name="feedback" rows={2} defaultValue={s.feedback ?? ""} placeholder="Feedback for the learner" aria-label="Feedback" className="min-h-10" />
                <Select name="status" defaultValue={s.status === "RESUBMIT" ? "RESUBMIT" : "GRADED"} aria-label="Decision">
                  <option value="GRADED">Mark as graded</option>
                  <option value="RESUBMIT">Request resubmission</option>
                </Select>
                <SubmitButton>Save</SubmitButton>
              </ActionForm>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<FileCheck2 className="h-6 w-6" />} title="Nothing here" description="Submissions matching this filter will appear here." />
      )}
    </div>
  );
}
