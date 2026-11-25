import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/misc";
import { CourseThumb } from "@/components/course/course-thumb";
import { createCourseAction } from "@/app/actions/tutor";
import { formatDate, formatINR } from "@/lib/utils";
import { courseStatusLabel, courseStatusTone } from "@/lib/tones";

export default async function TutorCoursesPage() {
  const user = await requireUser(["TUTOR", "ADMIN"]);
  const [courses, categories] = await Promise.all([
    db.course.findMany({
      where: { tutorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { category: true, _count: { select: { enrollments: true, sections: true } } },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="My courses" description="Draft, publish and manage your courses." />
      {courses.length ? (
        <div className="grid gap-4">
          {courses.map((c) => (
            <Link key={c.id} href={`/tutor/courses/${c.id}`} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm sm:flex-row sm:items-center">
              <CourseThumb title={c.title} thumbnail={c.thumbnail} category={c.category?.name} size="sm" className="w-full rounded-xl sm:w-44" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{c.title}</p>
                  <Badge tone={courseStatusTone[c.status]}>{courseStatusLabel[c.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.category?.name ?? "Uncategorised"} · {formatINR(c.price)} · {c._count.enrollments} learners · updated {formatDate(c.updatedAt)}
                </p>
                {c.status === "REJECTED" && c.reviewNote ? <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">Admin feedback: {c.reviewNote}</p> : null}
              </div>
              <span className="text-sm font-semibold text-primary">Edit →</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="You haven't created any courses" description="Start with a title — you can fill in the details next." />
      )}

      <Card id="new">
        <CardHeader title="Create a new course" description="Start with a working title. You'll add the curriculum and details next." />
        <ActionForm action={createCourseAction} className="grid gap-4 p-5 sm:grid-cols-[1fr_240px_auto] sm:items-end">
          <Field label="Course title" htmlFor="title">
            <Input id="title" name="title" required minLength={5} maxLength={120} placeholder="e.g. Complete Java Programming Bootcamp" />
          </Field>
          <Field label="Category" htmlFor="categoryId">
            <Select id="categoryId" name="categoryId" defaultValue="">
              <option value="">Choose later</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <SubmitButton>Create course</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
