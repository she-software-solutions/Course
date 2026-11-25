import { z } from "zod";
import { AuthError } from "@/lib/session";

export type ActionState = { ok: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> } | null;

/**
 * Wraps server action logic so that validation / permission errors become a
 * friendly `ActionState` instead of an unhandled exception.
 * Next.js redirect/notFound "errors" are re-thrown.
 */
export async function runAction(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) {
      throw err;
    }
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
      return { ok: false, error: err.issues[0]?.message ?? "Invalid input", fieldErrors };
    }
    if (err instanceof AuthError || err instanceof UserFacingError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export class UserFacingError extends Error {}

export const fd = (form: FormData) => Object.fromEntries(form.entries());
