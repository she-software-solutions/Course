import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card, CardHeader, PageHeader, Table } from "@/components/ui/misc";
import { EventForm } from "@/components/forms/event-form";
import { formatDateTime } from "@/lib/utils";

export default async function AdminEventsPage() {
  await requireUser(["ADMIN"]);
  const events = await db.event.findMany({ orderBy: { startsAt: "desc" }, include: { _count: { select: { registrations: true } } } });
  const now = new Date();
  return (
    <div className="space-y-6">
      <PageHeader title="Workshops & events" description="Announce workshops, webinars and hackathons." />
      <Card>
        <Table>
          <thead>
            <tr>
              <th>Event</th>
              <th>When</th>
              <th>Registrations</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-primary">
                    {e.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {e.kind} · {e.mode.toLowerCase()}
                  </p>
                </td>
                <td className="whitespace-nowrap text-muted-foreground">{formatDateTime(e.startsAt)}</td>
                <td>
                  {e._count.registrations}
                  {e.capacity ? ` / ${e.capacity}` : ""}
                </td>
                <td>
                  <Badge tone={!e.isPublished ? "neutral" : e.startsAt < now ? "dark" : "success"}>{!e.isPublished ? "hidden" : e.startsAt < now ? "past" : "upcoming"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title="Create an event" />
        <EventForm />
      </Card>
    </div>
  );
}
