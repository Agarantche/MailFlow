import { Check, Mail, Settings } from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/frontend/components/app-shell";
import { PlanUpgradeButton } from "@/frontend/components/plan-upgrade-button";
import { Badge } from "@/frontend/components/ui/badge";
import { UsageMeter } from "@/frontend/components/usage-meter";
import { FREE_PLAN_COPY, PRO_PLAN_COPY } from "@/lib/constants";
import {
  ensureUsageRow,
  getCurrentUser,
  getGmailConnection
} from "@/backend/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connect");
  }

  const [usage, connection] = await Promise.all([
    ensureUsageRow(user.id),
    getGmailConnection(user.id)
  ]);

  return (
    <AppShell activeNav="settings" user={user}>
      <div className="grid gap-8">
        <section>
          <Badge tone="blue">
            <Settings className="mr-1 size-3" aria-hidden="true" />
            Settings
          </Badge>
          <h1 className="mf-display mt-3 text-5xl leading-none tracking-normal">
            Usage and plan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track monthly limits, review your connected Gmail account, and
            prepare the Pro subscription flow.
          </p>
        </section>

        <UsageMeter usage={usage} user={user} />

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="mf-panel rounded-md p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md border border-border bg-white/70">
                <Mail className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Gmail account</h2>
                <p className="text-sm text-muted-foreground">
                  {connection?.email ?? "No Gmail account connected"}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-md border border-border bg-white/70 p-4 text-sm leading-6 text-muted-foreground">
              {connection
                ? `Connected on ${formatDate(connection.created_at)}. MailFlow can read messages and create drafts, but cannot auto-send replies.`
                : "Connect Gmail from the login page to start fetching unread messages."}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PlanCard
              active={user.plan === "free"}
              cta={null}
              description="For early inbox triage and light reply drafting."
              items={FREE_PLAN_COPY}
              name="Free"
            />
            <PlanCard
              active={user.plan === "pro"}
              cta={<PlanUpgradeButton />}
              description="Payment is stubbed now and ready for Stripe Checkout."
              items={PRO_PLAN_COPY}
              name="Pro"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function PlanCard({
  name,
  description,
  items,
  active,
  cta
}: {
  name: string;
  description: string;
  items: string[];
  active: boolean;
  cta: React.ReactNode;
}) {
  return (
    <div className="mf-panel rounded-md p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{name}</h2>
        {active ? <Badge tone="green">Current</Badge> : <Badge>Available</Badge>}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li className="flex gap-2 text-sm" key={item}>
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      {cta ? <div className="mt-5">{cta}</div> : null}
    </div>
  );
}
