import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, ClipboardCheck, ExternalLink, FileText, PlayCircle, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/misc";
import {
  addAssignmentAction,
  addLessonAction,
  addQuizAction,
  addSectionAction,
  deleteAssignmentAction,
  deleteCourseAction,
  deleteLessonAction,
  deleteSectionAction,
  moveLessonAction,
  moveSectionAction,
  renameSectionAction,
  setCourseArchivedAction,
  submitForReviewAction,
  updateAssignmentAction,
  updateCourseDetailsAction,
  updateLessonAction,
} from "@/app/actions/tutor";
import { cn, formatDuration, levelLabel, plural } from "@/lib/utils";
import { courseStatusLabel, courseStatusTone } from "@/lib/tones";

type Params = Promise<{ id: string }>;

export default async function CourseEditorPage({ params, searchParams }: { params: Params; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "curriculum" } = await searchParams;
  const user = await requireUser(["TUTOR", "ADMIN"]);
  const course = await db.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { position: "asc" },
        include: {
          lessons: { orderBy: { position: "asc" } },
          quizzes: { include: { _count: { select: { questions: true } } } },
          assignments: true,
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course || (user.role !== "ADMIN" && course.tutorId !== user.id)) notFound();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  const lessons = course.sections.flatMap((s) => s.lessons);

  const tabs = [
    { key: "curriculum", label: "Curriculum" },
    { key: "details", label: "Details & pricing" },
    { key: "publish", label: "Publish" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={courseStatusTone[course.status]}>{courseStatusLabel[course.status]}</Badge>
            {plural(course.sections.length, "section")} · {plural(lessons.length, "lesson")} · {formatDuration(lessons.reduce((a, l) => a + l.durationMin, 0))} · {plural(course._count.enrollments, "learner")}
          </span>
        }
        actions={
          <Link href={`/courses/${course.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-semibold hover:bg-muted">
            Preview <ExternalLink className="h-4 w-4" />
          </Link>
        }
      />
      {course.status === "REJECTED" && course.reviewNote ? (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          <strong>Changes requested by admin:</strong> {course.reviewNote}
        </div>
      ) : null}

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/tutor/courses/${course.id}?tab=${t.key}`}
            className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold", tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "details" ? (
        <Card>
          <CardHeader title="Course details" description="This information appears on the public course page." />
          <ActionForm action={updateCourseDetailsAction.bind(null, course.id)} className="grid gap-5 p-5 md:grid-cols-2">
            <Field label="Title" htmlFor="title" className="md:col-span-2">
              <Input id="title" name="title" defaultValue={course.title} required minLength={5} maxLength={120} />
            </Field>
            <Field label="Subtitle" htmlFor="subtitle" className="md:col-span-2">
              <Input id="subtitle" name="subtitle" defaultValue={course.subtitle ?? ""} maxLength={200} placeholder="One line that sells the course" />
            </Field>
            <Field label="Description" htmlFor="description" className="md:col-span-2" hint="Minimum 50 characters to publish.">
              <Textarea id="description" name="description" defaultValue={course.description} rows={7} />
            </Field>
            <Field label="Category" htmlFor="categoryId">
              <Select id="categoryId" name="categoryId" defaultValue={course.categoryId ?? ""}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Level" htmlFor="level">
              <Select id="level" name="level" defaultValue={course.level}>
                {Object.entries(levelLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Language" htmlFor="language">
              <Input id="language" name="language" defaultValue={course.language} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)" htmlFor="price" hint="0 for a free course">
                <Input id="price" name="price" type="number" min={0} step="1" defaultValue={course.price / 100} />
              </Field>
              <Field label="Original price (₹)" htmlFor="mrp" hint="Optional, shows a discount">
                <Input id="mrp" name="mrp" type="number" min={0} step="1" defaultValue={course.mrp ? course.mrp / 100 : ""} />
              </Field>
            </div>
            <Field label="Thumbnail image URL" htmlFor="thumbnail" hint="16:9 image. Leave empty for a branded cover.">
              <Input id="thumbnail" name="thumbnail" type="url" defaultValue={course.thumbnail ?? ""} placeholder="https://…" />
            </Field>
            <Field label="Promo video (YouTube/Vimeo)" htmlFor="promoVideoUrl">
              <Input id="promoVideoUrl" name="promoVideoUrl" type="url" defaultValue={course.promoVideoUrl ?? ""} placeholder="https://youtu.be/…" />
            </Field>
            <Field label="What learners will learn" htmlFor="outcomes" hint="One outcome per line (at least 2).">
              <Textarea id="outcomes" name="outcomes" defaultValue={course.outcomes.join("\n")} rows={6} />
            </Field>
            <Field label="Requirements" htmlFor="requirements" hint="One per line.">
              <Textarea id="requirements" name="requirements" defaultValue={course.requirements.join("\n")} rows={6} />
            </Field>
            <Checkbox name="certificateOn" defaultChecked={course.certificateOn} label="Issue a certificate of completion" className="md:col-span-2" />
            <div className="md:col-span-2">
              <SubmitButton>Save details</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      ) : tab === "publish" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">{course.status === "PUBLISHED" ? "Your course is live 🎉" : "Ready to publish?"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.role === "ADMIN"
                ? "As an admin, publishing makes the course visible immediately."
                : course.status === "PENDING_REVIEW"
                  ? "Your course is waiting for admin review. You can keep editing meanwhile."
                  : course.status === "PUBLISHED"
                    ? "Edits you make are visible to learners right away."
                    : "Submit your course for review. Our team checks quality before it goes live."}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>• Description of at least 50 characters</li>
              <li>• A category and at least 2 learning outcomes</li>
              <li>• At least one lesson, each with a YouTube or Vimeo video</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {course.status !== "PUBLISHED" && course.status !== "PENDING_REVIEW" ? (
                <ActionForm action={submitForReviewAction.bind(null, course.id)}>
                  <SubmitButton>{user.role === "ADMIN" ? "Publish now" : "Submit for review"}</SubmitButton>
                </ActionForm>
              ) : null}
              {course.status === "PUBLISHED" ? (
                <ActionForm action={setCourseArchivedAction.bind(null, course.id, true)}>
                  <SubmitButton variant="outline" confirm="Unpublish this course? Enrolled learners keep access.">
                    Unpublish
                  </SubmitButton>
                </ActionForm>
              ) : null}
              {course.status === "ARCHIVED" ? (
                <ActionForm action={setCourseArchivedAction.bind(null, course.id, false)}>
                  <SubmitButton variant="outline">Move back to draft</SubmitButton>
                </ActionForm>
              ) : null}
            </div>
          </Card>
          <Card className="border-danger/30 p-6">
            <h2 className="text-lg font-semibold text-danger">Danger zone</h2>
            <p className="mt-1 text-sm text-muted-foreground">Delete this course permanently. Only possible when it has no learners or payments.</p>
            <ActionForm action={deleteCourseAction.bind(null, course.id)} className="mt-4">
              <SubmitButton variant="danger" confirm="Delete this course permanently? This cannot be undone.">
                <Trash2 className="h-4 w-4" /> Delete course
              </SubmitButton>
            </ActionForm>
          </Card>
        </div>
      ) : (
        <div className="space-y-5">
          {course.sections.map((s, si) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Section {si + 1}</span>
                <ActionForm action={renameSectionAction.bind(null, s.id)} className="flex min-w-60 flex-1 gap-2">
                  <Input name="title" defaultValue={s.title} className="h-9 font-semibold" required />
                  <SubmitButton size="sm" variant="outline">
                    Save
                  </SubmitButton>
                </ActionForm>
                <IconAction action={moveSectionAction.bind(null, s.id, -1)} label="Move section up" disabled={si === 0}>
                  <ArrowUp />
                </IconAction>
                <IconAction action={moveSectionAction.bind(null, s.id, 1)} label="Move section down" disabled={si === course.sections.length - 1}>
                  <ArrowDown />
                </IconAction>
                <IconAction action={deleteSectionAction.bind(null, s.id)} label="Delete section" confirm="Delete this section and all its lessons, quizzes and assignments?" danger>
                  <Trash2 />
                </IconAction>
              </div>

              <ul className="divide-y">
                {s.lessons.map((l, li) => (
                  <li key={l.id} className="px-4 py-2">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 py-1">
                        <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                        <span className="flex-1 text-sm font-medium">{l.title}</span>
                        {!l.videoUrl ? <Badge tone="danger">No video</Badge> : null}
                        {l.isPreview ? <Badge tone="brand">Preview</Badge> : null}
                        <span className="text-xs text-muted-foreground">{formatDuration(l.durationMin)}</span>
                        <span className="text-xs font-semibold text-primary group-open:hidden">Edit</span>
                      </summary>
                      <div className="mt-3 rounded-xl border bg-muted/30 p-4">
                        <LessonFields action={updateLessonAction.bind(null, l.id)} lesson={l} submitLabel="Save lesson" />
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          <IconAction action={moveLessonAction.bind(null, l.id, -1)} label="Move lesson up" disabled={li === 0}>
                            <ArrowUp />
                          </IconAction>
                          <IconAction action={moveLessonAction.bind(null, l.id, 1)} label="Move lesson down" disabled={li === s.lessons.length - 1}>
                            <ArrowDown />
                          </IconAction>
                          <IconAction action={deleteLessonAction.bind(null, l.id)} label="Delete lesson" confirm="Delete this lesson?" danger>
                            <Trash2 />
                          </IconAction>
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
                {s.quizzes.map((q) => (
                  <li key={q.id} className="flex items-center gap-3 px-4 py-3">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-sm font-medium">Quiz: {q.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {q._count.questions} questions · pass {q.passScore}%
                    </span>
                    <Link href={`/tutor/courses/${course.id}/quizzes/${q.id}`} className="text-xs font-semibold text-primary hover:underline">
                      Edit questions
                    </Link>
                  </li>
                ))}
                {s.assignments.map((a) => (
                  <li key={a.id} className="px-4 py-2">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 py-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="flex-1 text-sm font-medium">Assignment: {a.title}</span>
                        <span className="text-xs font-semibold text-primary group-open:hidden">Edit</span>
                      </summary>
                      <div className="mt-3 rounded-xl border bg-muted/30 p-4">
                        <AssignmentFields action={updateAssignmentAction.bind(null, a.id)} assignment={a} submitLabel="Save assignment" />
                        <div className="mt-3 border-t pt-3">
                          <IconAction action={deleteAssignmentAction.bind(null, a.id)} label="Delete assignment" confirm="Delete this assignment and its submissions?" danger>
                            <Trash2 />
                          </IconAction>
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>

              <div className="grid gap-2 border-t p-4 md:grid-cols-3">
                <AddPanel label="Add lesson">
                  <LessonFields action={addLessonAction.bind(null, s.id)} submitLabel="Add lesson" reset />
                </AddPanel>
                <AddPanel label="Add quiz">
                  <ActionForm action={addQuizAction.bind(null, s.id)} className="space-y-3">
                    <Field label="Quiz title" htmlFor={`qt-${s.id}`}>
                      <Input id={`qt-${s.id}`} name="title" required placeholder="e.g. Module 1 check" />
                    </Field>
                    <Field label="Pass mark (%)" htmlFor={`qp-${s.id}`}>
                      <Input id={`qp-${s.id}`} name="passScore" type="number" min={1} max={100} defaultValue={60} />
                    </Field>
                    <SubmitButton size="sm">Create quiz & add questions</SubmitButton>
                  </ActionForm>
                </AddPanel>
                <AddPanel label="Add assignment">
                  <AssignmentFields action={addAssignmentAction.bind(null, s.id)} submitLabel="Add assignment" reset />
                </AddPanel>
              </div>
            </Card>
          ))}

          <Card className="p-4">
            <ActionForm action={addSectionAction.bind(null, course.id)} resetOnSuccess className="flex flex-wrap gap-2">
              <Input name="title" required placeholder="New section title, e.g. Advanced topics" className="min-w-60 flex-1" />
              <SubmitButton>
                <Plus className="h-4 w-4" /> Add section
              </SubmitButton>
            </ActionForm>
          </Card>
        </div>
      )}
    </div>
  );
}

function AddPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-dashed open:col-span-full open:border-solid open:bg-muted/30">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-primary group-open:justify-start">
        <Plus className="h-4 w-4" /> {label}
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

type LessonLike = { title: string; videoUrl: string | null; durationMin: number; description: string | null; resources: string | null; isPreview: boolean };

function LessonFields({
  action,
  lesson,
  submitLabel,
  reset,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  lesson?: LessonLike;
  submitLabel: string;
  reset?: boolean;
}) {
  return (
    <ActionForm action={action} resetOnSuccess={reset} className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
      <Field label="Lesson title">
        <Input name="title" defaultValue={lesson?.title} required />
      </Field>
      <Field label="Video URL (YouTube / Vimeo)">
        <Input name="videoUrl" type="url" defaultValue={lesson?.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" />
      </Field>
      <Field label="Duration (min)">
        <Input name="durationMin" type="number" min={0} defaultValue={lesson?.durationMin ?? 10} />
      </Field>
      <Field label="Description" className="md:col-span-3">
        <Textarea name="description" defaultValue={lesson?.description ?? ""} rows={2} />
      </Field>
      <Field label="Resources & notes" className="md:col-span-3" hint="Links, code snippets or reading material shown below the video.">
        <Textarea name="resources" defaultValue={lesson?.resources ?? ""} rows={2} />
      </Field>
      <div className="flex flex-wrap items-center gap-4 md:col-span-3">
        <Checkbox name="isPreview" defaultChecked={lesson?.isPreview} label="Free preview (visible before enrolling)" />
        <SubmitButton size="sm" className="ml-auto">
          {submitLabel}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

function AssignmentFields({
  action,
  assignment,
  submitLabel,
  reset,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  assignment?: { title: string; instructions: string; maxScore: number };
  submitLabel: string;
  reset?: boolean;
}) {
  return (
    <ActionForm action={action} resetOnSuccess={reset} className="grid gap-3 md:grid-cols-[1fr_140px]">
      <Field label="Assignment title">
        <Input name="title" defaultValue={assignment?.title} required />
      </Field>
      <Field label="Max score">
        <Input name="maxScore" type="number" min={1} defaultValue={assignment?.maxScore ?? 100} />
      </Field>
      <Field label="Instructions" className="md:col-span-2">
        <Textarea name="instructions" defaultValue={assignment?.instructions} rows={4} required />
      </Field>
      <div className="md:col-span-2">
        <SubmitButton size="sm">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function IconAction({
  action,
  label,
  children,
  confirm,
  danger,
  disabled,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  label: string;
  children: React.ReactNode;
  confirm?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <ActionForm action={action}>
      <SubmitButton
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        confirm={confirm}
        disabled={disabled}
        className={cn("[&_svg]:h-4 [&_svg]:w-4", danger && "text-danger hover:bg-danger-soft")}
      >
        {children}
      </SubmitButton>
    </ActionForm>
  );
}
