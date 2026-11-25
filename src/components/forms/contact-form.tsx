import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { contactAction } from "@/app/actions/public";

export function ContactForm({ defaultSubject, subjects }: { defaultSubject?: string; subjects?: string[] }) {
  return (
    <ActionForm action={contactAction} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
      <Field label="Your name">
        <Input name="name" required autoComplete="name" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Phone (optional)">
        <Input name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label="Subject">
        {subjects ? (
          <Select name="subject" defaultValue={defaultSubject}>
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        ) : (
          <Input name="subject" required defaultValue={defaultSubject} />
        )}
      </Field>
      <Field label="Message" className="sm:col-span-2">
        <Textarea name="message" rows={5} required minLength={10} />
      </Field>
      {/* honeypot */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="sm:col-span-2">
        <SubmitButton size="lg">Send message</SubmitButton>
      </div>
    </ActionForm>
  );
}
