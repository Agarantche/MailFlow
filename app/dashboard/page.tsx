import { MailQuestion, Newspaper, ShieldAlert, Star, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/frontend/components/app-shell";
import { DashboardActions } from "@/frontend/components/dashboard-actions";
import { DashboardInbox } from "@/frontend/components/dashboard-inbox";
import { LeafScene } from "@/frontend/components/leaf-scene";
import { UsageMeter } from "@/frontend/components/usage-meter";
import styles from "@/frontend/components/app-workspace.module.css";
import { ensureUsageRow, getCurrentUser, getDashboardEmails, getGmailConnection, isDemoUserId } from "@/backend/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connect");
  const [usage, connection, emails] = await Promise.all([ensureUsageRow(user.id), getGmailConnection(user.id), getDashboardEmails(user.id)]);
  const isDemo = isDemoUserId(user.id);
  const displayName = isDemo ? "Alex" : user.email.split("@")[0] || "there";
  const pendingCount = emails.filter((email) => !email.summary).length;
  const needsReply = emails.filter((email) => email.needs_reply).length;
  const important = emails.filter((email) => email.priority === "High" || email.priority === "Urgent").length;
  const suspicious = emails.filter((email) => email.category === "Phishing" || email.category === "Spam" || (email.risk_score ?? 0) >= 7).length;
  const newsletters = emails.filter((email) => email.category === "Newsletter").length;
  return (
    <AppShell user={user}>
      <div className={styles.dashboard}>
        <section className={styles.greeting}>
          <LeafScene className={styles.greetingScene} variant="ambient" interactive={false} />
          <div className={styles.greetingTop}><span />{isDemo ? "A little look at a lighter inbox" : connection ? "Your inbox has room to breathe" : "Make yourself at home"}</div>
          <h1>Welcome back, {displayName}.</h1>
          <p>{needsReply ? `${needsReply} messages need your attention. Let’s make space for the rest of your day.` : "Take a breath. Everything you need is right here, with the noise turned down."}</p>
          <div className={styles.greetingBottom}>
            <DashboardActions />
            <span className={styles.demoNotice}>{isDemo ? <>Sample emails. Actions are simulated. <Link href="/connect">Connect your inbox</Link></> : pendingCount ? `${pendingCount} messages are ready for analysis.` : "You’re up to date."}</span>
          </div>
        </section>
        <section className={styles.statStrip} aria-label="Inbox overview">
          <Stat icon={MailQuestion} label="Needs your reply" value={needsReply} detail="A conversation to continue" />
          <Stat icon={Star} label="Worth your attention" value={important} detail="High or urgent priority" />
          <Stat icon={ShieldAlert} label="Take a closer look" value={suspicious} detail="Flagged for review" risk />
          <Stat icon={Newspaper} label="For a quieter moment" value={newsletters} detail="Your newsletters" />
        </section>
        <DashboardInbox emails={emails} hasConnection={Boolean(connection)} />
        <UsageMeter usage={usage} user={user} />
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, detail, risk }: { icon: LucideIcon; label: string; value: number; detail: string; risk?: boolean }) {
  return <div className={cn(styles.stat, risk && styles.riskStat)}><span className={styles.statValue}>{value}</span><div><span className={styles.statLabel}>{label}</span><span className={styles.statDetail}>{detail}</span></div><Icon className={styles.statIcon} size={17} strokeWidth={1.5} aria-hidden="true" /></div>;
}
