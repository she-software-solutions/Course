import Link from "next/link";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { CourseThumb } from "@/components/course/course-thumb";
import { Progress } from "@/components/ui/misc";
import type { MyCourse } from "@/lib/learner";

export function MyCourseCard({ item }: { item: MyCourse }) {
  const href = `/learn/${item.course.slug}${item.lastLessonId ? `?lesson=${item.lastLessonId}` : ""}`;
  return (
    <Link href={href} className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative">
        <CourseThumb title={item.course.title} thumbnail={item.course.thumbnail} category={item.course.category} size="sm" className="aspect-[16/7]" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <PlayCircle className="h-12 w-12 text-white" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{item.course.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.course.tutor}</p>
        <div className="mt-auto pt-4">
          <Progress value={item.percent} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {item.completed}/{item.total} lessons
            </span>
            {item.completedAt ? (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
            ) : (
              <span className="font-semibold text-primary">{item.percent}%</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
