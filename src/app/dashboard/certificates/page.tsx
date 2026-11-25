import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function CertificatesPage() {
  const user = await requireUser();
  const certs = await db.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
    include: { course: { select: { title: true, tutor: { select: { name: true } } } } },
  });

  return (
    <div>
      <PageHeader title="My certificates" description="Complete every lesson and pass every quiz in a course to earn its certificate." />
      {certs.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {certs.map((c) => (
            <Card key={c.id} className="relative overflow-hidden p-6">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#ff69b4]/30 to-[#9b3dd6]/20" />
              <Award className="h-8 w-8 text-primary" />
              <p className="mt-3 text-lg font-semibold">{c.course.title}</p>
              <p className="text-sm text-muted-foreground">Instructor: {c.course.tutor.name}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Issued {formatDate(c.issuedAt)} · ID <span className="font-mono">{c.code}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <LinkButton href={`/certificates/${c.code}`} size="sm">
                  View & download
                </LinkButton>
                <Link
                  href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(c.course.title)}&organizationName=${encodeURIComponent("She Software Solutions")}&certId=${c.code}&issueYear=${c.issuedAt.getFullYear()}&issueMonth=${c.issuedAt.getMonth() + 1}`}
                  target="_blank"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold hover:bg-muted"
                >
                  Add to LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Award className="h-6 w-6" />} title="No certificates yet" description="Finish a course to earn your first certificate." action={<LinkButton href="/dashboard/courses">Go to my courses</LinkButton>} />
      )}
    </div>
  );
}
