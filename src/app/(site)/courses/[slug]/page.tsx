import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BarChart3, CalendarDays, Check, ClipboardCheck, Clock, FileText, Globe, Infinity as InfinityIcon, Lock, MessageCircle, PlayCircle, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getEmbedUrl } from "@/lib/video";
import { CourseThumb } from "@/components/course/course-thumb";
import { EnrollPanel } from "@/components/course/enroll-panel";
import { ReviewForm } from "@/components/course/review-form";
import { Avatar, Badge, Card, Stars } from "@/components/ui/misc";
import { formatDate, formatDuration, formatINR, levelLabel, plural } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

async function loadCourse(slug: string) {
  return db.course.findUnique({
    where: { slug },
    include: {
      tutor: { select: { id: true, name: true, headline: true, bio: true, image: true, _count: { select: { coursesTaught: { where: { status: "PUBLISHED" } } } } } },
      category: true,
      sections: {
        orderBy: { position: "asc" },
        include: {
          lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, durationMin: true, isPreview: true, videoUrl: true } },
          quizzes: { select: { id: true, title: true } },
          assignments: { select: { id: true, title: true } },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const course = await db.course.findUnique({ where: { slug }, select: { title: true, subtitle: true } });
  if (!course) return { title: "Course not found" };
  return { title: course.title, description: course.subtitle ?? undefined };
}

export default async function CoursePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [course, user] = await Promise.all([loadCourse(slug), getCurrentUser()]);
  if (!course) notFound();

  const canManage = Boolean(user && (user.role === "ADMIN" || user.id === course.tutorId));
  if (course.status !== "PUBLISHED" && !canManage) notFound();

  const [enrollment, ratingAgg, reviews, myReview] = await Promise.all([
    user ? db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
    db.review.aggregate({ where: { courseId: course.id }, _avg: { rating: true } }),
    db.review.findMany({ where: { courseId: course.id }, orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true, image: true } } } }),
    user ? db.review.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
  ]);

  const lessons = course.sections.flatMap((s) => s.lessons);
  const totalMinutes = lessons.reduce((a, l) => a + l.durationMin, 0);
  const quizCount = course.sections.reduce((a, s) => a + s.quizzes.length, 0);
  const assignmentCount = course.sections.reduce((a, s) => a + s.assignments.length, 0);
  const avg = ratingAgg._avg.rating ?? 0;
  const previewUrl = getEmbedUrl(course.promoVideoUrl ?? lessons.find((l) => l.isPreview)?.videoUrl);
  const discount = course.mrp && course.mrp > course.price ? Math.round(((course.mrp - course.price) / course.mrp) * 100) : 0;

  const includes = [
    { icon: PlayCircle, t: `${formatDuration(totalMinutes)} on-demand video` },
    { icon: ClipboardCheck, t: plural(quizCount, "quiz", "quizzes") },
    { icon: FileText, t: plural(assignmentCount, "mentor-reviewed assignment") },
    { icon: MessageCircle, t: "Lesson Q&A with the tutor" },
    { icon: InfinityIcon, t: "Lifetime access" },
    ...(course.certificateOn ? [{ icon: Award, t: "Verified certificate of completion" }] : []),
  ];

  return (
    <>
      {course.status !== "PUBLISHED" ? (
        <div className="bg-warning-soft py-2 text-center text-sm font-medium text-warning">
          Preview — this course is <strong>{course.status.replace("_", " ").toLowerCase()}</strong> and not visible to learners.
        </div>
      ) : null}
      <section className="bg-hero text-white">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
          <div>
            <nav className="text-sm text-white/60">
              <Link href="/courses" className="hover:text-white">
                Courses
              </Link>
              {course.category ? (
                <>
                  {" / "}
                  <Link href={`/courses?category=${course.category.slug}`} className="hover:text-white">
                    {course.category.name}
                  </Link>
                </>
              ) : null}
            </nav>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{course.title}</h1>
            {course.subtitle ? <p className="mt-3 text-lg text-white/75">{course.subtitle}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {course.isFeatured ? <Badge tone="brand">Bestseller</Badge> : null}
              {course._count.reviews ? (
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-400">{avg.toFixed(1)}</span>
                  <Stars rating={avg} />
                  <span className="text-white/60">({plural(course._count.reviews, "rating")})</span>
                </span>
              ) : null}
              <span className="flex items-center gap-1.5 text-white/80">
                <Users className="h-4 w-4" /> {course._count.enrollments.toLocaleString("en-IN")} learners
              </span>
            </div>
            <p className="mt-4 text-sm text-white/70">
              Created by <span className="font-semibold text-brand">{course.tutor.name}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" /> {levelLabel[course.level]}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> {course.language}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> Updated {formatDate(course.updatedAt, { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10 lg:order-1">
          {course.outcomes.length ? (
            <Card className="p-6">
              <h2 className="text-xl font-bold">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {o}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <section>
            <h2 className="text-xl font-bold">Course content</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {plural(course.sections.length, "section")} · {plural(lessons.length, "lesson")} · {formatDuration(totalMinutes)} total
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border">
              {course.sections.map((s, i) => (
                <details key={s.id} open={i === 0} className="group border-b last:border-b-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-muted/60 px-5 py-4 font-semibold">
                    <span>{s.title}</span>
                    <span className="shrink-0 text-xs font-normal text-muted-foreground">
                      {plural(s.lessons.length, "lesson")} · {formatDuration(s.lessons.reduce((a, l) => a + l.durationMin, 0))}
                    </span>
                  </summary>
                  <ul className="divide-y">
                    {s.lessons.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                        {l.isPreview ? <PlayCircle className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1">{l.title}</span>
                        {l.isPreview ? <Badge tone="brand">Preview</Badge> : null}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> {formatDuration(l.durationMin)}
                        </span>
                      </li>
                    ))}
                    {s.quizzes.map((q) => (
                      <li key={q.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">Quiz: {q.title}</span>
                      </li>
                    ))}
                    {s.assignments.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">Assignment: {a.title}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">Description</h2>
            <div className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{course.description}</div>
            {course.requirements.length ? (
              <>
                <h3 className="mt-6 font-semibold">Requirements</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {course.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section>
            <h2 className="text-xl font-bold">Your instructor</h2>
            <Card className="mt-4 flex gap-4 p-6">
              <Avatar name={course.tutor.name} src={course.tutor.image} size={64} />
              <div>
                <p className="text-lg font-semibold text-primary">{course.tutor.name}</p>
                {course.tutor.headline ? <p className="text-sm text-muted-foreground">{course.tutor.headline}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{course.tutor._count.coursesTaught} courses on She Learn</p>
                {course.tutor.bio ? <p className="mt-3 text-sm leading-relaxed">{course.tutor.bio}</p> : null}
              </div>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Learner reviews</h2>
              {course._count.reviews ? (
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="font-bold text-warning">{avg.toFixed(1)}</span> <Stars rating={avg} />
                </span>
              ) : null}
            </div>
            {enrollment ? (
              <div className="mt-4">
                <ReviewForm courseId={course.id} initial={myReview ? { rating: myReview.rating, comment: myReview.comment } : undefined} />
              </div>
            ) : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {reviews.length ? (
                reviews.map((r) => (
                  <Card key={r.id} className="p-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.user.name} src={r.user.image} size={36} />
                      <div>
                        <p className="text-sm font-semibold">{r.user.name}</p>
                        <div className="flex items-center gap-2">
                          <Stars rating={r.rating} size={12} />
                          <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {r.comment ? <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p> : null}
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:order-2 lg:-mt-64">
          <Card className="overflow-hidden lg:sticky lg:top-20">
            {previewUrl ? (
              <div className="aspect-video bg-black">
                <iframe src={previewUrl} title="Course preview" className="h-full w-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
              </div>
            ) : (
              <CourseThumb title={course.title} thumbnail={course.thumbnail} category={course.category?.name} />
            )}
            <div className="space-y-5 p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold">{formatINR(course.price)}</span>
                {discount ? (
                  <>
                    <span className="text-muted-foreground line-through">{formatINR(course.mrp!)}</span>
                    <Badge tone="success">{discount}% off</Badge>
                  </>
                ) : null}
              </div>
              <EnrollPanel
                courseId={course.id}
                slug={course.slug}
                title={course.title}
                price={course.price}
                enrolled={Boolean(enrollment)}
                signedIn={Boolean(user)}
                canManage={canManage}
                user={user ? { name: user.name, email: user.email } : undefined}
              />
              {canManage ? (
                <Link href={`/tutor/courses/${course.id}`} className="block text-center text-sm font-semibold text-primary hover:underline">
                  Edit this course
                </Link>
              ) : null}
              <div>
                <p className="text-sm font-semibold">This course includes</p>
                <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                  {includes.map((i) => (
                    <li key={i.t} className="flex items-center gap-2.5">
                      <i.icon className="h-4 w-4 text-primary" /> {i.t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
