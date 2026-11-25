import { db } from "@/lib/db";

/** Enrolled courses with progress for a learner. */
export async function getMyCourses(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          category: { select: { name: true } },
          tutor: { select: { name: true } },
          sections: { select: { lessons: { select: { id: true } } } },
        },
      },
    },
  });
  const lessonIds = enrollments.flatMap((e) => e.course.sections.flatMap((s) => s.lessons.map((l) => l.id)));
  const done = new Set(
    (await db.lessonProgress.findMany({ where: { userId, lessonId: { in: lessonIds } }, select: { lessonId: true } })).map((p) => p.lessonId),
  );
  return enrollments.map((e) => {
    const ids = e.course.sections.flatMap((s) => s.lessons.map((l) => l.id));
    const completed = ids.filter((id) => done.has(id)).length;
    return {
      enrollmentId: e.id,
      enrolledAt: e.createdAt,
      completedAt: e.completedAt,
      lastLessonId: e.lastLessonId,
      course: { id: e.course.id, slug: e.course.slug, title: e.course.title, thumbnail: e.course.thumbnail, category: e.course.category?.name ?? null, tutor: e.course.tutor.name },
      total: ids.length,
      completed,
      percent: ids.length ? Math.round((completed / ids.length) * 100) : 0,
    };
  });
}

export type MyCourse = Awaited<ReturnType<typeof getMyCourses>>[number];
