import { cn } from "@/lib/utils/cn";
import { forwardRef, TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      suppressHydrationWarning
      ref={ref}
      className={cn(
        "min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
