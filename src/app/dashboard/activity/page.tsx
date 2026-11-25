import Link from "next/link";
import { Briefcase, CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Table } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { applicationTone } from "@/lib/tones";

export default async function ActivityPage() {
  const user = await requireUser();
  const [applications, registrations] = await Promise.all([
    db.internshipApplication.findMany({ where: { userId: user.id }, include: { internship: true }, orderBy: { createdAt: "desc" } }),
    db.eventRegistration.findMany({ where: { userId: user.id }, include: { event: true }, orderBy: { event: { startsAt: "desc" } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Internships & events" description="Track your internship applications and event registrations." />
      <Card>
        <CardHeader title="Internship applications" action={<LinkButton href="/internships" size="sm" variant="outline">Browse internships</LinkButton>} />
        {applications.length ? (
          <Table>
            <thead>
              <tr>
                <th>Internship</th>
                <th>Applied on</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/internships/${a.internshipId}`} className="font-medium hover:text-primary">
                      {a.internship.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{a.internship.domain}</p>
                  </td>
                  <td className="text-muted-foreground">{formatDate(a.createdAt)}</td>
                  <td>
                    <Badge tone={applicationTone[a.status]}>{a.status.toLowerCase()}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No applications yet" description="Apply for an internship to gain real-world experience." />
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Event registrations" action={<LinkButton href="/events" size="sm" variant="outline">Browse events</LinkButton>} />
        {registrations.length ? (
          <Table>
            <thead>
              <tr>
                <th>Event</th>
                <th>When</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/events/${r.event.slug}`} className="font-medium hover:text-primary">
                      {r.event.title}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{formatDateTime(r.event.startsAt)}</td>
                  <td>
                    <Badge tone={r.event.startsAt > new Date() ? "brand" : "neutral"}>{r.event.startsAt > new Date() ? r.event.mode.toLowerCase() : "past"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No registrations yet" description="Join a workshop or webinar to learn live with mentors." />
          </div>
        )}
      </Card>
    </div>
  );
}
