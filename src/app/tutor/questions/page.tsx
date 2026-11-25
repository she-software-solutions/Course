import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Textarea } from "@/components/ui/field";
import { Avatar, Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { answerQuestionAction } from "@/app/actions/learning";
import { cn, formatDateTime } from "@/lib/utils";

export default async function QuestionsInbox({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "open" } = await searchParams;
  const user = await requireUser(["TUTOR", "ADMIN"]);
  const scope = user.role === "ADMIN" ? {} : { tutorId: user.id };
  const questions = await db.question.findMany({
    where: { lesson: { section: { course: scope } }, ...(filter === "open" ? { answers: { none: {} } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, image: true } },
      answers: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
      lesson: { select: { id: true, title: true, section: { select: { course: { select: { slug: true, title: true } } } } } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Q&A inbox" description="Answer learner questions across your courses." />
      <div className="flex gap-2">
        {[
          ["open", "Unanswered"],
          ["all", "All questions"],
        ].map(([k, l]) => (
          <Link key={k} href={`/tutor/questions?filter=${k}`} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", filter === k ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
            {l}
          </Link>
        ))}
      </div>
      {questions.length ? (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex gap-3">
                <Avatar name={q.user.name} src={q.user.image} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{q.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.user.name} · {formatDateTime(q.createdAt)} ·{" "}
                    <Link href={`/learn/${q.lesson.section.course.slug}?lesson=${q.lesson.id}&tab=qa`} className="text-primary hover:underline">
                      {q.lesson.section.course.title} → {q.lesson.title}
                    </Link>
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm">{q.body}</p>
                  {q.answers.length ? (
                    <ul className="mt-3 space-y-2 border-l-2 border-accent pl-3 text-sm">
                      {q.answers.map((a) => (
                        <li key={a.id}>
                          <span className="font-semibold">{a.user.name}:</span> {a.body}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ActionForm action={answerQuestionAction.bind(null, q.id)} resetOnSuccess className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Textarea name="body" rows={2} required placeholder="Write your answer…" className="min-h-10" />
                    <SubmitButton>Answer</SubmitButton>
                  </ActionForm>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="Inbox zero 🎉" description="No questions waiting for an answer." />
      )}
    </div>
  );
}
