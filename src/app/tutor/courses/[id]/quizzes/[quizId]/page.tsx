import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CheckCircle2, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { addQuizQuestionAction, deleteQuizAction, deleteQuizQuestionAction, updateQuizAction } from "@/app/actions/tutor";

type Params = Promise<{ id: string; quizId: string }>;

export default async function QuizEditorPage({ params }: { params: Params }) {
  const { id, quizId } = await params;
  const user = await requireUser(["TUTOR", "ADMIN"]);
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { position: "asc" } },
      section: { select: { title: true, course: { select: { id: true, title: true, tutorId: true } } } },
      _count: { select: { attempts: true } },
    },
  });
  if (!quiz || quiz.section.course.id !== id) notFound();
  if (user.role !== "ADMIN" && quiz.section.course.tutorId !== user.id) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/tutor/courses/${id}?tab=curriculum`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft className="h-4 w-4" /> Back to curriculum
      </Link>
      <PageHeader title={quiz.title} description={`${quiz.section.course.title} · ${quiz.section.title} · ${quiz._count.attempts} attempts`} />

      <Card>
        <CardHeader title="Quiz settings" />
        <ActionForm action={updateQuizAction.bind(null, quiz.id)} className="grid gap-4 p-5 sm:grid-cols-[1fr_160px_auto] sm:items-end">
          <Field label="Title">
            <Input name="title" defaultValue={quiz.title} required />
          </Field>
          <Field label="Pass mark (%)">
            <Input name="passScore" type="number" min={1} max={100} defaultValue={quiz.passScore} />
          </Field>
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      </Card>

      <Card>
        <CardHeader title={`Questions (${quiz.questions.length})`} description="Learners must answer every question. Correct answers are revealed after submission." />
        <ol className="divide-y">
          {quiz.questions.map((q, i) => (
            <li key={q.id} className="flex gap-4 px-5 py-4">
              <span className="font-bold text-primary">{i + 1}.</span>
              <div className="flex-1">
                <p className="font-medium">{q.prompt}</p>
                <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  {q.options.map((o, oi) => (
                    <li key={oi} className={oi === q.correctIndex ? "flex items-center gap-1.5 font-semibold text-success" : "text-muted-foreground"}>
                      {oi === q.correctIndex ? <CheckCircle2 className="h-4 w-4" /> : <span className="w-4 text-center">•</span>} {o}
                    </li>
                  ))}
                </ul>
                {q.explanation ? <p className="mt-2 text-xs text-muted-foreground">Explanation: {q.explanation}</p> : null}
              </div>
              <ActionForm action={deleteQuizQuestionAction.bind(null, q.id)}>
                <SubmitButton variant="ghost" size="icon" aria-label="Delete question" confirm="Delete this question?" className="text-danger hover:bg-danger-soft">
                  <Trash2 className="h-4 w-4" />
                </SubmitButton>
              </ActionForm>
            </li>
          ))}
          {!quiz.questions.length ? <li className="px-5 py-8 text-center text-sm text-muted-foreground">No questions yet — add your first one below.</li> : null}
        </ol>
      </Card>

      <Card>
        <CardHeader title="Add a question" description="Provide 2–6 options and select the correct one." />
        <ActionForm action={addQuizQuestionAction.bind(null, quiz.id)} resetOnSuccess className="space-y-4 p-5">
          <Field label="Question">
            <Textarea name="prompt" rows={2} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" name="correctIndex" value={i} defaultChecked={i === 0} className="h-4 w-4 accent-[var(--primary)]" aria-label={`Option ${i + 1} is correct`} />
                <Input name={`option${i}`} placeholder={`Option ${i + 1}${i < 2 ? "" : " (optional)"}`} required={i < 2} />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Select the radio button next to the correct option.</p>
          <Field label="Explanation (optional)">
            <Input name="explanation" placeholder="Why is this the right answer?" />
          </Field>
          <SubmitButton>Add question</SubmitButton>
        </ActionForm>
      </Card>

      <ActionForm action={deleteQuizAction.bind(null, quiz.id)}>
        <SubmitButton variant="danger" size="sm" confirm="Delete this quiz and all attempts?">
          <Trash2 className="h-4 w-4" /> Delete quiz
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
