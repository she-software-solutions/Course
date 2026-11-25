import crypto from "node:crypto";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";

/** Course with its full curriculum, ordered. */
export async function getCourseCurriculum(courseId: string) {
  return db.section.findMany({
    where: { courseId },
    orderBy: { position: "asc" },
    include: {
      lessons: { orderBy: { position: "asc" } },
      quizzes: { orderBy: { createdAt: "asc" }, include: { _count: { select: { questions: true } } } },
      assignments: { orderBy: { createdAt: "asc" } },
    },
  });
}

/** Whether a user can open the learning player for a course. */
export async function canAccessCourse(user: SessionUser, course: { id: string; tutorId: string }) {
  if (user.role === "ADMIN" || course.tutorId === user.id) return true;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true },
  });
  return Boolean(enrollment);
}

export async function getCourseProgress(userId: string, courseId: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({ where: { section: { courseId } } }),
    db.lessonProgress.count({ where: { userId, lesson: { section: { courseId } } } }),
  ]);
  return {
    totalLessons,
    completedLessons,
    percent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
  };
}

function newCertificateCode() {
  const year = new Date().getFullYear();
  return `SHE-${year}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * A course is complete when every lesson is marked done and every quiz has
 * at least one passing attempt. On completion the enrollment is stamped and,
 * if the course offers one, a certificate is issued (idempotent).
 */
export async function evaluateCompletion(userId: string, courseId: string) {
  const [progress, quizzes, enrollment, course] = await Promise.all([
    getCourseProgress(userId, courseId),
    db.quiz.findMany({
      where: { section: { courseId } },
      select: { id: true, attempts: { where: { userId, passed: true }, select: { id: true }, take: 1 } },
    }),
    db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }),
    db.course.findUnique({ where: { id: courseId }, select: { certificateOn: true } }),
  ]);
  if (!enrollment || !course) return { completed: false, certificateCode: null as string | null };

  const allQuizzesPassed = quizzes.every((q) => q.attempts.length > 0);
  const completed = progress.totalLessons > 0 && progress.completedLessons >= progress.totalLessons && allQuizzesPassed;
  if (!completed) return { completed: false, certificateCode: null };

  if (!enrollment.completedAt) {
    await db.enrollment.update({ where: { id: enrollment.id }, data: { completedAt: new Date() } });
  }
  let certificateCode: string | null = null;
  if (course.certificateOn) {
    const cert = await db.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId, code: newCertificateCode() },
    });
    certificateCode = cert.code;
  }
  return { completed: true, certificateCode };
}

/** Enroll a user (idempotent). */
export async function enrollUser(userId: string, courseId: string) {
  return db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

/** Rating summaries for many courses in one query. */
export async function getRatings(courseIds: string[]) {
  if (!courseIds.length) return new Map<string, { avg: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courseIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.courseId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}
