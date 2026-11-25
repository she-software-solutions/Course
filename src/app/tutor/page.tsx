import Link from "next/link";
import { BookOpen, IndianRupee, Plus, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Avatar, Badge, Card, CardHeader, EmptyState, PageHeader, StatCard, Table } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/utils";
import { courseStatusLabel, courseStatusTone } from "@/lib/tones";

export default async function TutorOverview() {
  const user = await requireUser(["TUTOR", "ADMIN"]);
  const scope = { tutorId: user.id };
  const [courses, students, revenue, rating, recent] = await Promise.all([
    db.course.findMany({
      where: scope,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, price: true, _count: { select: { enrollments: true, reviews: true } } },
    }),
    db.enrollment.count({ where: { course: scope } }),
    db.payment.aggregate({ where: { status: "PAID", course: scope }, _sum: { amount: true } }),
    db.review.aggregate({ where: { course: scope }, _avg: { rating: true }, _count: true }),
    db.enrollment.findMany({
      where: { course: scope },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, image: true } }, course: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutor studio"
        description="Create courses, track learners and support your students."
        actions={
          <LinkButton href="/tutor/courses#new">
            <Plus className="h-4 w-4" /> New course
          </LinkButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={courses.length} hint={`${courses.filter((c) => c.status === "PUBLISHED").length} published`} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Enrollments" value={students.toLocaleString("en-IN")} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Revenue" value={formatINR(revenue._sum.amount ?? 0).replace("Free", "₹0")} hint="Gross, from paid enrollments" icon={<IndianRupee className="h-5 w-5" />} />
        <StatCard label="Average rating" value={rating._avg.rating ? rating._avg.rating.toFixed(2) : "—"} hint={`${rating._count} reviews`} icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Your courses" action={<Link href="/tutor/courses" className="text-sm font-semibold text-primary hover:underline">Manage</Link>} />
          {courses.length ? (
            <Table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Learners</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {courses.slice(0, 8).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/tutor/courses/${c.id}`} className="font-medium hover:text-primary">
                        {c.title}
                      </Link>
                    </td>
                    <td>
                      <Badge tone={courseStatusTone[c.status]}>{courseStatusLabel[c.status]}</Badge>
                    </td>
                    <td>{c._count.enrollments}</td>
                    <td>{formatINR(c.price)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="p-5">
              <EmptyState title="No courses yet" description="Create your first course to start teaching." action={<LinkButton href="/tutor/courses#new">Create course</LinkButton>} />
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent enrollments" />
          <ul className="divide-y">
            {recent.length ? (
              recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={e.user.name} src={e.user.image} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.course.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(e.createdAt, { day: "numeric", month: "short" })}</span>
                </li>
              ))
            ) : (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">No enrollments yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
