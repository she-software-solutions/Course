import Link from "next/link";
import { BookOpen, ExternalLink, Star } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Input, Select } from "@/components/ui/field";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { CourseThumb } from "@/components/course/course-thumb";
import { reviewCourseAction, setCourseStatusAction, toggleFeaturedAction } from "@/app/actions/admin";
import type { CourseStatus } from "@/generated/prisma/enums";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { courseStatusLabel, courseStatusTone } from "@/lib/tones";

const statuses = ["ALL", "PENDING_REVIEW", "PUBLISHED", "DRAFT", "REJECTED", "ARCHIVED"] as const;

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const status = (statuses as readonly string[]).includes(sp.status ?? "") ? sp.status! : "ALL";
  const courses = await db.course.findMany({
    where: {
      ...(status !== "ALL" ? { status: status as CourseStatus } : {}),
      ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      tutor: { select: { name: true, email: true } },
      category: { select: { name: true } },
      _count: { select: { enrollments: true, sections: true } },
      sections: { select: { _count: { select: { lessons: true } } } },
    },
  });
  const counts = await db.course.groupBy({ by: ["status"], _count: { _all: true } });
  const count = (s: string) => (s === "ALL" ? counts.reduce((a, c) => a + c._count._all, 0) : (counts.find((c) => c.status === s)?._count._all ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Review submissions, publish, feature and unpublish courses." />
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/courses?status=${s}`}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-brand/50")}
          >
            {s === "ALL" ? "All" : courseStatusLabel[s]} <span className="opacity-70">({count(s)})</span>
          </Link>
        ))}
        <form action="/admin/courses" className="ml-auto">
          <input type="hidden" name="status" value={status} />
          <Input name="q" defaultValue={sp.q} placeholder="Search titles" className="h-9 w-56" />
        </form>
      </div>

      {courses.length ? (
        <div className="space-y-4">
          {courses.map((c) => (
            <Card key={c.id} id={c.id} className="p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <CourseThumb title={c.title} thumbnail={c.thumbnail} category={c.category?.name} size="sm" className="w-full rounded-xl md:w-44" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/courses/${c.slug}`} target="_blank" className="font-semibold hover:text-primary">
                      {c.title} <ExternalLink className="inline h-3.5 w-3.5" />
                    </Link>
                    <Badge tone={courseStatusTone[c.status]}>{courseStatusLabel[c.status]}</Badge>
                    {c.isFeatured ? (
                      <Badge tone="brand">
                        <Star className="h-3 w-3" /> Featured
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.tutor.name} ({c.tutor.email}) · {c.category?.name ?? "No category"} · {formatINR(c.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c._count.sections} sections · {c.sections.reduce((a, s) => a + s._count.lessons, 0)} lessons · {c._count.enrollments} learners · updated {formatDate(c.updatedAt)}
                  </p>
                  {c.reviewNote ? <p className="mt-2 text-xs text-danger">Last note: {c.reviewNote}</p> : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                {c.status === "PENDING_REVIEW" ? (
                  <ActionForm action={reviewCourseAction.bind(null, c.id)} className="flex flex-1 flex-wrap gap-2">
                    <Select name="decision" className="h-9 w-40" defaultValue="approve" aria-label="Decision">
                      <option value="approve">Approve & publish</option>
                      <option value="reject">Request changes</option>
                    </Select>
                    <Input name="note" placeholder="Note to tutor (required when requesting changes)" className="h-9 min-w-60 flex-1" />
                    <SubmitButton size="sm">Submit decision</SubmitButton>
                  </ActionForm>
                ) : null}
                {c.status !== "PUBLISHED" && c.status !== "PENDING_REVIEW" ? (
                  <ActionForm action={setCourseStatusAction.bind(null, c.id, "PUBLISHED")}>
                    <SubmitButton size="sm" variant="outline" confirm="Publish this course now?">
                      Publish
                    </SubmitButton>
                  </ActionForm>
                ) : null}
                {c.status === "PUBLISHED" ? (
                  <>
                    <ActionForm action={toggleFeaturedAction.bind(null, c.id)}>
                      <SubmitButton size="sm" variant="outline">
                        {c.isFeatured ? "Unfeature" : "Feature on homepage"}
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={setCourseStatusAction.bind(null, c.id, "ARCHIVED")}>
                      <SubmitButton size="sm" variant="ghost" className="text-danger" confirm="Unpublish this course? Enrolled learners keep access.">
                        Unpublish
                      </SubmitButton>
                    </ActionForm>
                  </>
                ) : null}
                <Link href={`/tutor/courses/${c.id}`} className="ml-auto text-sm font-semibold text-primary hover:underline">
                  Open in editor
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No courses found" />
      )}
    </div>
  );
}
