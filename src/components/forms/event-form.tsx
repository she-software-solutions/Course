import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveEventAction } from "@/app/actions/admin";

type EventLike = {
  id: string;
  title: string;
  kind: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  mode: string;
  location: string | null;
  meetingUrl: string | null;
  capacity: number | null;
  isPublished: boolean;
};

// Values for <input type="datetime-local"> in India Standard Time
const toLocal = (d: Date | null) => (d ? new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 16) : "");

export function EventForm({ event }: { event?: EventLike }) {
  return (
    <ActionForm action={saveEventAction.bind(null, event?.id ?? null)} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label="Title">
        <Input name="title" defaultValue={event?.title} required />
      </Field>
      <Field label="Type">
        <Select name="kind" defaultValue={event?.kind ?? "Workshop"}>
          {["Workshop", "Webinar", "Seminar", "Hackathon", "Bootcamp", "Meetup"].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </Select>
      </Field>
      <Field label="Description" className="md:col-span-2">
        <Textarea name="description" defaultValue={event?.description} rows={4} required />
      </Field>
      <Field label="Starts at (IST)">
        <Input name="startsAt" type="datetime-local" defaultValue={toLocal(event?.startsAt ?? null)} required />
      </Field>
      <Field label="Ends at (IST, optional)">
        <Input name="endsAt" type="datetime-local" defaultValue={toLocal(event?.endsAt ?? null)} />
      </Field>
      <Field label="Mode">
        <Select name="mode" defaultValue={event?.mode ?? "ONLINE"}>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">In person</option>
          <option value="HYBRID">Hybrid</option>
        </Select>
      </Field>
      <Field label="Venue">
        <Input name="location" defaultValue={event?.location ?? ""} placeholder="Venue address (in person / hybrid)" />
      </Field>
      <Field label="Meeting link" hint="Shown only to registered participants">
        <Input name="meetingUrl" type="url" defaultValue={event?.meetingUrl ?? ""} placeholder="https://meet.google.com/…" />
      </Field>
      <Field label="Capacity (optional)">
        <Input name="capacity" type="number" min={0} defaultValue={event?.capacity ?? ""} />
      </Field>
      <Checkbox name="isPublished" defaultChecked={event?.isPublished ?? true} label="Published (visible on the events page)" className="md:col-span-2" />
      <div className="md:col-span-2">
        <SubmitButton>{event ? "Save changes" : "Create event"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
