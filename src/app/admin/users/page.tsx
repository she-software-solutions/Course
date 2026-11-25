import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar, Badge, Card, CardHeader, PageHeader, Table } from "@/components/ui/misc";
import { createUserAction, setUserActiveAction, setUserRoleAction } from "@/app/actions/admin";
import type { Prisma } from "@/generated/prisma/client";
import { cn, formatDate } from "@/lib/utils";

const PAGE = 25;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const me = await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = {};
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }];
  if (sp.role === "LEARNER" || sp.role === "TUTOR" || sp.role === "ADMIN") where.role = sp.role;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { _count: { select: { enrollments: true, coursesTaught: true } } },
    }),
    db.user.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: Record<string, string | undefined>) => {
    const params = new URLSearchParams(Object.entries({ q: sp.q, role: sp.role, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/admin/users?${params}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users & roles" description={`${total} users. Promote learners to tutors, manage admins and deactivate accounts.`} />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <form className="relative min-w-60 flex-1" action="/admin/users">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={sp.q} placeholder="Search by name or email" className="pl-9" />
            {sp.role ? <input type="hidden" name="role" value={sp.role} /> : null}
          </form>
          <div className="flex gap-1">
            {["ALL", "LEARNER", "TUTOR", "ADMIN"].map((r) => (
              <Link
                key={r}
                href={link({ role: r === "ALL" ? undefined : r, page: undefined })}
                className={cn("rounded-full border px-3 py-1 text-xs font-semibold", (sp.role ?? "ALL") === r ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
              >
                {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase() + "s"}
              </Link>
            ))}
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <th>User</th>
              <th>Joined</th>
              <th>Activity</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.isActive ? "" : "opacity-60"}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.image} size={34} />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {u.name} {u.id === me.id ? <Badge tone="brand">You</Badge> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="whitespace-nowrap text-xs text-muted-foreground">
                  {u._count.enrollments} enrollments
                  {u._count.coursesTaught ? ` · ${u._count.coursesTaught} courses` : ""}
                </td>
                <td>
                  {u.id === me.id ? (
                    <Badge tone="dark">admin</Badge>
                  ) : (
                    <ActionForm action={setUserRoleAction.bind(null, u.id)} className="flex gap-1.5">
                      <Select name="role" defaultValue={u.role} className="h-8 w-28 text-xs" aria-label="Role">
                        <option value="LEARNER">Learner</option>
                        <option value="TUTOR">Tutor</option>
                        <option value="ADMIN">Admin</option>
                      </Select>
                      <SubmitButton size="sm" variant="outline">
                        Set
                      </SubmitButton>
                    </ActionForm>
                  )}
                </td>
                <td>
                  {u.id === me.id ? (
                    <Badge tone="success">active</Badge>
                  ) : (
                    <ActionForm action={setUserActiveAction.bind(null, u.id, !u.isActive)}>
                      <SubmitButton
                        size="sm"
                        variant={u.isActive ? "ghost" : "soft"}
                        className={u.isActive ? "text-danger" : ""}
                        confirm={u.isActive ? `Deactivate ${u.name}? They will be signed out and unable to log in.` : undefined}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </SubmitButton>
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {pages > 1 ? (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={link({ page: String(page - 1) })} className="rounded-lg border px-3 py-1 hover:bg-muted">
                  Previous
                </Link>
              ) : null}
              {page < pages ? (
                <Link href={link({ page: String(page + 1) })} className="rounded-lg border px-3 py-1 hover:bg-muted">
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Create an account" description="Add tutors or admins directly. Share the temporary password securely and ask them to change it." />
        <ActionForm action={createUserAction} resetOnSuccess className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_140px_1fr_auto] md:items-end">
          <Field label="Full name">
            <Input name="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Role">
            <Select name="role" defaultValue="TUTOR">
              <option value="TUTOR">Tutor</option>
              <option value="LEARNER">Learner</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <Field label="Temporary password">
            <Input name="password" type="text" required minLength={8} placeholder="8+ chars, letter & number" />
          </Field>
          <SubmitButton>Create</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
