import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-[#fcfdf9] px-4 py-3 text-sm leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
