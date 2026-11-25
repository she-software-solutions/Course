import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock, MapPin, Users, Video } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Badge, Card } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { cancelEventRegistrationAction, registerEventAction } from "@/app/actions/public";
import { formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const e = await db.event.findUnique({ where: { slug }, select: { title: true, description: true } });
  return e ? { title: e.title, description: e.description.slice(0, 160) } : { title: "Event" };
}

export default async function EventDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const [event, user] = await Promise.all([
    db.event.findUnique({ where: { slug }, include: { _count: { select: { registrations: true } } } }),
    getCurrentUser(),
  ]);
  if (!event || (!event.isPublished && user?.role !== "ADMIN")) notFound();
  const registered = user ? Boolean(await db.eventRegistration.findUnique({ where: { eventId_userId: { eventId: event.id, userId: user.id } } })) : false;
  const isPast = event.startsAt < new Date();
  const full = event.capacity !== null && event._count.registrations >= event.capacity;

  return (
    <div className="container-page py-10">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft className="h-4 w-4" /> All events
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <Badge tone="brand">{event.kind}</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h1>
          <div className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{event.description}</div>
        </div>
        <Card className="h-fit space-y-4 p-6 lg:sticky lg:top-20">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-primary" /> {formatDate(event.startsAt, { dateStyle: "full" })}
            </li>
            <li className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" /> {formatDate(event.startsAt, { timeStyle: "short" })}
              {event.endsAt ? ` – ${formatDate(event.endsAt, { timeStyle: "short" })}` : ""} IST
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary" /> {event.mode === "ONLINE" ? "Online" : `${event.location ?? ""} (${event.mode.toLowerCase()})`}
            </li>
            <li className="flex items-center gap-3">
              <Users className="h-4 w-4 text-primary" /> {event._count.registrations} registered{event.capacity ? ` of ${event.capacity} seats` : ""}
            </li>
          </ul>
          {isPast ? (
            <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">This event has ended.</p>
          ) : registered ? (
            <div className="space-y-3">
              <p className="flex items-center justify-center gap-2 rounded-lg bg-success-soft p-3 text-sm font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" /> You&apos;re registered
              </p>
              {event.meetingUrl && event.mode !== "OFFLINE" ? (
                <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-semibold text-primary hover:bg-muted">
                  <Video className="h-4 w-4" /> Join link
                </a>
              ) : null}
              <ActionForm action={cancelEventRegistrationAction.bind(null, event.id)}>
                <SubmitButton variant="ghost" size="sm" className="w-full text-muted-foreground" confirm="Cancel your registration?">
                  Cancel registration
                </SubmitButton>
              </ActionForm>
            </div>
          ) : !user ? (
            <LinkButton href={`/login?callbackUrl=/events/${slug}`} className="w-full">
              Log in to register
            </LinkButton>
          ) : full ? (
            <p className="rounded-lg bg-muted p-3 text-center text-sm font-medium">This event is full.</p>
          ) : (
            <ActionForm action={registerEventAction.bind(null, event.id)}>
              <SubmitButton size="lg" className="w-full">
                Register for free
              </SubmitButton>
            </ActionForm>
          )}
        </Card>
      </div>
    </div>
  );
}
