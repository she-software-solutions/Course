import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card, PageHeader, StatCard, Table } from "@/components/ui/misc";
import { razorpayEnabled } from "@/lib/razorpay";
import type { PaymentStatus } from "@/generated/prisma/enums";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import { paymentTone } from "@/lib/tones";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser(["ADMIN"]);
  const { status = "ALL" } = await searchParams;
  const valid = ["PAID", "CREATED", "FAILED", "REFUNDED"];
  const where = valid.includes(status) ? { status: status as PaymentStatus } : {};
  const [payments, paid, failed] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { name: true, email: true } }, course: { select: { title: true, slug: true } } },
    }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
    db.payment.count({ where: { status: "FAILED" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="All course purchases processed through Razorpay." />
      {!razorpayEnabled ? (
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
          Razorpay keys are not configured. In development, purchases use a simulated checkout. Add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> to accept real payments.
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gross revenue" value={paid._sum.amount ? formatINR(paid._sum.amount) : "₹0"} />
        <StatCard label="Successful payments" value={paid._count} />
        <StatCard label="Failed payments" value={failed} />
      </div>
      <div className="flex gap-2">
        {["ALL", ...valid].map((s) => (
          <Link key={s} href={`/admin/payments?status=${s}`} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>
      <Card>
        <Table>
          <thead>
            <tr>
              <th>Learner</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Provider ref.</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>
                  <p className="font-medium">{p.user.name}</p>
                  <p className="text-xs text-muted-foreground">{p.user.email}</p>
                </td>
                <td className="max-w-60 truncate">
                  <Link href={`/courses/${p.course.slug}`} className="hover:text-primary">
                    {p.course.title}
                  </Link>
                </td>
                <td className="font-semibold">{formatINR(p.amount)}</td>
                <td>
                  <Badge tone={paymentTone[p.status]}>{p.status.toLowerCase()}</Badge>
                </td>
                <td className="font-mono text-xs text-muted-foreground">
                  <span className="block">{p.razorpayPaymentId ?? "—"}</span>
                  <span className="block opacity-70">{p.razorpayOrderId ?? p.provider}</span>
                </td>
                <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
            {!payments.length ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  No payments found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
