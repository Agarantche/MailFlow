import {
  ArrowUpRight,
  LucideIcon,
  MailQuestion,
  Newspaper,
  ShieldAlert,
  Sparkles,
  Star
} from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { AppShell } from "@/frontend/components/app-shell";
import { DashboardActions } from "@/frontend/components/dashboard-actions";
import { DashboardInbox } from "@/frontend/components/dashboard-inbox";
import { Alert } from "@/frontend/components/ui/alert";
import { Badge } from "@/frontend/components/ui/badge";
import { UsageMeter } from "@/frontend/components/usage-meter";
import {
  ensureUsageRow,
  getCurrentUser,
  getDashboardEmails,
  getGmailConnection,
  isDemoUserId
} from "@/backend/db";
import type { EmailRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connect");
  }

  const [usage, connection, emails] = await Promise.all([
    ensureUsageRow(user.id),
    getGmailConnection(user.id),
    getDashboardEmails(user.id)
  ]);
  const stats = getDashboardStats(emails);
  const isDemo = isDemoUserId(user.id);
  const pendingCount = emails.filter((email) => !email.summary).length;
  const safeCount = emails.filter((email) => (email.risk_score ?? 0) < 4).length;
  const displayName = isDemo ? "Alex" : user.email.split("@")[0] || "there";

  return (
    <AppShell user={user}>
      <div className="grid gap-7">
        <section className="mf-panel mf-specular grid gap-5 overflow-hidden rounded-lg p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={connection ? "green" : "amber"}>
                {isDemo
                  ? "Demo inbox"
                  : connection
                    ? "Gmail connected"
                    : "Gmail not connected"}
              </Badge>
              <Badge tone={pendingCount ? "amber" : "green"}>
                {pendingCount ? `${pendingCount} pending` : "Inbox analyzed"}
              </Badge>
            </div>
            <DashboardActions />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_28rem] lg:items-end">
            <div>
              <p className="mf-mono text-[11px] text-primary">
                Inbox command center
              </p>
              <h1 className="mf-display mt-2 text-5xl leading-none tracking-normal">
                {getGreeting()}, {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Prioritize replies, spot risky messages, and turn email into
                clear next actions before anything reaches Gmail.
              </p>
            </div>
            <div className="relative min-h-56 overflow-hidden rounded-xl border border-border">
              <Image
                alt="Sunlit greenhouse foliage"
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 28rem, 100vw"
                src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1200&q=75"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#1c2417]/65 via-transparent to-transparent"
              />
              <div className="absolute inset-x-3 bottom-3 grid gap-2 text-sm sm:grid-cols-3">
                <Signal label="Safe" value={safeCount} />
                <Signal label="Needs reply" value={stats.needsReply} />
                <Signal label="Risk review" value={stats.suspicious} />
              </div>
            </div>
          </div>
        </section>

        {isDemo ? (
          <Alert className="flex items-start gap-3 border-primary/25 bg-primary/10 text-primary shadow-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Demo mode is using sample emails and simulated AI actions.
              Connect Gmail when you are ready to use real inbox data.
            </span>
          </Alert>
        ) : null}

        <section className="mf-rise mf-d1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            helper="Manual response likely"
            icon={MailQuestion}
            label="Needs Reply"
            tone="emerald"
            value={stats.needsReply}
          />
          <StatCard
            helper="High or urgent priority"
            icon={Star}
            label="Important"
            tone="sky"
            value={stats.important}
          />
          <StatCard
            helper="Risk score or phishing flag"
            icon={ShieldAlert}
            label="Suspicious"
            tone="rose"
            value={stats.suspicious}
          />
          <StatCard
            helper="Low-touch reading"
            icon={Newspaper}
            label="Newsletters"
            tone="amber"
            value={stats.newsletters}
          />
        </section>

        <div className="mf-rise mf-d2">
          <UsageMeter usage={usage} user={user} />
        </div>

        <div className="mf-rise mf-d3">
          <DashboardInbox emails={emails} hasConnection={Boolean(connection)} />
        </div>
      </div>
    </AppShell>
  );
}

function getGreeting(now = new Date()) {
  const hour = now.getHours();

  if (hour < 5) {
    return "Working late";
  }

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/50 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  helper: string;
  tone: "emerald" | "sky" | "rose" | "amber";
}) {
  const styles = {
    emerald: "border-primary/30 bg-primary/10 text-primary",
    sky: "border-accent/30 bg-accent/10 text-accent",
    rose: "border-rose-700/25 bg-rose-400/10 text-rose-700",
    amber: "border-amber-700/25 bg-amber-400/10 text-amber-800"
  };

  return (
    <div className="mf-panel mf-lift mf-specular rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-md border", styles[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold">{value}</p>
        <ArrowUpRight className="mb-1 size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "emerald"
              ? "bg-primary"
              : tone === "sky"
                ? "bg-accent"
                : tone === "rose"
                  ? "bg-rose-400"
                  : "bg-amber-400"
          )}
          style={{ width: `${Math.min(100, value * 18 + 18)}%` }}
        />
      </div>
    </div>
  );
}

function getDashboardStats(emails: EmailRecord[]) {
  return {
    needsReply: emails.filter((email) => email.needs_reply).length,
    important: emails.filter(
      (email) => email.priority === "High" || email.priority === "Urgent"
    ).length,
    suspicious: emails.filter(
      (email) =>
        email.category === "Phishing" ||
        email.category === "Spam" ||
        (email.risk_score ?? 0) >= 7
    ).length,
    newsletters: emails.filter((email) => email.category === "Newsletter").length
  };
}
