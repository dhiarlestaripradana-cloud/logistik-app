import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

export type BadgeLevel = "HIJAU" | "KUNING" | "MERAH" | "BIRU" | "ABU";

const levels: Record<BadgeLevel, string> = {
  HIJAU: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  KUNING: "bg-amber-100 text-amber-800 ring-amber-200",
  MERAH: "bg-red-100 text-red-700 ring-red-200",
  BIRU: "bg-blue-100 text-blue-700 ring-blue-200",
  ABU: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({
  level = "ABU",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { level?: BadgeLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        levels[level],
        className
      )}
      {...props}
    />
  );
}
