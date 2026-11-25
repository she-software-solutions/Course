import { Inbox, Mail, Phone, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { deleteMessageAction, setMessageHandledAction } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/utils";

export default async function MessagesPage() {
  await requireUser(["ADMIN"]);
  const messages = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Enquiries from the contact form and tutor applications." />
      {messages.length ? (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={m.handled ? "p-5 opacity-70" : "border-brand/40 p-5"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {m.subject} {!m.handled ? <Badge tone="brand">new</Badge> : null}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    <span>{m.name}</span>
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Mail className="h-3.5 w-3.5" /> {m.email}
                    </a>
                    {m.phone ? (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3.5 w-3.5" /> {m.phone}
                      </a>
                    ) : null}
                    <span>{formatDateTime(m.createdAt)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <ActionForm action={setMessageHandledAction.bind(null, m.id, !m.handled)}>
                    <SubmitButton size="sm" variant="outline">
                      {m.handled ? "Mark as new" : "Mark handled"}
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={deleteMessageAction.bind(null, m.id)}>
                    <SubmitButton size="icon" variant="ghost" className="text-danger" aria-label="Delete message" confirm="Delete this message?">
                      <Trash2 className="h-4 w-4" />
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Inbox className="h-6 w-6" />} title="No messages" description="Contact form submissions will appear here." />
      )}
    </div>
  );
}
