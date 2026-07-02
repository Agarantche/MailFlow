import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function MailFlowMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("mf-logo size-10 rounded-xl", className)} {...props}>
      <svg
        aria-hidden="true"
        className="relative z-10 size-6"
        fill="none"
        viewBox="0 0 32 32"
      >
        {/* Leaf body */}
        <path
          d="M25.8 5.4c.5 8.9-2.3 14.9-7 18-3.1 2-6.6 2.3-9.4.8-1.5-4.1-.8-8.6 2.4-12.2 3.3-3.8 8.1-6 14-6.6Z"
          fill="rgb(246 242 233 / 0.16)"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="2.1"
        />
        {/* Center vein flowing into the stem */}
        <path
          className="mf-flow-line"
          d="M24 8C17.5 11.5 12.5 17 6.5 27"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.1"
        />
        {/* Side veins */}
        <path
          className="mf-flow-line"
          d="M18.4 12.6c.3 2.3 1.2 4 2.9 5.2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          className="mf-flow-line"
          d="M13.9 16.9c.2 2 1 3.6 2.4 4.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  );
}
