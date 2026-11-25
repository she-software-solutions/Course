import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrollUser } from "@/lib/learning";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook (configure in Dashboard → Webhooks, events: payment.captured, payment.failed, order.paid).
 * Guarantees enrollment even if the learner closes the browser before client-side verification.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(raw) as {
    event: string;
    payload: { payment?: { entity: { id: string; order_id: string; status: string } } };
  };
  const entity = event.payload.payment?.entity;
  if (!entity?.order_id) return NextResponse.json({ ok: true });

  const payment = await db.payment.findUnique({ where: { razorpayOrderId: entity.order_id } });
  if (!payment) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (payment.status !== "PAID") {
      await db.payment.update({ where: { id: payment.id }, data: { status: "PAID", razorpayPaymentId: entity.id } });
    }
    await enrollUser(payment.userId, payment.courseId);
  } else if (event.event === "payment.failed" && payment.status === "CREATED") {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }
  return NextResponse.json({ ok: true });
}
