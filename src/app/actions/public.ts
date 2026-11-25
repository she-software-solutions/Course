"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser } from "@/lib/session";
import { runAction, UserFacingError, type ActionState } from "@/lib/actions";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.email("Enter a valid email"),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(3, "Please add a subject").max(140),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(5000),
});

export async function contactAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    if (form.get("company")) return { ok: true, message: "Thanks! We'll get back to you soon." }; // honeypot
    const data = contactSchema.parse({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone") || undefined,
      subject: form.get("subject"),
      message: form.get("message"),
    });
    await db.contactMessage.create({ data });
    return { ok: true, message: "Thanks! Our team will get back to you within 24 hours." };
  });
}

const applicationSchema = z.object({
  phone: z.string().trim().min(8, "Enter a valid phone number").max(20),
  college: z.string().trim().max(160).optional(),
  resumeUrl: z.url("Share your resume as a link (Google Drive, etc.)"),
  portfolioUrl: z.union([z.url("Enter a valid URL"), z.literal("")]).optional(),
  coverNote: z.string().trim().max(3000).optional(),
});

export async function applyInternshipAction(internshipId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const internship = await db.internship.findUnique({ where: { id: internshipId } });
    if (!internship || !internship.isOpen || (internship.deadline && internship.deadline < new Date())) {
      throw new UserFacingError("Applications for this internship are closed.");
    }
    const data = applicationSchema.parse({
      phone: form.get("phone"),
      college: form.get("college") || undefined,
      resumeUrl: form.get("resumeUrl"),
      portfolioUrl: form.get("portfolioUrl") ?? "",
      coverNote: form.get("coverNote") || undefined,
    });
    const exists = await db.internshipApplication.findUnique({ where: { internshipId_userId: { internshipId, userId: user.id } } });
    if (exists) throw new UserFacingError("You have already applied for this internship.");
    await db.internshipApplication.create({ data: { ...data, portfolioUrl: data.portfolioUrl || null, internshipId, userId: user.id } });
    revalidatePath(`/internships/${internshipId}`);
    return { ok: true, message: "Application submitted! We'll be in touch by email." };
  });
}

export async function registerEventAction(eventId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const event = await db.event.findUnique({ where: { id: eventId }, include: { _count: { select: { registrations: true } } } });
    if (!event || !event.isPublished) throw new UserFacingError("Event not found.");
    if (event.startsAt < new Date()) throw new UserFacingError("This event has already started.");
    if (event.capacity && event._count.registrations >= event.capacity) throw new UserFacingError("Sorry, this event is full.");
    await db.eventRegistration.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      update: {},
      create: { eventId, userId: user.id },
    });
    revalidatePath(`/events/${event.slug}`);
    return { ok: true, message: "You're registered! Details will be shared by email." };
  });
}

export async function cancelEventRegistrationAction(eventId: string, _prev: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const event = await db.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    await db.eventRegistration.deleteMany({ where: { eventId, userId: user.id } });
    if (event) revalidatePath(`/events/${event.slug}`);
    return { ok: true, message: "Registration cancelled" };
  });
}
