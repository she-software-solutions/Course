import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Avatar, Badge, Card, EmptyState, PageHeader, Progress, Table } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export default async function StudentsPage() {
  const user = await requireUser(["TUTOR", "ADMIN"]);
  const enrollments = await db.enrollment.findMany({
    where: { course: { tutorId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      course: { select: { id: true, title: true, sections: { select: { lessons: { select: { id: true } } } } } },
    },
  });
  const progress = await db.lessonProgress.groupBy({
    by: ["userId"],
    where: { lesson: { section: { course: { tutorId: user.id } } } },
    _count: { _all: true },
  });
  // Per user+course progress
  const rows = await db.lessonProgress.findMany({
    where: { lesson: { section: { course: { tutorId: user.id } } } },
    select: { userId: true, lesson: { select: { section: { select: { courseId: true } } } } },
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.userId}:${r.lesson.section.courseId}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader title="Students" description={`${enrollments.length} enrollments · ${progress.length} active learners`} />
      {enrollments.length ? (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>Course</th>
                <th>Enrolled</th>
                <th className="w-48">Progress</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => {
                const total = e.course.sections.reduce((a, s) => a + s.lessons.length, 0);
                const done = counts.get(`${e.user.id}:${e.course.id}`) ?? 0;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={e.user.name} src={e.user.image} size={32} />
                        <div>
                          <p className="font-medium">{e.user.name}</p>
                          <p className="text-xs text-muted-foreground">{e.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs truncate">{e.course.title}</td>
                    <td className="whitespace-nowrap text-muted-foreground">{formatDate(e.createdAt)}</td>
                    <td>
                      {e.completedAt ? (
                        <Badge tone="success">Completed</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Progress value={pct} />
                          <span className="w-9 text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No students yet" description="Once learners enroll in your courses they will appear here." />
      )}
    </div>
  );
}
