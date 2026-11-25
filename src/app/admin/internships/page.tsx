import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card, CardHeader, PageHeader, Table } from "@/components/ui/misc";
import { InternshipForm } from "@/components/forms/internship-form";
import { formatDate } from "@/lib/utils";

export default async function AdminInternshipsPage() {
  await requireUser(["ADMIN"]);
  const internships = await db.internship.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } }, applications: { where: { status: "APPLIED" }, select: { id: true } } },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Internships" description="Publish internship programmes and review applications." />
      <Card>
        <Table>
          <thead>
            <tr>
              <th>Internship</th>
              <th>Mode</th>
              <th>Deadline</th>
              <th>Applications</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {internships.map((i) => (
              <tr key={i.id}>
                <td>
                  <Link href={`/admin/internships/${i.id}`} className="font-medium hover:text-primary">
                    {i.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {i.domain} · {i.duration}
                  </p>
                </td>
                <td className="text-xs">{i.mode.toLowerCase()}</td>
                <td className="text-muted-foreground">{i.deadline ? formatDate(i.deadline) : "—"}</td>
                <td>
                  {i._count.applications}
                  {i.applications.length ? <Badge tone="warning" className="ml-2">{i.applications.length} new</Badge> : null}
                </td>
                <td>
                  <Badge tone={i.isOpen ? "success" : "neutral"}>{i.isOpen ? "open" : "closed"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title="Post a new internship" />
        <InternshipForm />
      </Card>
    </div>
  );
}
