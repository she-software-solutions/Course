import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { enrollUser } from "@/lib/learning";
import { devPaymentsEnabled, verifyCheckoutSignature } from "@/lib/razorpay";

const razorpayBody = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
const devBody = z.object({ paymentId: z.string().min(1), dev: z.literal("1") });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const json = await req.json().catch(() => null);

  // Simulated payments (development only, when Razorpay keys are absent)
  const dev = devBody.safeParse(json);
  if (dev.success) {
    if (!devPaymentsEnabled) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    const payment = await db.payment.findUnique({ where: { id: dev.data.paymentId } });
    if (!payment || payment.userId !== user.id) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    await db.payment.update({ where: { id: payment.id }, data: { status: "PAID", razorpayPaymentId: `dev_${payment.id}` } });
    await enrollUser(user.id, payment.courseId);
    return NextResponse.json({ ok: true });
  }

  const parsed = razorpayBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const payment = await db.payment.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!payment || payment.userId !== user.id) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
  }

  if (payment.status !== "PAID") {
    await db.payment.update({ where: { id: payment.id }, data: { status: "PAID", razorpayPaymentId: razorpay_payment_id } });
  }
  await enrollUser(user.id, payment.courseId);
  return NextResponse.json({ ok: true });
}
