import { Badge } from "@/frontend/components/ui/badge";
import type { Category, Priority } from "@/lib/types";

export function CategoryBadge({ category }: { category?: Category | null }) {
  if (!category) {
    return <Badge>Not analyzed</Badge>;
  }

  const tone =
    category === "Phishing" || category === "Spam"
      ? "red"
      : category === "Billing"
        ? "amber"
        : category === "Newsletter"
          ? "blue"
          : "green";

  return <Badge tone={tone}>{category}</Badge>;
}

export function PriorityBadge({ priority }: { priority?: Priority | null }) {
  if (!priority) {
    return <Badge>Priority pending</Badge>;
  }

  const tone =
    priority === "Urgent" || priority === "High"
      ? "red"
      : priority === "Medium"
        ? "amber"
        : "green";

  return <Badge tone={tone}>{priority}</Badge>;
}

export function RiskBadge({ riskScore }: { riskScore?: number | null }) {
  if (riskScore === null || riskScore === undefined) {
    return <Badge>Risk pending</Badge>;
  }

  const tone = riskScore >= 7 ? "red" : riskScore >= 4 ? "amber" : "green";

  return <Badge tone={tone}>Risk {riskScore}/10</Badge>;
}
