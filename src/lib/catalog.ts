import { db } from "@/lib/db";
import { getRatings } from "@/lib/learning";
import type { Prisma } from "@/generated/prisma/client";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  price: number;
  mrp: number | null;
  level: string;
  isFeatured: boolean;
  category: { name: string; slug: string } | null;
  tutorName: string;
  learners: number;
  lessons: number;
  minutes: number;
  rating: { avg: number; count: number };
};

export async function getCourseCards(opts: {
  where?: Prisma.CourseWhereInput;
  orderBy?: Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}): Promise<CourseCardData[]> {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED", ...opts.where },
    orderBy: opts.orderBy ?? [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: opts.take,
    skip: opts.skip,
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      thumbnail: true,
      price: true,
      mrp: true,
      level: true,
      isFeatured: true,
      category: { select: { name: true, slug: true } },
      tutor: { select: { name: true } },
      _count: { select: { enrollments: true } },
      sections: { select: { lessons: { select: { durationMin: true } } } },
    },
  });
  const ratings = await getRatings(courses.map((c) => c.id));
  return courses.map((c) => {
    const lessons = c.sections.flatMap((s) => s.lessons);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      thumbnail: c.thumbnail,
      price: c.price,
      mrp: c.mrp,
      level: c.level,
      isFeatured: c.isFeatured,
      category: c.category,
      tutorName: c.tutor.name,
      learners: c._count.enrollments,
      lessons: lessons.length,
      minutes: lessons.reduce((a, l) => a + l.durationMin, 0),
      rating: ratings.get(c.id) ?? { avg: 0, count: 0 },
    };
  });
}
