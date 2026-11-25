"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/actions";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Form bound to a server action returning `ActionState`.
 * Shows toasts for success/error and can reset itself on success.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  successMessage,
  onSuccess,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  successMessage?: string;
  onSuccess?: () => void;
}) {
  // Toasts are raised from the action result itself (not an effect) so feedback
  // still shows when the revalidated page no longer renders this form.
  const [state, formAction] = useActionState(async (prev: ActionState, form: FormData) => {
    const result = await action(prev, form);
    if (result?.ok) {
      const msg = result.message ?? successMessage;
      if (msg) toast.success(msg);
    } else if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok) return;
    if (resetOnSuccess) ref.current?.reset();
    onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
    </form>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingText,
  confirm,
  ...rest
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  pendingText?: string;
  confirm?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || rest.disabled}
      className={buttonClass(variant, size, className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      {...rest}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
