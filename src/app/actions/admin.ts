"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser } from "@/lib/session";
import { runAction, UserFacingError, type ActionState } from "@/lib/actions";
import { slugify } from "@/lib/utils";
import { passwordRule } from "@/lib/validators";

const assertAdmin = () => assertUser(["ADMIN"]);
const roleEnum = z.enum(["LEARNER", "TUTOR", "ADMIN"]);

// ---------- users ----------

export async function setUserRoleAction(userId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const admin = await assertAdmin();
    if (userId === admin.id) throw new UserFacingError("You cannot change your own role.");
    const role = roleEnum.parse(form.get("role"));
    await db.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/admin/users");
    return { ok: true, message: `Role updated to ${role.toLowerCase()}` };
  });
}

export async function setUserActiveAction(userId: string, active: boolean, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const admin = await assertAdmin();
    if (userId === admin.id) throw new UserFacingError("You cannot deactivate your own account.");
    await db.user.update({ where: { id: userId }, data: { isActive: active } });
    revalidatePath("/admin/users");
    return { ok: true, message: active ? "Account activated" : "Account deactivated" };
  });
}

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((e) => e.toLowerCase().trim()),
  role: roleEnum,
  password: passwordRule,
});

export async function createUserAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    const d = createUserSchema.parse({ name: form.get("name"), email: form.get("email"), role: form.get("role"), password: form.get("password") });
    if (await db.user.findUnique({ where: { email: d.email } })) throw new UserFacingError("A user with this email already exists.");
    await db.user.create({ data: { name: d.name, email: d.email, role: d.role, passwordHash: await bcrypt.hash(d.password, 12) } });
    revalidatePath("/admin/users");
    return { ok: true, message: `${d.role.toLowerCase()} account created — share the password securely.` };
  });
}

// ---------- courses ----------

export async function reviewCourseAction(courseId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    const decision = z.enum(["approve", "reject"]).parse(form.get("decision"));
    const note = String(form.get("note") ?? "").trim();
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) throw new UserFacingError("Course not found.");
    if (decision === "reject" && note.length < 5) throw new UserFacingError("Add a short note explaining what needs to change.");
    await db.course.update({
      where: { id: courseId },
      data:
        decision === "approve"
          ? { status: "PUBLISHED", publishedAt: course.publishedAt ?? new Date(), reviewNote: null }
          : { status: "REJECTED", reviewNote: note },
    });
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${course.slug}`);
    revalidatePath("/courses");
    return { ok: true, message: decision === "approve" ? "Course published" : "Changes requested from tutor" };
  });
}

export async function setCourseStatusAction(courseId: string, status: "PUBLISHED" | "ARCHIVED", _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    const course = await db.course.update({
      where: { id: courseId },
      data: { status, ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}) },
    });
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${course.slug}`);
    return { ok: true, message: status === "PUBLISHED" ? "Course published" : "Course unpublished" };
  });
}

export async function toggleFeaturedAction(courseId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    const c = await db.course.findUniqueOrThrow({ where: { id: courseId } });
    await db.course.update({ where: { id: courseId }, data: { isFeatured: !c.isFeatured } });
    revalidatePath("/admin/courses");
    revalidatePath("/");
    return { ok: true, message: c.isFeatured ? "Removed from featured" : "Marked as featured" };
  });
}

// ---------- categories ----------

const categorySchema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(300).optional() });

export async function saveCategoryAction(categoryId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    const d = categorySchema.parse({ name: form.get("name"), description: form.get("description") || undefined });
    const slug = slugify(d.name);
    const clash = await db.category.findFirst({ where: { OR: [{ slug }, { name: d.name }], NOT: categoryId ? { id: categoryId } : undefined } });
    if (clash) throw new UserFacingError("A category with this name already exists.");
    if (categoryId) await db.category.update({ where: { id: categoryId }, data: { ...d, slug } });
    else await db.category.create({ data: { ...d, slug } });
    revalidatePath("/admin/categories");
    return { ok: true, message: categoryId ? "Category updated" : "Category created" };
  });
}

export async function deleteCategoryAction(categoryId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    await db.category.delete({ where: { id: categoryId } });
    revalidatePath("/admin/categories");
    return { ok: true, message: "Category deleted (its courses are now uncategorised)" };
  });
}

// ---------- internships ----------

