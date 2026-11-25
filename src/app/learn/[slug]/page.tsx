import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Award, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, ClipboardCheck, FileText, PlayCircle, VideoOff } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canAccessCourse, getCourseCurriculum } from "@/lib/learning";
import { getEmbedUrl } from "@/lib/video";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Progress, Badge } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { CompleteButton } from "@/components/learn/complete-button";
import { QuizView } from "@/components/learn/quiz-view";
import { AssignmentView } from "@/components/learn/assignment-view";
import { QASection } from "@/components/learn/qa-section";
import { cn, formatDuration } from "@/lib/utils";

type Params = Promise<{ slug: string }>;
type SP = Promise<{ lesson?: string; quiz?: string; assignment?: string; tab?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: c ? `Learning: ${c.title}` : "Course player" };
}

export default async function LearnPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { slug } = await params;
  const sp = await searchParams;
  const user = await requireUser(undefined, `/learn/${slug}`);

  const course = await db.course.findUnique({ where: { slug }, select: { id: true, slug: true, title: true, tutorId: true, status: true } });
  if (!course) notFound();
  if (!(await canAccessCourse(user, course))) redirect(`/courses/${slug}`);

  const [sections, progressRows, passedQuizzes, submissions, enrollment, certificate] = await Promise.all([
    getCourseCurriculum(course.id),
    db.lessonProgress.findMany({ where: { userId: user.id, lesson: { section: { courseId: course.id } } }, select: { lessonId: true } }),
    db.quizAttempt.findMany({ where: { userId: user.id, passed: true, quiz: { section: { courseId: course.id } } }, select: { quizId: true }, distinct: ["quizId"] }),
    db.submission.findMany({ where: { userId: user.id, assignment: { section: { courseId: course.id } } }, select: { assignmentId: true, status: true } }),
    db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
    db.certificate.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
  ]);

  const done = new Set(progressRows.map((p) => p.lessonId));
  const passed = new Set(passedQuizzes.map((q) => q.quizId));
  const submitted = new Map(submissions.map((s) => [s.assignmentId, s.status]));
  const lessons = sections.flatMap((s) => s.lessons);
  const pct = lessons.length ? Math.round((done.size / lessons.length) * 100) : 0;

  // Linear sequence of all items for prev/next navigation
  const sequence = sections.flatMap((s) => [
    ...s.lessons.map((l) => ({ kind: "lesson" as const, id: l.id })),
    ...s.quizzes.map((q) => ({ kind: "quiz" as const, id: q.id })),
    ...s.assignments.map((a) => ({ kind: "assignment" as const, id: a.id })),
  ]);
  const hrefFor = (it: { kind: string; id: string }) => `/learn/${slug}?${it.kind}=${it.id}`;

  let current: { kind: "lesson" | "quiz" | "assignment"; id: string } | undefined;
  if (sp.quiz) current = { kind: "quiz", id: sp.quiz };
  else if (sp.assignment) current = { kind: "assignment", id: sp.assignment };
  else {
    const id = sp.lesson ?? enrollment?.lastLessonId ?? lessons.find((l) => !done.has(l.id))?.id ?? lessons[0]?.id;
    if (id) current = { kind: "lesson", id };
  }
  const idx = current ? sequence.findIndex((s) => s.kind === current!.kind && s.id === current!.id) : -1;
  if (current && idx === -1) notFound();
  const prev = idx > 0 ? sequence[idx - 1] : undefined;
  const next = idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-ink text-white">
        <div className="flex h-14 items-center gap-4 px-4">
          <Logo invert height={34} />
          <span className="hidden h-6 w-px bg-white/20 sm:block" />
          <Link href={`/courses/${slug}`} className="hidden min-w-0 truncate text-sm font-semibold hover:text-brand sm:block">
            {course.title}
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden w-40 md:block">
              <Progress value={pct} className="bg-white/15" />
              <p className="mt-1 text-[11px] text-white/60">
                {done.size}/{lessons.length} lessons · {pct}%
              </p>
            </div>
            {certificate ? (
              <LinkButton href={`/certificates/${certificate.code}`} size="sm" className="hidden sm:inline-flex">
                <Award className="h-4 w-4" /> Certificate
              </LinkButton>
            ) : null}
            <ThemeToggle className="hover:bg-white/10" />
            <LinkButton href="/dashboard" size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Dashboard
            </LinkButton>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="min-w-0 flex-1 bg-muted/40">
          {!current ? (
            <div className="p-10 text-center text-muted-foreground">This course has no content yet.</div>
          ) : current.kind === "lesson" ? (
            <LessonPane
              lessonId={current.id}
              user={user}
              courseTutorId={course.tutorId}
              completed={done.has(current.id)}
              nextHref={next ? hrefFor(next) : undefined}
              tab={sp.tab}
              slug={slug}
            />
          ) : current.kind === "quiz" ? (
            <div className="p-4 sm:p-8">
              <QuizPane quizId={current.id} userId={user.id} />
            </div>
          ) : (
            <div className="p-4 sm:p-8">
              <AssignmentPane assignmentId={current.id} userId={user.id} />
            </div>
          )}
          <div className="flex items-center justify-between border-t bg-card px-4 py-3 sm:px-8">
            {prev ? (
              <Link href={hrefFor(prev)} className="inline-flex items-center gap-1 text-sm font-semibold hover:text-primary">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={hrefFor(next)} className="inline-flex items-center gap-1 text-sm font-semibold hover:text-primary">
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </main>

        <aside className="border-l bg-card lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:w-[360px] lg:overflow-y-auto">
          <div className="border-b p-4">
            <p className="font-semibold">Course content</p>
            <Progress value={pct} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">{pct}% complete · Finish all lessons and pass all quizzes to earn your certificate.</p>
          </div>
          {sections.map((s, si) => (
            <details key={s.id} open className="border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between bg-muted/50 px-4 py-3 text-sm font-semibold">
                <span>
                  Section {si + 1}: {s.title}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {s.lessons.filter((l) => done.has(l.id)).length}/{s.lessons.length}
                </span>
              </summary>
              <ul>
                {s.lessons.map((l) => (
                  <SidebarItem
                    key={l.id}
                    href={hrefFor({ kind: "lesson", id: l.id })}
                    active={current?.kind === "lesson" && current.id === l.id}
                    done={done.has(l.id)}
                    icon={<PlayCircle className="h-3.5 w-3.5" />}
                    title={l.title}
                    meta={formatDuration(l.durationMin)}
                  />
                ))}
                {s.quizzes.map((q) => (
                  <SidebarItem
                    key={q.id}
                    href={hrefFor({ kind: "quiz", id: q.id })}
                    active={current?.kind === "quiz" && current.id === q.id}
                    done={passed.has(q.id)}
                    icon={<ClipboardCheck className="h-3.5 w-3.5" />}
                    title={`Quiz: ${q.title}`}
                    meta={`${q._count.questions} questions`}
                  />
                ))}
                {s.assignments.map((a) => (
                  <SidebarItem
                    key={a.id}
                    href={hrefFor({ kind: "assignment", id: a.id })}
                    active={current?.kind === "assignment" && current.id === a.id}
                    done={submitted.get(a.id) === "GRADED"}
                    icon={<FileText className="h-3.5 w-3.5" />}
                    title={`Assignment: ${a.title}`}
                    meta={submitted.has(a.id) ? (submitted.get(a.id) === "GRADED" ? "Graded" : submitted.get(a.id) === "RESUBMIT" ? "Resubmit" : "Submitted") : "Not submitted"}
                  />
                ))}
              </ul>
            </details>
          ))}
        </aside>
      </div>
    </div>
  );
}

