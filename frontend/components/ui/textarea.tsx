import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-48 w-full resize-y rounded-xl border border-border bg-[#f8faf4] px-4 py-4 text-sm leading-7 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/70 focus:ring-2 focus:ring-primary/15",
        className
      )}
      {...props}
    />
  );
}
