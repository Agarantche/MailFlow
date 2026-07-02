import { FREE_PLAN_LIMITS, PLAN_LIMITS } from "@/lib/constants";
import type { CurrentUser, Usage } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

export function UsageMeter({
  user,
  usage
}: {
  user: CurrentUser;
  usage: Usage;
}) {
  const limits = PLAN_LIMITS[user.plan];

  return (
    <section className="grid gap-4 md:grid-cols-[1fr_1fr_1.15fr]">
      <UsageBar
        current={usage.emails_analyzed}
        label="Email analyses"
        limit={limits.emailsAnalyzed}
      />
      <UsageBar
        current={usage.drafts_generated}
        label="Reply drafts"
        limit={limits.draftsGenerated}
      />
      <div className="mf-panel rounded-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="rounded-md border border-amber-700/25 bg-amber-400/10 px-2 py-1 text-xs font-semibold capitalize text-amber-800">
            {user.plan} plan
          </span>
          <span className="text-xs text-muted-foreground">
            Cycle ends {formatDate(usage.billing_cycle_end)}
          </span>
        </div>
        {user.plan === "free" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Free includes {FREE_PLAN_LIMITS.emailsAnalyzed} analyses and{" "}
            {FREE_PLAN_LIMITS.draftsGenerated} drafts per month.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function UsageBar({
  label,
  current,
  limit
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const percent = formatPercent(current, limit);

  return (
    <div className="mf-panel rounded-md p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="rounded-md border border-border bg-white/60 px-2 py-1 text-xs font-medium text-muted-foreground">
          {current} / {limit}
        </span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/80">
        <div
          className="h-full rounded-full bg-primary shadow-sm transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{percent}% used</p>
    </div>
  );
}
