import { Check, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/frontend/components/app-shell";
import { Badge } from "@/frontend/components/ui/badge";
import { buttonVariants } from "@/frontend/components/ui/button";
import { UsageMeter } from "@/frontend/components/usage-meter";
import styles from "@/frontend/components/app-workspace.module.css";
import { PLAN_LIMITS } from "@/lib/constants";
import { ensureUsageRow, getCurrentUser, getGmailConnection, isDemoUserId } from "@/backend/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connect");
  const [usage, connection] = await Promise.all([ensureUsageRow(user.id), getGmailConnection(user.id)]);
  const isDemo = isDemoUserId(user.id);
  const limits = PLAN_LIMITS[user.plan];
  return (
    <AppShell activeNav="settings" user={user}>
      <div className={styles.settings}>
        <section className={styles.pageHeading}><h1>Make yourself at home.</h1><p>Your account, your space, and a clear view of what you use.</p></section>
        <section className={styles.settingsSection}>
          <div><h2>Your connected inbox</h2><p>One place for the details. You stay in control of what happens next.</p></div>
          <div className={styles.settingsPanel}>
            <div className={styles.accountDetail}><span><Mail size={20} strokeWidth={1.5} aria-hidden="true" /></span><div><h3>{isDemo ? "Demo inbox" : connection ? "Gmail" : "Let’s bring your inbox in"}</h3><p>{isDemo ? "Sample emails. Your personal inbox is untouched." : connection?.email ?? "No account connected yet."}</p></div></div>
            <ul className={styles.permissionList}>
              <li><Check size={15} aria-hidden="true" /><span>{isDemo ? "Fetch, analyze, and try reply drafts with simulated actions." : connection ? `Connected ${formatDate(connection.created_at)}.` : "Connect Gmail to start reading your unread messages."}</span></li>
              <li><ShieldCheck size={15} aria-hidden="true" /><span>MailFlow creates drafts when you ask. You review and send from Gmail.</span></li>
            </ul>
            {(isDemo || !connection) && <Link className={buttonVariants({ variant: "outline", size: "sm", className: "mt-6" })} href="/connect">Connect your Gmail</Link>}
          </div>
        </section>
        <section className={styles.settingsSection}>
          <div><h2>Your monthly usage</h2><p>A little help goes a long way. Your current cycle ends {formatDate(usage.billing_cycle_end)}.</p></div>
          <div className={styles.settingsPanel}><UsageMeter usage={usage} user={user} /><p className={styles.billingNote}>{isDemo ? "These are sample usage totals for the demo." : "Usage updates when you analyze messages or generate drafts."}</p></div>
        </section>
        <section className={styles.settingsSection}>
          <div><h2>Your plan</h2><p>The essentials for a lighter inbox, with clear limits.</p></div>
          <div className={styles.settingsPanel}>
            <div className={styles.billingIntro}><h3 className="capitalize">{user.plan}</h3><Badge tone="green">Current plan</Badge></div>
            <ul className={styles.permissionList}><li><Check size={15} aria-hidden="true" />{limits.emailsAnalyzed.toLocaleString()} email analyses each month</li><li><Check size={15} aria-hidden="true" />{limits.draftsGenerated.toLocaleString()} reply drafts each month</li><li><Check size={15} aria-hidden="true" />Summaries, priorities, and risk review</li></ul>
            <p className={styles.billingNote}><strong>More room, in time.</strong> Paid upgrades aren’t available in this preview. There’s nothing to purchase here.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
