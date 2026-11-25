import Link from "next/link";
import { Clock, PlayCircle, Users } from "lucide-react";
import type { CourseCardData } from "@/lib/catalog";
import { CourseThumb } from "@/components/course/course-thumb";
import { Badge, Stars } from "@/components/ui/misc";
import { formatDuration, formatINR, levelLabel, plural } from "@/lib/utils";

export function CourseCard({ course }: { course: CourseCardData }) {
  const discount = course.mrp && course.mrp > course.price ? Math.round(((course.mrp - course.price) / course.mrp) * 100) : 0;
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10"
    >
      <div className="relative">
        <CourseThumb title={course.title} thumbnail={course.thumbnail} category={course.category?.name} />
        <div className="absolute left-3 bottom-3 flex gap-1.5">
          {course.isFeatured ? <Badge tone="dark">Bestseller</Badge> : null}
          {course.price === 0 ? <Badge tone="success" className="bg-white text-success">Free</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {course.category ? <span className="text-primary">{course.category.name}</span> : null}
          <span>•</span>
          <span>{levelLabel[course.level]}</span>
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{course.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">by {course.tutorName}</p>
        <div className="mt-2 flex items-center gap-1.5 text-sm">
          {course.rating.count ? (
            <>
              <span className="font-bold text-warning">{course.rating.avg.toFixed(1)}</span>
              <Stars rating={course.rating.avg} />
              <span className="text-xs text-muted-foreground">({course.rating.count})</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">New course</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" /> {plural(course.lessons, "lesson")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(course.minutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {course.learners.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-4">
          <span className="text-lg font-bold">{formatINR(course.price)}</span>
          {discount ? (
            <>
              <span className="text-sm text-muted-foreground line-through">{formatINR(course.mrp!)}</span>
              <span className="text-xs font-semibold text-success">{discount}% off</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
