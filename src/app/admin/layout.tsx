import { BookOpen, Briefcase, CalendarDays, CreditCard, Inbox, LayoutDashboard, Tags, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN"], "/admin");
  const [pendingCourses, newMessages] = await Promise.all([
    db.course.count({ where: { status: "PENDING_REVIEW" } }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);
  return (
    <DashboardShell
      user={user}
      area="Admin console"
      nav={[
        { href: "/admin", label: "Overview", icon: <LayoutDashboard />, exact: true },
        { href: "/admin/courses", label: "Courses", icon: <BookOpen />, badge: pendingCourses },
        { href: "/admin/users", label: "Users & roles", icon: <Users /> },
        { href: "/admin/categories", label: "Categories", icon: <Tags /> },
        { href: "/admin/payments", label: "Payments", icon: <CreditCard /> },
        { href: "/admin/internships", label: "Internships", icon: <Briefcase /> },
        { href: "/admin/events", label: "Events", icon: <CalendarDays /> },
        { href: "/admin/messages", label: "Messages", icon: <Inbox />, badge: newMessages },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
