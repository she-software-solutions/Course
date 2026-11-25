import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, Clock, GitBranch, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Badge, EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Internships",
  description: "Hands-on internships on real production projects with mentorship and a verified completion certificate.",
};

export default async function InternshipsPage() {
  const internships = await db.internship.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <>
      <section className="bg-hero text-white">
        <div className="container-page py-16">
          <Badge tone="brand">Careers</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Launch your career with real-world experience</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            High-value, hands-on internships designed to accelerate your growth. Gain practical skills, build portfolio-worthy work and earn a recognised completion certificate.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Briefcase, t: "Real-world industry projects" },
              { icon: Users, t: "1-on-1 mentorship & code reviews" },
              { icon: GitBranch, t: "Git workflows & best practices" },
              { icon: BadgeCheck, t: "Verified completion certificate" },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <x.icon className="h-5 w-5 shrink-0 text-brand" />
                <span className="text-sm font-medium">{x.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container-page py-12">
        <h2 className="text-2xl font-bold">Open positions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {internships.length ? (
            internships.map((i) => (
              <Link key={i.id} href={`/internships/${i.id}`} className="group rounded-2xl border bg-card p-6 transition hover:border-brand/50 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{i.domain}</p>
                    <h3 className="mt-1 text-lg font-semibold group-hover:text-primary">{i.title}</h3>
                  </div>
                  <Badge tone="success">{i.stipend ?? "Open"}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{i.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {i.skills.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {i.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {i.mode === "ONLINE" ? "Remote" : (i.location ?? i.mode.toLowerCase())}
                  </span>
                  {i.deadline ? <span>Apply by {formatDate(i.deadline)}</span> : null}
                  <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">
                    View & apply <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState className="md:col-span-2" icon={<Briefcase className="h-6 w-6" />} title="No open internships right now" description="New batches open regularly — follow us on LinkedIn and Instagram for announcements." />
          )}
        </div>
      </section>
    </>
  );
}
