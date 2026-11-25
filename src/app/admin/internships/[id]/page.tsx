import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Select } from "@/components/ui/field";
import { Badge, Card, CardHeader, PageHeader, Table } from "@/components/ui/misc";
import { InternshipForm } from "@/components/forms/internship-form";
import { deleteInternshipAction, setApplicationStatusAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";
import { applicationTone } from "@/lib/tones";

export default async function AdminInternshipDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const internship = await db.internship.findUnique({
    where: { id },
    include: { applications: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } } },
  });
  if (!internship) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/internships" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft className="h-4 w-4" /> All internships
      </Link>
      <PageHeader title={internship.title} description={`${internship.applications.length} applications`} />
      <Card>
        <CardHeader title="Applications" />
        <Table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Links</th>
              <th>Applied</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {internship.applications.map((a) => (
              <tr key={a.id}>
                <td>
                  <p className="font-medium">{a.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.user.email} · {a.phone}
                  </p>
                  {a.college ? <p className="text-xs text-muted-foreground">{a.college}</p> : null}
                  {a.coverNote ? <p className="mt-1 max-w-md text-xs italic text-muted-foreground">“{a.coverNote}”</p> : null}
                </td>
                <td className="text-sm">
                  <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="block text-primary hover:underline">
                    Resume
                  </a>
                  {a.portfolioUrl ? (
                    <a href={a.portfolioUrl} target="_blank" rel="noreferrer" className="block text-primary hover:underline">
                      Portfolio
                    </a>
                  ) : null}
                </td>
                <td className="whitespace-nowrap text-muted-foreground">{formatDate(a.createdAt)}</td>
                <td>
                  <ActionForm action={setApplicationStatusAction.bind(null, a.id)} className="flex items-center gap-2">
                    <Badge tone={applicationTone[a.status]}>{a.status.toLowerCase()}</Badge>
                    <Select name="status" defaultValue={a.status} className="h-8 w-32 text-xs" aria-label="Status">
                      <option value="APPLIED">Applied</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </Select>
                    <SubmitButton size="sm" variant="outline">
                      Update
                    </SubmitButton>
                  </ActionForm>
                </td>
              </tr>
            ))}
            {!internship.applications.length ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No applications yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title="Edit internship" />
        <InternshipForm internship={internship} />
      </Card>
      <ActionForm action={deleteInternshipAction.bind(null, internship.id)}>
        <SubmitButton variant="danger" size="sm" confirm="Delete this internship and all applications?">
          <Trash2 className="h-4 w-4" /> Delete internship
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
