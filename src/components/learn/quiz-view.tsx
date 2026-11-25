"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Award, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { submitQuizAction, type QuizResult } from "@/app/actions/learning";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Question = { id: string; prompt: string; options: string[] };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit answers
    </button>
  );
}

export function QuizView({
  quizId,
  title,
  passScore,
  questions,
  bestScore,
}: {
  quizId: string;
  title: string;
  passScore: number;
  questions: Question[];
  bestScore: number | null;
}) {
  const [result, action] = useActionState<QuizResult, FormData>(submitQuizAction.bind(null, quizId), null);
  const graded = result?.ok ? result : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Quiz</p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {questions.length} questions · Pass mark {passScore}%{bestScore !== null ? ` · Your best: ${bestScore}%` : ""}
        </p>
      </div>

      {graded ? (
        <div className={cn("mt-5 flex flex-wrap items-center gap-4 rounded-2xl border p-5", graded.passed ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft")}>
          {graded.passed ? <CheckCircle2 className="h-8 w-8 text-success" /> : <XCircle className="h-8 w-8 text-danger" />}
          <div className="flex-1">
            <p className="text-lg font-bold">
              You scored {graded.score}% — {graded.passed ? "Passed!" : "Not quite there yet"}
            </p>
            <p className="text-sm text-muted-foreground">{graded.passed ? "Great work. Review the explanations below." : `You need ${passScore}% to pass. Review and try again.`}</p>
          </div>
          {graded.certificateCode ? (
            <Link href={`/certificates/${graded.certificateCode}`} className={buttonClass("primary")}>
              <Award className="h-4 w-4" /> View certificate
            </Link>
          ) : null}
          <button type="button" onClick={() => window.location.reload()} className={buttonClass("outline")}>
            <RotateCcw className="h-4 w-4" /> Retake
          </button>
        </div>
      ) : null}

      {result && !result.ok ? <p className="mt-5 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{result.error}</p> : null}

      <form action={action} className="mt-5 space-y-4">
        {questions.map((q, qi) => (
          <fieldset key={q.id} className="rounded-2xl border bg-card p-5" disabled={Boolean(graded)}>
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="font-semibold">
              <span className="mr-2 text-primary">Q{qi + 1}.</span>
              {q.prompt}
            </p>
            <div className="mt-4 grid gap-2">
              {q.options.map((opt, oi) => {
                const chosen = graded?.answers?.[qi] === oi;
                const correct = graded?.correct?.[qi] === oi;
                return (
                  <label
                    key={oi}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-accent",
                      graded && correct && "border-success bg-success-soft",
                      graded && chosen && !correct && "border-danger bg-danger-soft",
                    )}
                  >
                    <input type="radio" name={`q_${q.id}`} value={oi} required defaultChecked={chosen} className="h-4 w-4 accent-[var(--primary)]" />
                    <span className="flex-1">{opt}</span>
                    {graded && correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : null}
                  </label>
                );
              })}
            </div>
            {graded?.explanations?.[qi] ? <p className="mt-3 text-sm text-muted-foreground">💡 {graded.explanations[qi]}</p> : null}
          </fieldset>
        ))}
        {!graded ? <Submit /> : null}
      </form>
    </div>
  );
}
