"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Lock, PlayCircle, ShieldCheck } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { enrollFreeAction } from "@/app/actions/enroll";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: unknown) => void) => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Props = {
  courseId: string;
  slug: string;
  title: string;
  price: number;
  enrolled: boolean;
  signedIn: boolean;
  canManage: boolean;
  user?: { name?: string | null; email?: string | null };
};

export function EnrollPanel({ courseId, slug, title, price, enrolled, signedIn, canManage, user }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState(false);

  if (enrolled || canManage) {
    return (
      <Link href={`/learn/${slug}`} className={buttonClass("primary", "lg", "w-full")}>
        <PlayCircle className="h-5 w-5" /> {enrolled ? "Continue learning" : "Open course player"}
      </Link>
    );
  }

  if (!signedIn) {
    return (
      <Link href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`} className={buttonClass("primary", "lg", "w-full")}>
        <Lock className="h-4 w-4" /> Log in to enroll
      </Link>
    );
  }

  if (price === 0) {
    return (
      <button
        type="button"
        disabled={pending}
        className={buttonClass("primary", "lg", "w-full")}
        onClick={() =>
          startTransition(async () => {
            const res = await enrollFreeAction(courseId);
            if (res && !res.ok) toast.error(res.error);
          })
        }
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null} Enroll for free
      </button>
    );
  }

  async function buy() {
    setPaying(true);
    try {
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Could not start payment");
      if (order.alreadyEnrolled) {
        router.push(`/learn/${slug}`);
        return;
      }

      const verify = async (payload: Record<string, string>) => {
        const v = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await v.json();
        if (!v.ok) throw new Error(data.error ?? "Payment verification failed");
        toast.success("Payment successful — welcome to the course!");
        router.push(`/learn/${slug}`);
        router.refresh();
      };

      if (order.mode === "dev") {
        // Simulated checkout used only in development when Razorpay keys are not configured.
        if (!window.confirm(`Development mode: simulate a successful payment of ₹${(order.amount / 100).toLocaleString("en-IN")}?`)) return;
        await verify({ paymentId: order.paymentId, dev: "1" });
        return;
      }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error("Could not load Razorpay checkout. Check your connection.");
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        name: "She Software Solutions",
        description: title,
        image: "/brand/logo-round-light.png",
        order_id: order.orderId,
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        theme: { color: "#d63384" },
        handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
          verify(r).catch((e) => toast.error(e.message)),
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", () => toast.error("Payment failed. You have not been charged."));
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" disabled={paying} onClick={buy} className={buttonClass("primary", "lg", "w-full")}>
        {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : null} Buy now
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure payment via Razorpay · UPI, cards & netbanking
      </p>
    </div>
  );
}
