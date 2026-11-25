"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError as NextAuthError, CredentialsSignin } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { runAction, UserFacingError, type ActionState } from "@/lib/actions";
import { passwordRule } from "@/lib/validators";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase().trim()),
  phone: z.string().trim().max(20).optional(),
  password: passwordRule,
});

/** Signs in on the server (sets the session cookie) — avoids client-side CSRF round trips. */
async function credentialsSignIn(email: string, password: string): Promise<ActionState> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true };
  } catch (err) {
    if (err instanceof CredentialsSignin && err.code === "inactive") {
      return { ok: false, error: "Your account has been deactivated. Please contact support." };
    }
    if (err instanceof NextAuthError) return { ok: false, error: "Incorrect email or password." };
    throw err;
  }
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  return credentialsSignIn(email, password);
}

export async function registerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await runAction(async () => {
    const data = registerSchema.parse({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone") || undefined,
      password: form.get("password"),
    });
    if (form.get("terms") !== "on") throw new UserFacingError("Please accept the terms to continue.");
    const exists = await db.user.findUnique({ where: { email: data.email } });
    if (exists) throw new UserFacingError("An account with this email already exists. Please log in.");
    await db.user.create({
      data: { name: data.name, email: data.email, phone: data.phone, passwordHash: await bcrypt.hash(data.password, 12), role: "LEARNER" },
    });
  });
  if (!result?.ok) return result;
  const signedIn = await credentialsSignIn(String(form.get("email")), String(form.get("password")));
  return signedIn?.ok ? { ok: true, message: "Welcome to She Learn!" } : signedIn;
}
