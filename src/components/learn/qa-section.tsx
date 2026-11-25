import { MessageCircle, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Input, Textarea } from "@/components/ui/field";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { answerQuestionAction, askQuestionAction, deleteQuestionAction } from "@/app/actions/learning";
import { formatDateTime } from "@/lib/utils";

type QA = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  user: { id: string; name: string; image: string | null };
  answers: { id: string; body: string; createdAt: Date; user: { id: string; name: string; image: string | null; role: string } }[];
};

export function QASection({
  lessonId,
  questions,
  currentUserId,
  tutorId,
  canModerate,
}: {
  lessonId: string;
  questions: QA[];
  currentUserId: string;
  tutorId: string;
  canModerate: boolean;
}) {
  return (
    <div className="space-y-6">
      <ActionForm action={askQuestionAction.bind(null, lessonId)} resetOnSuccess className="space-y-3 rounded-2xl border bg-card p-5">
        <p className="font-semibold">Ask a question about this lesson</p>
        <Input name="title" placeholder="Summarise your question" required minLength={5} maxLength={160} />
        <Textarea name="body" placeholder="Add details — what did you try? Paste error messages or code." required minLength={10} rows={3} />
        <SubmitButton size="sm">Post question</SubmitButton>
      </ActionForm>

      {questions.length ? (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <Avatar name={q.user.name} src={q.user.image} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.user.name} · {formatDateTime(q.createdAt)}
                      </p>
                    </div>
                    {q.user.id === currentUserId || canModerate ? (
                      <form action={deleteQuestionAction.bind(null, q.id)}>
                        <button type="submit" className="rounded p-1 text-muted-foreground hover:text-danger cursor-pointer" aria-label="Delete question">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm">{q.body}</p>

                  {q.answers.length ? (
                    <ul className="mt-4 space-y-3 border-l-2 border-accent pl-4">
                      {q.answers.map((a) => (
                        <li key={a.id} className="flex gap-3">
                          <Avatar name={a.user.name} src={a.user.image} size={28} />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">{a.user.name}</span>{" "}
                              {a.user.id === tutorId ? <Badge tone="brand">Instructor</Badge> : a.user.role === "ADMIN" ? <Badge tone="dark">Staff</Badge> : null} ·{" "}
                              {formatDateTime(a.createdAt)}
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm">{a.body}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <ActionForm action={answerQuestionAction.bind(null, q.id)} resetOnSuccess className="mt-4 flex gap-2">
                    <Input name="body" placeholder="Write a reply…" required minLength={2} />
                    <SubmitButton size="md" variant="outline">
                      Reply
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="No questions yet" description="Be the first to ask — your tutor will answer here." />
      )}
    </div>
  );
}
