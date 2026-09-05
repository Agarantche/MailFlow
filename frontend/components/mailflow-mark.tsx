import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function MailFlowMark({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("mf-logo inline-grid size-9 shrink-0 place-items-center", className)} {...props}>
      <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className="h-full w-full">
        <path d="M7 25C4 14 13 5 31 5c1 13-5 24-16 23" fill="currentColor" opacity=".16" />
        <path d="M8 29C5 17 14 7 32 7c0 14-7 24-19 23" fill="currentColor" />
        <path d="M7 35c4-11 11-18 20-23M15 22l-1-6M20 18l7 1" stroke="var(--c-bg, #f4f7f2)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 35c2-6 5-10 8-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
