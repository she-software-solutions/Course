import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

export type SessionUser = { id: string; role: Role; name?: string | null; email?: string | null; image?: string | null };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/** For pages: redirect to login / unauthorized when the role does not match. */
export async function requireUser(roles?: Role[], callbackUrl?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  if (roles && !roles.includes(user.role)) redirect("/unauthorized");
  return user;
}

export class AuthError extends Error {}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please sign in to continue.");
  if (roles && !roles.includes(user.role)) throw new AuthError("You do not have permission to do that.");
  return user;
}

export const isStaff = (role: Role) => role === "ADMIN" || role === "TUTOR";
