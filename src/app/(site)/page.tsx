import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CircleCheck,
  GraduationCap,
  HeartHandshake,
  Laptop,
  MessageCircle,
  PlayCircle,
  Quote,
  Search,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCourseCards } from "@/lib/catalog";
import { CourseCard } from "@/components/course/course-card";
import { LinkButton } from "@/components/ui/button";
import { Stars } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";


// Public Google reviews published on shesoftwaresolutions.com
const testimonials = [
  { name: "Shobashree Suresh Kumar", text: "I have learned how to approach interviews, focus on strong fundamentals, and clearly present my knowledge. I now have a good understanding of the interviewer's perspective." },
  { name: "L Kare", text: "Excellent seminar by She Software Solutions! The team is highly skilled and very supportive. I learned a lot of new things about current technologies and appreciated the personal attention given to our questions." },
  { name: "Sahana Venkatachalam", text: "The guidance is clear, step by step, and very supportive. They explain concepts patiently and provide good technical help, which makes it easier for students to understand and complete their projects with confidence." },
  { name: "Dharrshenee D", text: "Hands-on sessions, real-world examples, and project-based learning make the courses highly effective and engaging. I would recommend giving it a try." },
];

export default async function HomePage() {
  const [featured, popularFree, categories, stats, events] = await Promise.all([
    getCourseCards({ take: 8 }),
    getCourseCards({ where: { price: 0 }, take: 4 }),
    db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { courses: { where: { status: "PUBLISHED" } } } } } }),
    Promise.all([db.user.count({ where: { role: "LEARNER" } }), db.course.count({ where: { status: "PUBLISHED" } }), db.user.count({ where: { role: "TUTOR" } }), db.certificate.count()]),
    db.event.findMany({ where: { isPublished: true, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 3 }),
  ]);
  const [learnerCount, courseCount, tutorCount] = stats;

  return (
    <>
      {/* Hero */}
      <section className="bg-hero relative overflow-hidden text-white">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              <HeartHandshake className="h-3.5 w-3.5 text-brand" /> A women-led learning initiative
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Learn in-demand tech skills. <span className="text-gradient">Build a career you love.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Industry-ready video courses, mentor reviews, internships and verified certificates — designed for students, freshers and working
              professionals.
            </p>
            <form action="/courses" className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30">
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                name="q"
                aria-label="What do you want to learn?"
                placeholder="What do you want to learn today?"
                className="h-11 w-full min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button className="h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover cursor-pointer">Search</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {["Web Development", "Python", "Machine Learning", "UI/UX", "Interview Prep"].map((t) => (
                <Link key={t} href={`/courses?q=${encodeURIComponent(t)}`} className="rounded-full border border-white/20 px-3 py-1 text-white/80 hover:border-brand hover:text-white">
                  {t}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-[2rem] bg-brand/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white p-8 shadow-2xl">
              <Image src="/brand/logo-round-light.png" alt="She Software Solutions" width={806} height={764} className="mx-auto h-auto w-full max-w-sm" priority />
            </div>
            <div className="absolute -left-8 bottom-10 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-foreground shadow-xl">
              <div className="rounded-xl bg-accent p-2 text-accent-foreground">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Verified certificates</p>
                <p className="text-xs text-muted-foreground">Shareable on LinkedIn</p>
              </div>
            </div>
            <div className="absolute -right-4 top-8 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-foreground shadow-xl">
              <div className="rounded-xl bg-success-soft p-2 text-success">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">1:1 mentorship</p>
                <p className="text-xs text-muted-foreground">Doubts answered by tutors</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/20">
          <div className="container-page grid grid-cols-2 gap-6 py-6 text-center md:grid-cols-4">
            {[
              { v: `${Math.max(learnerCount, 1).toLocaleString("en-IN")}+`, l: "Active learners" },
              { v: `${courseCount}+`, l: "Expert-led courses" },
              { v: `${tutorCount}+`, l: "Industry mentors" },
              { v: "24/7", l: "Learner support" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-extrabold sm:text-3xl">{s.v}</p>
                <p className="text-sm text-white/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <SectionHeading eyebrow="Explore" title="Top categories" subtitle="Career-focused tracks curated by practitioners." />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/courses?category=${c.slug}`} className="group rounded-2xl border bg-card p-5 transition hover:border-brand/50 hover:shadow-md">
              <p className="font-semibold group-hover:text-primary">{c.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
              <p className="mt-3 text-xs font-semibold text-primary">{c._count.courses} courses →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-muted/60 py-16">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Most popular" title="Courses learners love" subtitle="Hands-on, project-based and mentor-supported." />
            <LinkButton href="/courses" variant="outline">
              View all courses <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16">
        <SectionHeading eyebrow="How it works" title="Your path from learner to professional" center />
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            { icon: PlayCircle, t: "Learn by watching", d: "Bite-sized HD video lessons you can take at your own pace." },
            { icon: Laptop, t: "Practise hands-on", d: "Quizzes after every module and real assignments reviewed by mentors." },
            { icon: MessageCircle, t: "Ask your mentor", d: "Lesson-level Q&A — get your doubts cleared by the course tutor." },
            { icon: BadgeCheck, t: "Get certified", d: "Earn a verifiable certificate and apply for internships." },
          ].map((s, i) => (
            <div key={s.t} className="relative rounded-2xl border bg-card p-6">
              <span className="absolute right-5 top-4 font-display text-4xl font-bold text-brand/15">0{i + 1}</span>
              <div className="inline-flex rounded-xl bg-accent p-3 text-accent-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free courses */}
      {popularFree.length ? (
        <section className="container-page pb-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Start for free" title="Free courses to begin your journey" />
            <LinkButton href="/courses?price=free" variant="ghost">
              See all free courses <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularFree.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Internships + Events */}
      <section className="bg-ink py-16 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="inline-flex rounded-xl bg-brand/20 p-3 text-brand">
              <Briefcase className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">Launch your career with real-world internships</h2>
            <p className="mt-3 text-white/70">
              Work on real production projects with 1-on-1 mentorship, code reviews and Git workflows — and earn a verified completion certificate.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/80">
              {["Real project experience", "Code reviews and mentorship", "Git, CI/CD and best practices", "Internship completion certificate"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <CircleCheck className="h-4 w-4 text-brand" /> {x}
                </li>
              ))}
            </ul>
            <LinkButton href="/internships" className="mt-7">
              Explore internships <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upcoming workshops & events</h2>
              <Link href="/events" className="text-sm font-semibold text-brand hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {events.length ? (
                events.map((e) => (
                  <Link key={e.id} href={`/events/${e.slug}`} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-brand/60">
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-ink">
                      <span className="text-xs font-semibold uppercase text-primary">{formatDate(e.startsAt, { month: "short" })}</span>
                      <span className="text-2xl font-extrabold">{formatDate(e.startsAt, { day: "2-digit" })}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{e.kind} · {e.mode.toLowerCase()}</p>
                      <p className="mt-1 font-semibold">{e.title}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-white/60">{e.description}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="flex items-center gap-2 text-white/60">
                  <CalendarDays className="h-4 w-4" /> New events are announced every month.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-page py-16">
        <SectionHeading eyebrow="Testimonials" title="What our learners say" subtitle="Reviews from students who learned with She Software Solutions on Google." center />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border bg-card p-6">
              <Quote className="h-7 w-7 text-brand" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">“{t.text}”</blockquote>
              <figcaption className="mt-5 border-t pt-4">
                <Stars rating={5} />
                <p className="mt-1 text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">Google review</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#d63384] via-[#ff69b4] to-[#9b3dd6] p-10 text-white sm:p-14">
          <div className="bg-dots absolute inset-0 opacity-30" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">Share your expertise. Teach with She.</h2>
              <p className="mt-2 max-w-xl text-white/85">Join our mentor community, publish video courses and help thousands of learners build their careers.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/teach" variant="secondary" size="lg">
                <GraduationCap className="h-5 w-5" /> Become a tutor
              </LinkButton>
              <LinkButton href="/register" size="lg" className="bg-white text-primary hover:bg-white/90">
                Start learning free
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, subtitle, center }: { eyebrow: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : ""}>
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
