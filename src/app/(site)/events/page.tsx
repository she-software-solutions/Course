import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Badge, EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Workshops & events", description: "Live workshops, seminars, webinars and hackathons by She Software Solutions." };

export default async function EventsPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.event.findMany({ where: { isPublished: true, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, include: { _count: { select: { registrations: true } } } }),
    db.event.findMany({ where: { isPublished: true, startsAt: { lt: now } }, orderBy: { startsAt: "desc" }, take: 6 }),
  ]);

  return (
    <>
      <section className="bg-hero text-white">
        <div className="container-page py-16">
          <Badge tone="brand">Live learning</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Workshops, seminars & hackathons</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">Learn live from mentors, ask questions in real time and build alongside peers — online and across Tamil Nadu.</p>
        </div>
      </section>
      <section className="container-page py-12">
        <h2 className="text-2xl font-bold">Upcoming</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {upcoming.length ? (
            upcoming.map((e) => (
              <Link key={e.id} href={`/events/${e.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:border-brand/50 hover:shadow-md">
                <div className="flex items-center gap-4 bg-gradient-to-r from-[#d63384] to-[#9b3dd6] p-5 text-white">
                  <div className="flex w-16 flex-col items-center rounded-xl bg-white py-1.5 text-ink">
                    <span className="text-xs font-bold uppercase text-primary">{formatDate(e.startsAt, { month: "short" })}</span>
                    <span className="text-2xl font-extrabold">{formatDate(e.startsAt, { day: "2-digit" })}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{e.kind}</p>
                    <p className="font-semibold leading-snug">{e.title}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{e.description}</p>
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDate(e.startsAt, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {e.mode === "ONLINE" ? "Online" : (e.location ?? e.mode.toLowerCase())}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {e._count.registrations} registered
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState className="md:col-span-3" icon={<CalendarDays className="h-6 w-6" />} title="No upcoming events" description="We announce new workshops every month. Check back soon!" />
          )}
        </div>
        {past.length ? (
          <>
            <h2 className="mt-14 text-2xl font-bold">Past events</h2>
            <ul className="mt-4 divide-y rounded-2xl border bg-card">
              {past.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-muted-foreground">
                    {e.kind} · {formatDate(e.startsAt)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </>
  );
}
