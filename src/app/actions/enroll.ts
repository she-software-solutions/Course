"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertUser } from "@/lib/session";
import { enrollUser } from "@/lib/learning";
import { runAction, UserFacingError, type ActionState } from "@/lib/actions";

export async function enrollFreeAction(courseId: string): Promise<ActionState> {
  let slug = "";
  const result = await runAction(async () => {
    const user = await assertUser();
    const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true, price: true, status: true } });
    if (!course || course.status !== "PUBLISHED") throw new UserFacingError("This course is not available.");
    if (course.price > 0) throw new UserFacingError("This is a paid course. Please complete payment to enroll.");
    await enrollUser(user.id, courseId);
    slug = course.slug;
    revalidatePath(`/courses/${course.slug}`);
  });
  if (result?.ok && slug) redirect(`/learn/${slug}`);
  return result;
}