const internshipSchema = z.object({
  title: z.string().trim().min(3).max(120),
  domain: z.string().trim().min(2).max(60),
  description: z.string().trim().min(20).max(10000),
  duration: z.string().trim().min(2).max(40),
  mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  location: z.string().trim().max(120).optional(),
  stipend: z.string().trim().max(60).optional(),
  openings: z.coerce.number().int().min(1).max(10000),
  deadline: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T23:59:59+05:30`) : null)),
});

export async function saveInternshipAction(internshipId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let created = "";
  const res = await runAction(async () => {
    await assertAdmin();
    const d = internshipSchema.parse({
      title: form.get("title"),
      domain: form.get("domain"),
      description: form.get("description"),
      duration: form.get("duration"),
      mode: form.get("mode"),
      location: form.get("location") || undefined,
      stipend: form.get("stipend") || undefined,
      openings: form.get("openings") || 1,
      deadline: form.get("deadline") || undefined,
    });
    const data = { ...d, skills: String(form.get("skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean), isOpen: form.get("isOpen") === "on" };
    if (internshipId) {
      await db.internship.update({ where: { id: internshipId }, data });
    } else {
      created = (await db.internship.create({ data })).id;
    }
    revalidatePath("/admin/internships");
    revalidatePath("/internships");
    return { ok: true, message: "Internship saved" };
  });
  if (res?.ok && created) redirect(`/admin/internships/${created}`);
  return res;
}

export async function deleteInternshipAction(internshipId: string, _prev: ActionState): Promise<ActionState> {
  const res = await runAction(async () => {
    await assertAdmin();
    await db.internship.delete({ where: { id: internshipId } });
    revalidatePath("/internships");
  });
  if (res?.ok) redirect("/admin/internships");
  return res;
}

export async function setApplicationStatusAction(applicationId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    const status = z.enum(["APPLIED", "SHORTLISTED", "ACCEPTED", "REJECTED"]).parse(form.get("status"));
    const app = await db.internshipApplication.update({ where: { id: applicationId }, data: { status } });
    revalidatePath(`/admin/internships/${app.internshipId}`);
    return { ok: true, message: `Application ${status.toLowerCase()}` };
  });
}

// ---------- events ----------

/** Interpret a `datetime-local` value (no zone) as India Standard Time. */
function fromIST(v: string) {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(v) ? v : `${v.length === 16 ? v + ":00" : v}+05:30`);
}

const eventSchema = z.object({
  title: z.string().trim().min(3).max(140),
  kind: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(10000),
  startsAt: z.string().min(1, "Start time is required").transform(fromIST),
  endsAt: z
    .string()
    .optional()
    .transform((v) => (v ? fromIST(v) : null)),
  mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  location: z.string().trim().max(160).optional(),
  meetingUrl: z.union([z.url(), z.literal("")]).optional(),
  capacity: z.coerce.number().int().min(0).optional(),
});

export async function saveEventAction(eventId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let created = "";
  const res = await runAction(async () => {
    await assertAdmin();
    const d = eventSchema.parse({
      title: form.get("title"),
      kind: form.get("kind"),
      description: form.get("description"),
      startsAt: form.get("startsAt"),
      endsAt: form.get("endsAt") || undefined,
      mode: form.get("mode"),
      location: form.get("location") || undefined,
      meetingUrl: form.get("meetingUrl") ?? "",
      capacity: form.get("capacity") || undefined,
    });
    const data = { ...d, meetingUrl: d.meetingUrl || null, capacity: d.capacity || null, isPublished: form.get("isPublished") === "on" };
    if (eventId) {
      const ev = await db.event.update({ where: { id: eventId }, data });
      revalidatePath(`/events/${ev.slug}`);
    } else {
      let slug = slugify(d.title);
      if (await db.event.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      created = (await db.event.create({ data: { ...data, slug } })).id;
    }
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { ok: true, message: "Event saved" };
  });
  if (res?.ok && created) redirect(`/admin/events/${created}`);
  return res;
}

export async function deleteEventAction(eventId: string, _prev: ActionState): Promise<ActionState> {
  const res = await runAction(async () => {
    await assertAdmin();
    await db.event.delete({ where: { id: eventId } });
    revalidatePath("/events");
  });
  if (res?.ok) redirect("/admin/events");
  return res;
}

// ---------- messages ----------

export async function setMessageHandledAction(messageId: string, handled: boolean, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    await db.contactMessage.update({ where: { id: messageId }, data: { handled } });
    revalidatePath("/admin/messages");
  });
}

export async function deleteMessageAction(messageId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    await assertAdmin();
    await db.contactMessage.delete({ where: { id: messageId } });
    revalidatePath("/admin/messages");
    return { ok: true, message: "Message deleted" };
  });
}
