import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-white/60 text-muted-foreground",
  green: "border-primary/30 bg-primary/10 text-primary",
  amber: "border-amber-700/25 bg-amber-400/10 text-amber-800",
  red: "border-rose-700/25 bg-rose-400/10 text-rose-700",
  blue: "border-sky-700/25 bg-sky-400/10 text-sky-800"
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
