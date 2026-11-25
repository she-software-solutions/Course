"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Textarea } from "@/components/ui/field";
import { submitReviewAction } from "@/app/actions/learning";
import { cn } from "@/lib/utils";

export function ReviewForm({ courseId, initial }: { courseId: string; initial?: { rating: number; comment: string | null } }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  return (
    <ActionForm action={submitReviewAction.bind(null, courseId)} className="space-y-3 rounded-2xl border bg-card p-5">
      <p className="font-semibold">{initial ? "Update your review" : "Rate this course"}</p>
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => setRating(i)}
            className="cursor-pointer"
          >
            <Star className={cn("h-7 w-7 transition", (hover || rating) >= i ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        ))}
      </div>
      <Textarea name="comment" defaultValue={initial?.comment ?? ""} placeholder="What did you like? What could be better?" maxLength={2000} />
      <SubmitButton disabled={!rating}>{initial ? "Update review" : "Submit review"}</SubmitButton>
    </ActionForm>
  );
}
