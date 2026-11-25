import type { BadgeTone } from "@/components/ui/misc";

export const paymentTone: Record<string, BadgeTone> = { PAID: "success", CREATED: "warning", FAILED: "danger", REFUNDED: "neutral" };
export const courseStatusTone: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  PENDING_REVIEW: "warning",
  PUBLISHED: "success",
  REJECTED: "danger",
  ARCHIVED: "neutral",
};
export const courseStatusLabel: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "In review",
  PUBLISHED: "Published",
  REJECTED: "Changes requested",
  ARCHIVED: "Archived",
};
export const submissionTone: Record<string, BadgeTone> = { SUBMITTED: "warning", GRADED: "success", RESUBMIT: "danger" };
export const applicationTone: Record<string, BadgeTone> = { APPLIED: "neutral", SHORTLISTED: "warning", ACCEPTED: "success", REJECTED: "danger" };
export const roleTone: Record<string, BadgeTone> = { ADMIN: "dark", TUTOR: "brand", LEARNER: "neutral" };
