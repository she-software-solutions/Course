"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser } from "@/lib/session";
import { runAction, UserFacingError, type ActionState } from "@/lib/actions";
import { optionalUrl, passwordRule } from "@/lib/validators";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  phone: z.string().trim().max(20).optional(),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  image: optionalUrl,
});

export async function updateProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const data = profileSchema.parse({
      name: form.get("name"),
      phone: form.get("phone") || undefined,
      headline: form.get("headline") || undefined,
      bio: form.get("bio") || undefined,
      image: form.get("image") ?? "",
    });
    await db.user.update({
      where: { id: user.id },
      data: { ...data, phone: data.phone ?? null, headline: data.headline ?? null, bio: data.bio ?? null, image: data.image ?? null },
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "Profile updated" };
  });
}

export async function changePasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await assertUser();
    const current = String(form.get("current") ?? "");
    const next = passwordRule.parse(form.get("next"));
    if (next !== form.get("confirm")) throw new UserFacingError("New passwords do not match.");
    const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    if (dbUser.passwordHash && !(await bcrypt.compare(current, dbUser.passwordHash))) {
      throw new UserFacingError("Your current password is incorrect.");
    }
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
    return { ok: true, message: "Password updated" };
  });
}
