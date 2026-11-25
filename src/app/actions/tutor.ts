"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser, type SessionUser } from "@/lib/session";
import { runAction, UserFacingError, type ActionState } from "@/lib/actions";
import { linesToArray, slugify } from "@/lib/utils";
import { isSupportedVideoUrl } from "@/lib/video";

// ---------- helpers ----------

async function assertStaff() {
  return assertUser(["TUTOR", "ADMIN"]);
}

async function ownCourse(user: SessionUser, courseId: string) {
  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true, tutorId: true, slug: true, status: true } });
  if (!course) throw new UserFacingError("Course not found.");
  if (user.role !== "ADMIN" && course.tutorId !== user.id) throw new UserFacingError("You can only edit your own courses.");
  return course;
}

async function courseIdOfSection(sectionId: string) {
  const s = await db.section.findUnique({ where: { id: sectionId }, select: { courseId: true } });
  if (!s) throw new UserFacingError("Section not found.");
  return s.courseId;
}

async function touch(courseId: string, slug?: string) {
  revalidatePath(`/tutor/courses/${courseId}`);
  revalidatePath("/tutor/courses");
  if (slug) {
    revalidatePath(`/courses/${slug}`);
    revalidatePath(`/learn/${slug}`);
  }
}

async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "course";
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = await db.course.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}

const rupees = z.coerce.number().min(0, "Price cannot be negative").max(1_000_000).transform((r) => Math.round(r * 100));
const videoUrl = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .refine((v) => !v || isSupportedVideoUrl(v), "Use a YouTube or Vimeo link")
  .optional();

// ---------- courses ----------

const newCourseSchema = z.object({
  title: z.string().trim().min(5, "Title should be at least 5 characters").max(120),
  categoryId: z.string().optional(),
});

export async function createCourseAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let id = "";
  const res = await runAction(async () => {
    const user = await assertStaff();
    const data = newCourseSchema.parse({ title: form.get("title"), categoryId: form.get("categoryId") || undefined });
    const course = await db.course.create({
      data: {
        title: data.title,
        slug: await uniqueSlug(data.title),
        description: "",
        tutorId: user.id,
        categoryId: data.categoryId,
        outcomes: [],
        requirements: [],
        sections: { create: [{ title: "Introduction", position: 0 }] },
      },
    });
    id = course.id;
  });
  if (res?.ok && id) redirect(`/tutor/courses/${id}`);
  return res;
}

const detailsSchema = z.object({
  title: z.string().trim().min(5).max(120),
  subtitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(10000),
  categoryId: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]),
  language: z.string().trim().min(2).max(40),
  price: rupees,
  mrp: rupees.optional(),
  thumbnail: z.union([z.url("Thumbnail must be an image URL"), z.literal("")]).optional(),
  promoVideoUrl: videoUrl,
});

export async function updateCourseDetailsAction(courseId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, courseId);
    const d = detailsSchema.parse({
      title: form.get("title"),
      subtitle: form.get("subtitle") || undefined,
      description: form.get("description") ?? "",
      categoryId: form.get("categoryId") || undefined,
      level: form.get("level"),
      language: form.get("language"),
      price: form.get("price") || 0,
      mrp: form.get("mrp") || undefined,
      thumbnail: form.get("thumbnail") ?? "",
      promoVideoUrl: form.get("promoVideoUrl") ?? "",
    });
    if (d.mrp !== undefined && d.mrp > 0 && d.mrp < d.price) throw new UserFacingError("Original price (MRP) must be higher than the selling price.");
    await db.course.update({
      where: { id: courseId },
      data: {
        ...d,
        subtitle: d.subtitle ?? null,
        categoryId: d.categoryId ?? null,
        mrp: d.mrp || null,
        thumbnail: d.thumbnail || null,
        promoVideoUrl: d.promoVideoUrl ?? null,
        outcomes: linesToArray(form.get("outcomes")),
        requirements: linesToArray(form.get("requirements")),
        certificateOn: form.get("certificateOn") === "on",
      },
    });
    await touch(courseId, course.slug);
    return { ok: true, message: "Course details saved" };
  });
}

