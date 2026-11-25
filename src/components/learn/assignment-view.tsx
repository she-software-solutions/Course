import { FileText } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Badge, Card } from "@/components/ui/misc";
import { submitAssignmentAction } from "@/app/actions/learning";
import { formatDateTime } from "@/lib/utils";
import { submissionTone } from "@/lib/tones";

type Submission = { link: string | null; text: string | null; status: string; score: number | null; feedback: string | null; updatedAt: Date } | null;

export function AssignmentView({
  assignment,
  submission,
}: {
  assignment: { id: string; title: string; instructions: string; maxScore: number };
  submission: Submission;
}) {
  const locked = submission?.status === "GRADED";
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <FileText className="h-4 w-4" /> Assignment
        </p>
        <h1 className="mt-1 text-2xl font-bold">{assignment.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Max score: {assignment.maxScore}</p>
        <div className="mt-4 whitespace-pre-line rounded-xl bg-muted p-4 text-sm leading-relaxed">{assignment.instructions}</div>
      </Card>

      {submission ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Your submission</p>
            <Badge tone={submissionTone[submission.status]}>{submission.status === "RESUBMIT" ? "resubmission requested" : submission.status.toLowerCase()}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Last updated {formatDateTime(submission.updatedAt)}</p>
          {submission.link ? (
            <a href={submission.link} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm text-primary hover:underline">
              {submission.link}
            </a>
          ) : null}
          {submission.text ? <p className="mt-2 whitespace-pre-line text-sm">{submission.text}</p> : null}
          {submission.status !== "SUBMITTED" ? (
            <div className="mt-4 rounded-xl border bg-accent/40 p-4">
              <p className="text-sm font-semibold">
                Mentor feedback{submission.score !== null ? ` · Score ${submission.score}/${assignment.maxScore}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm">{submission.feedback || "No written feedback."}</p>
            </div>
          ) : null}
        </Card>
      ) : null}

      {!locked ? (
        <Card className="p-6">
          <p className="font-semibold">{submission ? "Update your submission" : "Submit your work"}</p>
          <ActionForm action={submitAssignmentAction.bind(null, assignment.id)} className="mt-4 space-y-4">
            <Field label="Link to your work" htmlFor="link" hint="GitHub repo, Google Drive, Figma, Colab, deployed site…">
              <Input id="link" name="link" type="url" placeholder="https://" defaultValue={submission?.link ?? ""} />
            </Field>
            <Field label="Notes / written answer" htmlFor="text">
              <Textarea id="text" name="text" rows={5} defaultValue={submission?.text ?? ""} />
            </Field>
            <SubmitButton>{submission ? "Resubmit" : "Submit assignment"}</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
