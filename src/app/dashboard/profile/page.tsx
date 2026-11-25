import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Avatar, Badge, Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { changePasswordAction, updateProfileAction } from "@/app/actions/profile";
import { formatDate } from "@/lib/utils";
import { roleTone } from "@/lib/tones";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.id } });

  return (
    <div className="space-y-6">
      <PageHeader title="Profile & settings" />
      <Card className="flex flex-wrap items-center gap-4 p-6">
        <Avatar name={user.name} src={user.image} size={64} />
        <div>
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={roleTone[user.role]}>{user.role.toLowerCase()}</Badge>
            <span className="text-xs text-muted-foreground">Member since {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Personal information" description="Your name appears on certificates and in course discussions." />
        <ActionForm action={updateProfileAction} className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name">
            <Input id="name" name="name" defaultValue={user.name} required />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={user.phone ?? ""} />
          </Field>
          <Field label="Headline" htmlFor="headline" hint="e.g. Final-year CSE student · Aspiring full-stack developer">
            <Input id="headline" name="headline" defaultValue={user.headline ?? ""} />
          </Field>
          <Field label="Profile photo URL" htmlFor="image">
            <Input id="image" name="image" type="url" defaultValue={user.image ?? ""} placeholder="https://…" />
          </Field>
          <Field label="Bio" htmlFor="bio" className="sm:col-span-2">
            <Textarea id="bio" name="bio" defaultValue={user.bio ?? ""} rows={4} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton>Save changes</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Card>
        <CardHeader title="Change password" description={user.passwordHash ? undefined : "You signed up with Google — set a password to also log in with email."} />
        <ActionForm action={changePasswordAction} resetOnSuccess className="grid gap-4 p-5 sm:grid-cols-3">
          {user.passwordHash ? (
            <Field label="Current password" htmlFor="current">
              <Input id="current" name="current" type="password" autoComplete="current-password" required />
            </Field>
          ) : null}
          <Field label="New password" htmlFor="next" hint="8+ characters with a letter and a number">
            <Input id="next" name="next" type="password" autoComplete="new-password" required />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm">
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
          </Field>
          <div className="sm:col-span-3">
            <SubmitButton variant="secondary">Update password</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
