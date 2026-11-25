"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser, type SessionUser } from "@/lib/session";
import { canAccessCourse, evaluateCompletion } from "@/lib/learning";
import { runAction, UserFacingError, type ActionState } from "@/lib/actions";

async function courseForLesson(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, section: { select: { course: { select: { id: true, slug: true, tutorId: true } } } } },
  });
  if (!lesson) throw new UserFacingError("Lesson not found.");
  return lesson.section.course;
}

async function ensureAccess(user: SessionUser, course: { id: string; tutorId: string }) {
  if (!(await canAccessCourse(user, course))) throw new UserFacingError("Enroll in this course to continue.");
}

export async function setLessonCompleteAction(lessonId: string, complete: boolean): Promise<{ ok: boolean; error?: string; certificateCode?: string | null }> {
  let certificateCode: string | null = null;
  const res = await runAction(async () => {
    const user = await assertUser();
    const course = await courseForLesson(lessonId);
    await ensureAccess(user, course);
    if (complete) {
      await db.lessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId } },
        update: {},
        create: { userId: user.id, lessonId },
      });
    } else {
      await db.lessonProgress.deleteMany({ where: { userId: user.id, lessonId } });
    }
    await db.enrollment.updateMany({ where: { userId: user.id, courseId: course.id }, data: { lastLessonId: lessonId } });
    const result = await evaluateCompletion(user.id, course.id);
    certificateCode = result.certificateCode;
    revalidatePath(`/learn/${course.slug}`);
  });
  return { ok: Boolean(res?.ok), error: res?.error, certificateCode };
}

export async function recordLastLessonAction(lessonId: string) {
  const user = await assertUser().catch(() => null);
  if (!user) return;
  const course = await courseForLesson(lessonId).catch(() => null);
  if (!course) return;
  await db.enrollment.updateMany({ where: { userId: user.id, courseId: course.id }, data: { lastLessonId: lessonId } });
}

// ---------- Quizzes ----------

export type QuizResult = {
  ok: boolean;
  error?: string;
  score?: number;
  passed?: boolean;
  passScore?: number;
  correct?: number[];
  explanations?: (string | null)[];
  answers?: number[];
  certificateCode?: string | null;
} | null;

export async function submitQuizAction(quizId: string, _prev: QuizResult, form: FormData): Promise<QuizResult> {
  try {
    const user = await assertUser();
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { position: "asc" } },
        section: { select: { course: { select: { id: true, slug: true, tutorId: true } } } },
      },
    });
    if (!quiz) return { ok: false, error: "Quiz not found" };
    const course = quiz.section.course;
    await ensureAccess(user, course);

    const answers = quiz.questions.map((q) => {
      const v = form.get(`q_${q.id}`);
      return v === null ? -1 : Number(v);
    });
    if (answers.some((a) => a < 0)) return { ok: false, error: "Please answer every question before submitting." };

    const correctCount = quiz.questions.reduce((n, q, i) => n + (q.correctIndex === answers[i] ? 1 : 0), 0);
    const score = quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
    const passed = score >= quiz.passScore;
    await db.quizAttempt.create({ data: { quizId, userId: user.id, answers, score, passed } });
    const completion = await evaluateCompletion(user.id, course.id);
    revalidatePath(`/learn/${course.slug}`);
    return {
      ok: true,
      score,
      passed,
      passScore: quiz.passScore,
      answers,
      correct: quiz.questions.map((q) => q.correctIndex),
      explanations: quiz.questions.map((q) => q.explanation),
      certificateCode: completion.certificateCode,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not submit quiz" };
  }
}

// ---------- Assignments ----------

const submissionSchema = z
  .object({
    link: z.union([z.url("Enter a valid URL (https://…)"), z.literal("")]).optional(),
    text: z.string().max(5000).optional(),
  })
  .refine((d) => Boolean(d.link) || Boolean(d.text?.trim()), { message: "Add a link or a written answer." });

export async function submitAssignmentAction(assignmentId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      select: { section: { select: { course: { select: { id: true, slug: true, tutorId: true } } } } },
    });
    if (!assignment) throw new UserFacingError("Assignment not found.");
    const course = assignment.section.course;
    await ensureAccess(user, course);
    const data = submissionSchema.parse({ link: form.get("link") ?? "", text: form.get("text") ?? "" });

    const existing = await db.submission.findUnique({ where: { assignmentId_userId: { assignmentId, userId: user.id } } });
    if (existing?.status === "GRADED") throw new UserFacingError("This assignment has already been graded.");
    await db.submission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: user.id } },
      update: { link: data.link || null, text: data.text || null, status: "SUBMITTED" },
      create: { assignmentId, userId: user.id, link: data.link || null, text: data.text || null },
    });
    revalidatePath(`/learn/${course.slug}`);
    return { ok: true, message: "Submitted! Your mentor will review it soon." };
  });
}

// ---------- Q&A ----------

const questionSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(160),
  body: z.string().trim().min(10, "Describe your question in at least 10 characters").max(4000),
});

export async function askQuestionAction(lessonId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const course = await courseForLesson(lessonId);
    await ensureAccess(user, course);
    const data = questionSchema.parse({ title: form.get("title"), body: form.get("body") });
    await db.question.create({ data: { ...data, lessonId, userId: user.id } });
    revalidatePath(`/learn/${course.slug}`);
    return { ok: true, message: "Question posted" };
  });
}

export async function answerQuestionAction(questionId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const question = await db.question.findUnique({ where: { id: questionId }, select: { lessonId: true } });
    if (!question) throw new UserFacingError("Question not found.");
    const course = await courseForLesson(question.lessonId);
    await ensureAccess(user, course);
    const body = z.string().trim().min(2, "Answer is too short").max(4000).parse(form.get("body"));
    await db.answer.create({ data: { body, questionId, userId: user.id } });
    revalidatePath(`/learn/${course.slug}`);
    revalidatePath(`/tutor/questions`);
    return { ok: true, message: "Answer posted" };
  });
}

export async function deleteQuestionAction(questionId: string) {
  const user = await assertUser();
  const q = await db.question.findUnique({ where: { id: questionId }, select: { userId: true, lessonId: true } });
  if (!q) return;
  const course = await courseForLesson(q.lessonId);
  if (q.userId !== user.id && user.role !== "ADMIN" && course.tutorId !== user.id) return;
  await db.question.delete({ where: { id: questionId } });
  revalidatePath(`/learn/${course.slug}`);
}

// ---------- Reviews ----------

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Select a rating").max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function submitReviewAction(courseId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } }, include: { course: { select: { slug: true } } } });
    if (!enrollment) throw new UserFacingError("Only enrolled learners can review this course.");
    const data = reviewSchema.parse({ rating: form.get("rating"), comment: form.get("comment") || undefined });
    await db.review.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: data,
      create: { ...data, userId: user.id, courseId },
    });
    revalidatePath(`/courses/${enrollment.course.slug}`);
    return { ok: true, message: "Thanks for your review!" };
  });
}
