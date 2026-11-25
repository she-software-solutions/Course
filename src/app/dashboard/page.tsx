import Link from "next/link";
import { Award, BookOpen, CalendarDays, CheckCircle2, Flame } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getMyCourses } from "@/lib/learner";
import { getCourseCards } from "@/lib/catalog";
import { MyCourseCard } from "@/components/dashboard/my-course-card";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function LearnerOverview() {
  const user = await requireUser();
  const [mine, certificates, events, completedLessons] = await Promise.all([
    getMyCourses(user.id),
    db.certificate.count({ where: { userId: user.id } }),
    db.eventRegistration.findMany({
      where: { userId: user.id, event: { startsAt: { gte: new Date() } } },
      include: { event: true },
      orderBy: { event: { startsAt: "asc" } },
      take: 3,
    }),
    db.lessonProgress.count({ where: { userId: user.id } }),
  ]);
  const inProgress = mine.filter((m) => !m.completedAt);
  const recommended = await getCourseCards({ where: { id: { notIn: mine.map((m) => m.course.id) } }, take: 3 });
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome back, ${firstName} 👋`} description="Pick up where you left off and keep your learning streak going." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled courses" value={mine.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Completed courses" value={mine.filter((m) => m.completedAt).length} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Lessons finished" value={completedLessons} icon={<Flame className="h-5 w-5" />} />
        <StatCard label="Certificates" value={certificates} icon={<Award className="h-5 w-5" />} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Continue learning</h2>
          <Link href="/dashboard/courses" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        {inProgress.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {inProgress.slice(0, 6).map((m) => (
              <MyCourseCard key={m.enrollmentId} item={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title={mine.length ? "You've completed all your courses 🎉" : "You haven't enrolled in any courses yet"}
            description="Explore our catalog of industry-ready courses."
            action={<LinkButton href="/courses">Browse courses</LinkButton>}
          />
        )}
      </section>

      {events.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your upcoming events</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {events.map((r) => (
              <Link key={r.id} href={`/events/${r.event.slug}`} className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:border-brand/50">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{r.event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.event.startsAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recommended.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recommended for you</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
