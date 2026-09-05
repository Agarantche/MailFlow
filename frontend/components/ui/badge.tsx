import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[#edf1e7] text-[#647b56]",
  green: "bg-[#e4edda] text-[#4e7140]",
  amber: "bg-[#f3ecd9] text-[#8b7043]",
  red: "bg-[#f4e5df] text-[#a25d49]",
  blue: "bg-[#e5edec] text-[#557c74]"
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
        "inline-flex items-center rounded-[5px] px-2 py-1 text-[10px] font-medium leading-none",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