function SidebarItem({ href, active, done, icon, title, meta }: { href: string; active: boolean; done: boolean; icon: React.ReactNode; title: string; meta: string }) {
  return (
    <li>
      <Link href={href} className={cn("flex gap-3 border-l-[3px] px-4 py-3 text-sm transition", active ? "border-primary bg-accent" : "border-transparent hover:bg-muted")}>
        {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 flex-1">
          <span className={cn("block leading-snug", active && "font-semibold")}>{title}</span>
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            {icon} {meta}
          </span>
        </span>
      </Link>
    </li>
  );
}

async function LessonPane({
  lessonId,
  user,
  courseTutorId,
  completed,
  nextHref,
  tab,
  slug,
}: {
  lessonId: string;
  user: { id: string; role: string };
  courseTutorId: string;
  completed: boolean;
  nextHref?: string;
  tab?: string;
  slug: string;
}) {
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) notFound();
  const embed = getEmbedUrl(lesson.videoUrl);
  const questions =
    tab === "qa"
      ? await db.question.findMany({
          where: { lessonId },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, image: true } },
            answers: { orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true, image: true, role: true } } } },
          },
        })
      : [];
  const qCount = await db.question.count({ where: { lessonId } });
  const base = `/learn/${slug}?lesson=${lessonId}`;

  return (
    <div>
      <div className="bg-black">
        <div className="mx-auto aspect-video max-h-[70vh] w-full max-w-6xl">
          {embed ? (
            <iframe
              key={lessonId}
              src={embed}
              title={lesson.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/70">
              <VideoOff className="h-10 w-10" />
              <p>No video for this lesson.</p>
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-5xl p-4 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatDuration(lesson.durationMin)} lesson</p>
          </div>
          <CompleteButton lessonId={lesson.id} completed={completed} nextHref={nextHref} />
        </div>
        <div className="mt-6 flex gap-1 border-b">
          <Link href={base} className={cn("border-b-2 px-4 py-2 text-sm font-semibold", tab !== "qa" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
            Overview
          </Link>
          <Link href={`${base}&tab=qa`} className={cn("border-b-2 px-4 py-2 text-sm font-semibold", tab === "qa" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
            Q&amp;A <Badge className="ml-1">{qCount}</Badge>
          </Link>
        </div>
        <div className="py-6">
          {tab === "qa" ? (
            <QASection lessonId={lesson.id} questions={questions} currentUserId={user.id} tutorId={courseTutorId} canModerate={user.role === "ADMIN" || user.id === courseTutorId} />
          ) : (
            <div className="space-y-6">
              {lesson.description ? <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{lesson.description}</p> : <p className="text-muted-foreground">Watch the video and mark the lesson complete when you are done.</p>}
              {lesson.resources ? (
                <div className="rounded-2xl border bg-card p-5">
                  <p className="font-semibold">Resources & notes</p>
                  <div className="mt-2 whitespace-pre-line break-words text-sm text-muted-foreground">{lesson.resources}</div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function QuizPane({ quizId, userId }: { quizId: string; userId: string }) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { position: "asc" }, select: { id: true, prompt: true, options: true } } },
  });
  if (!quiz) notFound();
  const best = await db.quizAttempt.aggregate({ where: { quizId, userId }, _max: { score: true } });
  return <QuizView quizId={quiz.id} title={quiz.title} passScore={quiz.passScore} questions={quiz.questions} bestScore={best._max.score ?? null} />;
}

async function AssignmentPane({ assignmentId, userId }: { assignmentId: string; userId: string }) {
  const assignment = await db.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) notFound();
  const submission = await db.submission.findUnique({ where: { assignmentId_userId: { assignmentId, userId } } });
  return <AssignmentView assignment={assignment} submission={submission} />;
}
