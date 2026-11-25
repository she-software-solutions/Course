import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createRazorpayOrder, devPaymentsEnabled, publicKeyId, razorpayEnabled } from "@/lib/razorpay";

const body = z.object({ courseId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, title: true, price: true, status: true },
  });
  if (!course || course.status !== "PUBLISHED") return NextResponse.json({ error: "Course not available" }, { status: 404 });
  if (course.price <= 0) return NextResponse.json({ error: "This course is free" }, { status: 400 });

  const enrolled = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (enrolled) return NextResponse.json({ alreadyEnrolled: true });

  if (!razorpayEnabled) {
    if (!devPaymentsEnabled) return NextResponse.json({ error: "Payments are not configured yet. Please contact support." }, { status: 503 });
    const payment = await db.payment.create({
      data: { userId: user.id, courseId: course.id, amount: course.price, provider: "dev" },
    });
    return NextResponse.json({ mode: "dev", paymentId: payment.id, amount: course.price });
  }

  const payment = await db.payment.create({ data: { userId: user.id, courseId: course.id, amount: course.price } });
  try {
    const order = await createRazorpayOrder({
      amount: course.price,
      receipt: payment.id,
      notes: { paymentId: payment.id, courseId: course.id, userId: user.id },
    });
    await db.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: order.id } });
    return NextResponse.json({ mode: "razorpay", orderId: order.id, amount: order.amount, keyId: publicKeyId() });
  } catch (e) {
    console.error(e);
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Could not create payment order. Please try again." }, { status: 502 });
  }
}
