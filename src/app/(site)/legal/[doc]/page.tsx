import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";

const docs: Record<string, { title: string; sections: { h: string; p: string }[] }> = {
  terms: {
    title: "Terms of use",
    sections: [
      { h: "Using She Learn", p: `By creating an account on She Learn, operated by ${site.name}, you agree to use the platform for lawful, personal learning purposes and to keep your login credentials confidential.` },
      { h: "Course access", p: "Enrolling in a course grants you a personal, non-transferable licence to view its content. Sharing accounts, downloading or redistributing course videos and materials is not permitted." },
      { h: "Tutors", p: "Tutors are responsible for the originality and accuracy of their content and must hold the rights to all material they publish. Courses are reviewed before publication and may be removed if they violate these terms." },
      { h: "Certificates", p: "Certificates are issued when all lessons are completed and all quizzes are passed. Certificates can be verified publicly using their unique ID." },
      { h: "Changes", p: "We may update these terms from time to time. Continued use of the platform means you accept the updated terms." },
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      { h: "What we collect", p: "We collect your name, email, optional phone number, learning progress, quiz results, submissions and payment references needed to provide the service." },
      { h: "How we use it", p: "Your data is used to deliver courses, track progress, issue certificates, process payments, respond to enquiries and improve the platform. We never sell your personal data." },
      { h: "Payments", p: "Payments are processed securely by Razorpay. We do not store your card, UPI or bank details." },
      { h: "Your choices", p: `You can update your profile at any time. To request deletion of your account, email ${site.emails[0]}.` },
    ],
  },
  refunds: {
    title: "Refund policy",
    sections: [
      { h: "Eligibility", p: `If a paid course does not meet your expectations, you may request a refund within 7 days of purchase provided you have completed less than 30% of the course. Email ${site.emails[0]} with your payment reference.` },
      { h: "Processing", p: "Approved refunds are returned to the original payment method within 5–7 business days. Course access and any certificate are revoked on refund." },
    ],
  },
};

type Params = Promise<{ doc: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { doc } = await params;
  return { title: docs[doc]?.title ?? "Policy" };
}

export function generateStaticParams() {
  return Object.keys(docs).map((doc) => ({ doc }));
}

export default async function LegalPage({ params }: { params: Params }) {
  const { doc } = await params;
  const d = docs[doc];
  if (!d) notFound();
  return (
    <article className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold">{d.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{site.name}</p>
      <div className="mt-8 space-y-6">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 rounded-xl bg-muted p-4 text-xs text-muted-foreground">
        This is a template policy for the platform. Have it reviewed by your legal advisor before launch.
      </p>
    </article>
  );
}
