import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveInternshipAction } from "@/app/actions/admin";

type Internship = {
  id: string;
  title: string;
  domain: string;
  description: string;
  skills: string[];
  duration: string;
  mode: string;
  location: string | null;
  stipend: string | null;
  openings: number;
  deadline: Date | null;
  isOpen: boolean;
};

const toDateInput = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");

export function InternshipForm({ internship }: { internship?: Internship }) {
  return (
    <ActionForm action={saveInternshipAction.bind(null, internship?.id ?? null)} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label="Title">
        <Input name="title" defaultValue={internship?.title} required />
      </Field>
      <Field label="Domain">
        <Input name="domain" defaultValue={internship?.domain} required placeholder="e.g. Web Development" />
      </Field>
      <Field label="Description" className="md:col-span-2">
        <Textarea name="description" defaultValue={internship?.description} rows={5} required />
      </Field>
      <Field label="Skills" hint="Comma separated">
        <Input name="skills" defaultValue={internship?.skills.join(", ")} placeholder="React, Node.js, Git" />
      </Field>
      <Field label="Duration">
        <Input name="duration" defaultValue={internship?.duration ?? "8 weeks"} required />
      </Field>
      <Field label="Mode">
        <Select name="mode" defaultValue={internship?.mode ?? "ONLINE"}>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">On-site</option>
          <option value="HYBRID">Hybrid</option>
        </Select>
      </Field>
      <Field label="Location (for on-site / hybrid)">
        <Input name="location" defaultValue={internship?.location ?? ""} placeholder="Salem / Chennai" />
      </Field>
      <Field label="Stipend">
        <Input name="stipend" defaultValue={internship?.stipend ?? "Non-stipendiary"} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Openings">
          <Input name="openings" type="number" min={1} defaultValue={internship?.openings ?? 10} />
        </Field>
        <Field label="Apply by">
          <Input name="deadline" type="date" defaultValue={toDateInput(internship?.deadline ?? null)} />
        </Field>
      </div>
      <Checkbox name="isOpen" defaultChecked={internship?.isOpen ?? true} label="Accepting applications" className="md:col-span-2" />
      <div className="md:col-span-2">
        <SubmitButton>{internship ? "Save changes" : "Create internship"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