export async function submitForReviewAction(courseId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, courseId);
    const full = await db.course.findUniqueOrThrow({
      where: { id: courseId },
      include: { sections: { include: { lessons: true } } },
    });
    const lessons = full.sections.flatMap((s) => s.lessons);
    const problems = [
      full.description.length < 50 && "a description of at least 50 characters",
      !full.categoryId && "a category",
      full.outcomes.length < 2 && "at least 2 learning outcomes",
      lessons.length < 1 && "at least one lesson",
      lessons.some((l) => !l.videoUrl) && "a video for every lesson",
    ].filter(Boolean);
    if (problems.length) throw new UserFacingError(`Before submitting, add ${problems.join(", ")}.`);

    if (user.role === "ADMIN") {
      await db.course.update({ where: { id: courseId }, data: { status: "PUBLISHED", publishedAt: full.publishedAt ?? new Date(), reviewNote: null } });
      await touch(courseId, course.slug);
      return { ok: true, message: "Course published" };
    }
    await db.course.update({ where: { id: courseId }, data: { status: "PENDING_REVIEW", reviewNote: null } });
    await touch(courseId, course.slug);
    revalidatePath("/admin/courses");
    return { ok: true, message: "Submitted for review. An admin will review it shortly." };
  });
}

export async function setCourseArchivedAction(courseId: string, archived: boolean, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, courseId);
    await db.course.update({ where: { id: courseId }, data: { status: archived ? "ARCHIVED" : "DRAFT" } });
    await touch(courseId, course.slug);
    return { ok: true, message: archived ? "Course unpublished and archived" : "Course moved back to draft" };
  });
}

export async function deleteCourseAction(courseId: string, _prev: ActionState): Promise<ActionState> {
  const res = await runAction(async () => {
    const user = await assertStaff();
    await ownCourse(user, courseId);
    const [enrollments, payments] = await Promise.all([db.enrollment.count({ where: { courseId } }), db.payment.count({ where: { courseId } })]);
    if (enrollments || payments) throw new UserFacingError("Courses with learners or payments cannot be deleted — archive it instead.");
    await db.course.delete({ where: { id: courseId } });
    revalidatePath("/tutor/courses");
  });
  if (res?.ok) redirect("/tutor/courses");
  return res;
}

// ---------- sections ----------

const titleSchema = z.string().trim().min(2, "Title is too short").max(160);

export async function addSectionAction(courseId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, courseId);
    const title = titleSchema.parse(form.get("title"));
    const max = await db.section.aggregate({ where: { courseId }, _max: { position: true } });
    await db.section.create({ data: { courseId, title, position: (max._max.position ?? -1) + 1 } });
    await touch(courseId, course.slug);
    return { ok: true, message: "Section added" };
  });
}

export async function renameSectionAction(sectionId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, await courseIdOfSection(sectionId));
    await db.section.update({ where: { id: sectionId }, data: { title: titleSchema.parse(form.get("title")) } });
    await touch(course.id, course.slug);
    return { ok: true, message: "Section renamed" };
  });
}

export async function deleteSectionAction(sectionId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, await courseIdOfSection(sectionId));
    await db.section.delete({ where: { id: sectionId } });
    await touch(course.id, course.slug);
    return { ok: true, message: "Section deleted" };
  });
}

export async function moveSectionAction(sectionId: string, dir: -1 | 1, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, await courseIdOfSection(sectionId));
    const sections = await db.section.findMany({ where: { courseId: course.id }, orderBy: { position: "asc" } });
    await reorder(sections, sectionId, dir, (id, position) => db.section.update({ where: { id }, data: { position } }));
    await touch(course.id, course.slug);
  });
}

async function reorder<T extends { id: string }>(items: T[], id: string, dir: -1 | 1, save: (id: string, pos: number) => Promise<unknown>) {
  const i = items.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j]!, items[i]!];
  for (const [pos, item] of items.entries()) await save(item.id, pos);
}

// ---------- lessons ----------

const lessonSchema = z.object({
  title: titleSchema,
  videoUrl,
  durationMin: z.coerce.number().int().min(0).max(1000),
  description: z.string().trim().max(5000).optional(),
  resources: z.string().trim().max(5000).optional(),
});

