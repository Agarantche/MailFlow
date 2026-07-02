import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}
