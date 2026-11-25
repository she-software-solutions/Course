"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { setLessonCompleteAction } from "@/app/actions/learning";
import { buttonClass } from "@/components/ui/button";

export function CompleteButton({ lessonId, completed, nextHref }: { lessonId: string; completed: boolean; nextHref?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClass(completed ? "soft" : "primary", "md")}
      onClick={() =>
        start(async () => {
          const res = await setLessonCompleteAction(lessonId, !completed);
          if (!res.ok) {
            toast.error(res.error ?? "Could not update progress");
            return;
          }
          if (res.certificateCode) {
            toast.success("🎉 Course complete! Your certificate is ready.", {
              action: { label: "View", onClick: () => router.push(`/certificates/${res.certificateCode}`) },
              duration: 10000,
            });
          } else if (!completed) {
            toast.success("Lesson completed");
          }
          if (!completed && nextHref) router.push(nextHref);
          else router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {completed ? "Completed" : nextHref ? "Mark complete & continue" : "Mark as complete"}
    </button>
  );
}
