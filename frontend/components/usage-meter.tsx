import { PLAN_LIMITS } from "@/lib/constants";
import type { CurrentUser, Usage } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";
import styles from "./app-workspace.module.css";

export function UsageMeter({ user, usage }: { user: CurrentUser; usage: Usage }) {
  const limits = PLAN_LIMITS[user.plan];
  return (
    <section className={styles.usage} aria-label="Monthly usage">
      <UsageBar current={usage.emails_analyzed} label="Analyses" limit={limits.emailsAnalyzed} />
      <UsageBar current={usage.drafts_generated} label="Drafts" limit={limits.draftsGenerated} />
      <div className={styles.usagePlan}><span>{user.plan} plan</span><span>Cycle ends {formatDate(usage.billing_cycle_end)}</span></div>
    </section>
  );
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const percent = formatPercent(current, limit);
  return <div className={styles.usageItem}><span>{label} {current} / {limit}</span><div className={styles.usageTrack} role="progressbar" aria-label={`${label} used`} aria-valuenow={current} aria-valuemin={0} aria-valuemax={limit}><div className={styles.usageFill} style={{ width: `${Math.min(100, percent)}%` }} /></div></div>;
}
