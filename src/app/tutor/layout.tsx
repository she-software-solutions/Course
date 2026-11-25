import { BookOpen, FileCheck2, LayoutDashboard, MessageCircle, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["TUTOR", "ADMIN"], "/tutor");
  const scope = user.role === "ADMIN" ? {} : { tutorId: user.id };
  const [pendingSubs, openQuestions] = await Promise.all([
    db.submission.count({ where: { status: "SUBMITTED", assignment: { section: { course: scope } } } }),
    db.question.count({ where: { answers: { none: {} }, lesson: { section: { course: scope } } } }),
  ]);
  return (
    <DashboardShell
      user={user}
      area="Tutor studio"
      nav={[
        { href: "/tutor", label: "Overview", icon: <LayoutDashboard />, exact: true },
        { href: "/tutor/courses", label: "My courses", icon: <BookOpen /> },
        { href: "/tutor/students", label: "Students", icon: <Users /> },
        { href: "/tutor/submissions", label: "Submissions", icon: <FileCheck2 />, badge: pendingSubs },
        { href: "/tutor/questions", label: "Q&A inbox", icon: <MessageCircle />, badge: openQuestions },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