function parseLesson(form: FormData) {
  return lessonSchema.parse({
    title: form.get("title"),
    videoUrl: form.get("videoUrl") ?? "",
    durationMin: form.get("durationMin") || 0,
    description: form.get("description") || undefined,
    resources: form.get("resources") || undefined,
  });
}

export async function addLessonAction(sectionId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, await courseIdOfSection(sectionId));
    const data = parseLesson(form);
    const max = await db.lesson.aggregate({ where: { sectionId }, _max: { position: true } });
    await db.lesson.create({ data: { ...data, sectionId, isPreview: form.get("isPreview") === "on", position: (max._max.position ?? -1) + 1 } });
    await touch(course.id, course.slug);
    return { ok: true, message: "Lesson added" };
  });
}

async function lessonCourse(user: SessionUser, lessonId: string) {
  const l = await db.lesson.findUnique({ where: { id: lessonId }, select: { sectionId: true } });
  if (!l) throw new UserFacingError("Lesson not found.");
  return { sectionId: l.sectionId, course: await ownCourse(user, await courseIdOfSection(l.sectionId)) };
}

export async function updateLessonAction(lessonId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const { course } = await lessonCourse(user, lessonId);
    const data = parseLesson(form);
    await db.lesson.update({
      where: { id: lessonId },
      data: { ...data, videoUrl: data.videoUrl ?? null, description: data.description ?? null, resources: data.resources ?? null, isPreview: form.get("isPreview") === "on" },
    });
    await touch(course.id, course.slug);
    return { ok: true, message: "Lesson saved" };
  });
}

export async function deleteLessonAction(lessonId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const { course } = await lessonCourse(user, lessonId);
    await db.lesson.delete({ where: { id: lessonId } });
    await touch(course.id, course.slug);
    return { ok: true, message: "Lesson deleted" };
  });
}

export async function moveLessonAction(lessonId: string, dir: -1 | 1, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const { course, sectionId } = await lessonCourse(user, lessonId);
    const lessons = await db.lesson.findMany({ where: { sectionId }, orderBy: { position: "asc" } });
    await reorder(lessons, lessonId, dir, (id, position) => db.lesson.update({ where: { id }, data: { position } }));
    await touch(course.id, course.slug);
  });
}

// ---------- quizzes ----------

const quizSchema = z.object({ title: titleSchema, passScore: z.coerce.number().int().min(1).max(100) });

export async function addQuizAction(sectionId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  let target = "";
  const res = await runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, await courseIdOfSection(sectionId));
    const data = quizSchema.parse({ title: form.get("title"), passScore: form.get("passScore") || 60 });
    const quiz = await db.quiz.create({ data: { ...data, sectionId } });
    await touch(course.id, course.slug);
    target = `/tutor/courses/${course.id}/quizzes/${quiz.id}`;
  });
  if (res?.ok && target) redirect(target);
  return res;
}

async function quizCourse(user: SessionUser, quizId: string) {
  const q = await db.quiz.findUnique({ where: { id: quizId }, select: { sectionId: true } });
  if (!q) throw new UserFacingError("Quiz not found.");
  return ownCourse(user, await courseIdOfSection(q.sectionId));
}

export async function updateQuizAction(quizId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await quizCourse(user, quizId);
    await db.quiz.update({ where: { id: quizId }, data: quizSchema.parse({ title: form.get("title"), passScore: form.get("passScore") }) });
    await touch(course.id, course.slug);
    revalidatePath(`/tutor/courses/${course.id}/quizzes/${quizId}`);
    return { ok: true, message: "Quiz saved" };
  });
}

export async function deleteQuizAction(quizId: string, _prev: ActionState): Promise<ActionState> {
  let target = "";
  const res = await runAction(async () => {
    const user = await assertStaff();
    const course = await quizCourse(user, quizId);
    await db.quiz.delete({ where: { id: quizId } });
    await touch(course.id, course.slug);
    target = `/tutor/courses/${course.id}?tab=curriculum`;
  });
  if (res?.ok && target) redirect(target);
  return res;
}

