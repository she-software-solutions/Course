import { Award, BookOpen, Briefcase, LayoutDashboard, Receipt, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/session";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(undefined, "/dashboard");
  return (
    <DashboardShell
      user={user}
      area="Learner"
      nav={[
        { href: "/dashboard", label: "Overview", icon: <LayoutDashboard />, exact: true },
        { href: "/dashboard/courses", label: "My courses", icon: <BookOpen /> },
        { href: "/dashboard/certificates", label: "Certificates", icon: <Award /> },
        { href: "/dashboard/activity", label: "Internships & events", icon: <Briefcase /> },
        { href: "/dashboard/purchases", label: "Purchases", icon: <Receipt /> },
        { href: "/dashboard/profile", label: "Profile & settings", icon: <UserRound /> },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
