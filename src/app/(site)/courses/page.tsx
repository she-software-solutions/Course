import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/db";
import { getCourseCards } from "@/lib/catalog";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState } from "@/components/ui/misc";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@/generated/prisma/client";
import { cn, levelLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "All courses", description: "Browse online video courses by She Software Solutions." };

type SP = Promise<{ q?: string; category?: string; level?: string; price?: string; sort?: string }>;

export default async function CoursesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const where: Prisma.CourseWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (sp.category) where.category = { slug: sp.category };
  if (sp.level && sp.level in levelLabel) where.level = sp.level as Prisma.CourseWhereInput["level"];
  if (sp.price === "free") where.price = 0;
  if (sp.price === "paid") where.price = { gt: 0 };

  const orderBy: Prisma.CourseOrderByWithRelationInput[] =
    sp.sort === "newest"
      ? [{ publishedAt: "desc" }]
      : sp.sort === "price-asc"
        ? [{ price: "asc" }]
        : sp.sort === "price-desc"
          ? [{ price: "desc" }]
          : [{ isFeatured: "desc" }, { enrollments: { _count: "desc" } }];

  const [courses, categories] = await Promise.all([getCourseCards({ where, orderBy }), db.category.findMany({ orderBy: { name: "asc" } })]);

  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  return (
    <>
      <section className="border-b bg-muted/50">
        <div className="container-page py-10">
          <h1 className="text-3xl font-bold tracking-tight">{q ? `Results for “${q}”` : "Explore all courses"}</h1>
          <p className="mt-1 text-muted-foreground">Learn from industry mentors with hands-on projects and verified certificates.</p>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <Link href={qs({ category: undefined })} className={chip(!sp.category)}>
              All
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={qs({ category: c.slug })} className={chip(sp.category === c.slug)}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <aside>
          <form className="space-y-5 rounded-2xl border bg-card p-5 lg:sticky lg:top-24" action="/courses">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </p>
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {sp.category ? <input type="hidden" name="category" value={sp.category} /> : null}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="level">
                Level
              </label>
              <Select id="level" name="level" defaultValue={sp.level ?? ""}>
                <option value="">Any level</option>
                {Object.entries(levelLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="price">
                Price
              </label>
              <Select id="price" name="price" defaultValue={sp.price ?? ""}>
                <option value="">Free & paid</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="sort">
                Sort by
              </label>
              <Select id="sort" name="sort" defaultValue={sp.sort ?? ""}>
                <option value="">Most popular</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Apply filters
            </Button>
            {sp.level || sp.price || sp.sort || q || sp.category ? (
              <Link href="/courses" className="block text-center text-sm text-primary hover:underline">
                Clear all
              </Link>
            ) : null}
          </form>
        </aside>
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {courses.length} {courses.length === 1 ? "course" : "courses"} found
          </p>
          {courses.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No courses match your search" description="Try a different keyword or clear the filters." />
          )}
        </div>
      </div>
    </>
  );
}

function chip(active: boolean) {
  return cn(
    "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition",
    active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-brand/60",
  );
}
