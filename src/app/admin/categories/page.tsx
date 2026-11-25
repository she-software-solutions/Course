import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Field, Input } from "@/components/ui/field";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin";

export default async function CategoriesPage() {
  await requireUser(["ADMIN"]);
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { courses: true } } } });
  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Organise the course catalog." />
      <Card>
        <CardHeader title="Add category" />
        <ActionForm action={saveCategoryAction.bind(null, null)} resetOnSuccess className="grid gap-3 p-5 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Description">
            <Input name="description" />
          </Field>
          <SubmitButton>Add</SubmitButton>
        </ActionForm>
      </Card>
      <Card>
        <CardHeader title={`All categories (${categories.length})`} />
        <ul className="divide-y">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <ActionForm action={saveCategoryAction.bind(null, c.id)} className="flex flex-1 flex-wrap gap-2">
                <Input name="name" defaultValue={c.name} className="h-9 w-56" required aria-label="Name" />
                <Input name="description" defaultValue={c.description ?? ""} className="h-9 min-w-60 flex-1" aria-label="Description" />
                <SubmitButton size="sm" variant="outline">
                  Save
                </SubmitButton>
              </ActionForm>
              <span className="w-24 text-right text-xs text-muted-foreground">{c._count.courses} courses</span>
              <ActionForm action={deleteCategoryAction.bind(null, c.id)}>
                <SubmitButton size="icon" variant="ghost" className="text-danger" aria-label="Delete category" confirm={`Delete “${c.name}”? Its courses become uncategorised.`}>
                  <Trash2 className="h-4 w-4" />
                </SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
