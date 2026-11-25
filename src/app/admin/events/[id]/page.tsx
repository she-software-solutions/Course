import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Card, CardHeader, PageHeader, Table } from "@/components/ui/misc";
import { EventForm } from "@/components/forms/event-form";
import { deleteEventAction } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/utils";

export default async function AdminEventDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { registrations: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, email: true, phone: true } } } } },
  });
  if (!event) notFound();
  return (
    <div className="space-y-6">
      <Link href="/admin/events" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft className="h-4 w-4" /> All events
      </Link>
      <PageHeader title={event.title} description={`${formatDateTime(event.startsAt)} · ${event.registrations.length} registered`} />
      <Card>
        <CardHeader title="Registrations" />
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {event.registrations.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td className="font-medium">{r.user.name}</td>
                <td>{r.user.email}</td>
                <td>{r.user.phone ?? "—"}</td>
                <td className="text-muted-foreground">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
            {!event.registrations.length ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No registrations yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title="Edit event" />
        <EventForm event={event} />
      </Card>
      <ActionForm action={deleteEventAction.bind(null, event.id)}>
        <SubmitButton variant="danger" size="sm" confirm="Delete this event and all registrations?">
          <Trash2 className="h-4 w-4" /> Delete event
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