const questionSchema = z
  .object({
    prompt: z.string().trim().min(5, "Question is too short").max(1000),
    options: z.array(z.string().trim().min(1)).min(2, "Add at least 2 options").max(6, "At most 6 options"),
    correctIndex: z.coerce.number().int().min(0),
    explanation: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.correctIndex < d.options.length, { message: "Pick which option is correct", path: ["correctIndex"] });

export async function addQuizQuestionAction(quizId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await quizCourse(user, quizId);
    const options = [0, 1, 2, 3, 4, 5].map((i) => String(form.get(`option${i}`) ?? "").trim()).filter(Boolean);
    const data = questionSchema.parse({
      prompt: form.get("prompt"),
      options,
      correctIndex: Number(form.get("correctIndex") ?? 0),
      explanation: form.get("explanation") || undefined,
    });
    const max = await db.quizQuestion.aggregate({ where: { quizId }, _max: { position: true } });
    await db.quizQuestion.create({ data: { ...data, quizId, position: (max._max.position ?? -1) + 1 } });
    revalidatePath(`/tutor/courses/${course.id}/quizzes/${quizId}`);
    return { ok: true, message: "Question added" };
  });
}

export async function deleteQuizQuestionAction(questionId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const q = await db.quizQuestion.findUnique({ where: { id: questionId }, select: { quizId: true } });
    if (!q) throw new UserFacingError("Question not found.");
    const course = await quizCourse(user, q.quizId);
    await db.quizQuestion.delete({ where: { id: questionId } });
    revalidatePath(`/tutor/courses/${course.id}/quizzes/${q.quizId}`);
    return { ok: true, message: "Question removed" };
  });
}

// ---------- assignments ----------

const assignmentSchema = z.object({
  title: titleSchema,
  instructions: z.string().trim().min(10, "Instructions should be at least 10 characters").max(10000),
  maxScore: z.coerce.number().int().min(1).max(1000),
});

export async function addAssignmentAction(sectionId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await ownCourse(user, await courseIdOfSection(sectionId));
    const data = assignmentSchema.parse({ title: form.get("title"), instructions: form.get("instructions"), maxScore: form.get("maxScore") || 100 });
    await db.assignment.create({ data: { ...data, sectionId } });
    await touch(course.id, course.slug);
    return { ok: true, message: "Assignment added" };
  });
}

async function assignmentCourse(user: SessionUser, assignmentId: string) {
  const a = await db.assignment.findUnique({ where: { id: assignmentId }, select: { sectionId: true } });
  if (!a) throw new UserFacingError("Assignment not found.");
  return ownCourse(user, await courseIdOfSection(a.sectionId));
}

export async function updateAssignmentAction(assignmentId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await assignmentCourse(user, assignmentId);
    const data = assignmentSchema.parse({ title: form.get("title"), instructions: form.get("instructions"), maxScore: form.get("maxScore") || 100 });
    await db.assignment.update({ where: { id: assignmentId }, data });
    await touch(course.id, course.slug);
    return { ok: true, message: "Assignment saved" };
  });
}

export async function deleteAssignmentAction(assignmentId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const course = await assignmentCourse(user, assignmentId);
    await db.assignment.delete({ where: { id: assignmentId } });
    await touch(course.id, course.slug);
    return { ok: true, message: "Assignment deleted" };
  });
}

// ---------- grading ----------

const gradeSchema = z.object({
  score: z.coerce.number().int().min(0),
  feedback: z.string().trim().max(5000).optional(),
  status: z.enum(["GRADED", "RESUBMIT"]),
});

export async function gradeSubmissionAction(submissionId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertStaff();
    const sub = await db.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: { select: { maxScore: true, sectionId: true } } },
    });
    if (!sub) throw new UserFacingError("Submission not found.");
    const course = await ownCourse(user, await courseIdOfSection(sub.assignment.sectionId));
    const data = gradeSchema.parse({ score: form.get("score") || 0, feedback: form.get("feedback") || undefined, status: form.get("status") });
    if (data.score > sub.assignment.maxScore) throw new UserFacingError(`Score cannot exceed ${sub.assignment.maxScore}.`);
    await db.submission.update({ where: { id: submissionId }, data: { ...data, feedback: data.feedback ?? null, gradedById: user.id } });
    revalidatePath("/tutor/submissions");
    revalidatePath(`/learn/${course.slug}`);
    return { ok: true, message: data.status === "GRADED" ? "Submission graded" : "Resubmission requested" };
  });
}
