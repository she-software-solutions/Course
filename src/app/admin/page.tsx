import Link from "next/link";
import { BookOpen, GraduationCap, IndianRupee, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card, CardHeader, PageHeader, StatCard, Table } from "@/components/ui/misc";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";
import { paymentTone } from "@/lib/tones";

export default async function AdminOverview() {
  await requireUser(["ADMIN"]);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [roles, courses, revenue, revenue30, enrollments, enrollments30, certs, pending, payments, topCourses, newUsers] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.course.groupBy({ by: ["status"], _count: { _all: true } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { status: "PAID", createdAt: { gte: since } }, _sum: { amount: true } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { createdAt: { gte: since } } }),
    db.certificate.count(),
    db.course.findMany({ where: { status: "PENDING_REVIEW" }, include: { tutor: { select: { name: true } } }, orderBy: { updatedAt: "asc" }, take: 5 }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true } }, course: { select: { title: true } } } }),
    db.course.findMany({ where: { status: "PUBLISHED" }, orderBy: { enrollments: { _count: "desc" } }, take: 5, select: { id: true, title: true, slug: true, _count: { select: { enrollments: true } } } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);
  const roleCount = (r: string) => roles.find((x) => x.role === r)?._count._all ?? 0;
  const statusCount = (s: string) => courses.find((x) => x.status === s)?._count._all ?? 0;
  const inr = (p: number | null) => (p ? formatINR(p) : "₹0");

  return (
    <div className="space-y-6">
      <PageHeader title="Admin console" description="A bird's-eye view of the She Learn platform." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={inr(revenue._sum.amount)} hint={`${inr(revenue30._sum.amount)} in the last 30 days`} icon={<IndianRupee className="h-5 w-5" />} />
        <StatCard label="Learners" value={roleCount("LEARNER")} hint={`${roleCount("TUTOR")} tutors · ${roleCount("ADMIN")} admins`} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Enrollments" value={enrollments} hint={`${enrollments30} in the last 30 days`} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Published courses" value={statusCount("PUBLISHED")} hint={`${statusCount("PENDING_REVIEW")} awaiting review · ${certs} certificates issued`} icon={<BookOpen className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Awaiting review" action={<Link href="/admin/courses?status=PENDING_REVIEW" className="text-sm font-semibold text-primary hover:underline">Review queue</Link>} />
          <ul className="divide-y">
            {pending.length ? (
              pending.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {c.tutor.name} · submitted {formatDate(c.updatedAt)}
                    </p>
                  </div>
                  <Link href={`/admin/courses?status=PENDING_REVIEW#${c.id}`} className="text-sm font-semibold text-primary">
                    Review
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">No courses waiting for review.</li>
            )}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Top courses by enrollment" />
          <ul className="divide-y">
            {topCourses.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 font-bold text-primary">{i + 1}</span>
                <Link href={`/courses/${c.slug}`} className="flex-1 truncate text-sm font-medium hover:text-primary">
                  {c.title}
                </Link>
                <span className="text-sm text-muted-foreground">{c._count.enrollments} learners</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Recent payments" action={<Link href="/admin/payments" className="text-sm font-semibold text-primary hover:underline">All payments</Link>} />
          <Table>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium">{p.user.name}</p>
                    <p className="max-w-56 truncate text-xs text-muted-foreground">{p.course.title}</p>
                  </td>
                  <td className="font-semibold">{formatINR(p.amount)}</td>
                  <td>
                    <Badge tone={paymentTone[p.status]}>{p.status.toLowerCase()}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card>
          <CardHeader title="Newest members" action={<Link href="/admin/users" className="text-sm font-semibold text-primary hover:underline">Manage users</Link>} />
          <ul className="divide-y">
            {newUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{u.role.toLowerCase()}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(u.createdAt, { day: "numeric", month: "short" })}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
