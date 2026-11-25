import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getMyCourses } from "@/lib/learner";
import { MyCourseCard } from "@/components/dashboard/my-course-card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export default async function MyCoursesPage() {
  const user = await requireUser();
  const mine = await getMyCourses(user.id);
  const active = mine.filter((m) => !m.completedAt);
  const done = mine.filter((m) => m.completedAt);

  return (
    <div className="space-y-8">
      <PageHeader title="My courses" description={`${mine.length} enrolled · ${done.length} completed`} actions={<LinkButton href="/courses" variant="outline">Find more courses</LinkButton>} />
      {!mine.length ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No courses yet" description="Enroll in a course to start learning." action={<LinkButton href="/courses">Browse courses</LinkButton>} />
      ) : null}
      {active.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">In progress</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((m) => (
              <MyCourseCard key={m.enrollmentId} item={m} />
            ))}
          </div>
        </section>
      ) : null}
      {done.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Completed</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {done.map((m) => (
              <MyCourseCard key={m.enrollmentId} item={m} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
