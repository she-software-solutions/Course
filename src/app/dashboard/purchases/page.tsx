import Link from "next/link";
import { Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card, EmptyState, PageHeader, Table } from "@/components/ui/misc";
import { formatDateTime, formatINR } from "@/lib/utils";
import { paymentTone } from "@/lib/tones";


export default async function PurchasesPage() {
  const user = await requireUser();
  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { title: true, slug: true } } },
  });
  return (
    <div>
      <PageHeader title="Purchase history" description="Receipts for your course purchases." />
      {payments.length ? (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/courses/${p.course.slug}`} className="font-medium hover:text-primary">
                      {p.course.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">{formatDateTime(p.createdAt)}</td>
                  <td className="font-semibold">{formatINR(p.amount)}</td>
                  <td>
                    <Badge tone={paymentTone[p.status]}>{p.status.toLowerCase()}</Badge>
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{p.razorpayPaymentId ?? p.razorpayOrderId ?? p.id}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={<Receipt className="h-6 w-6" />} title="No purchases yet" description="Paid course receipts will show up here." />
      )}
    </div>
  );
}
