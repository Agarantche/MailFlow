import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/frontend/components/app-shell";
import { ReplyComposer } from "@/frontend/components/reply-composer";
import { CategoryBadge, PriorityBadge, RiskBadge } from "@/frontend/components/status-badge";
import { Badge } from "@/frontend/components/ui/badge";
import { buttonVariants } from "@/frontend/components/ui/button";
import { getCurrentUser, getEmailWithDrafts } from "@/backend/db";
import type { DraftRecord, EmailRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmailDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connect");
  }

  const { id } = await params;
  const { email, drafts } = await getEmailWithDrafts(user.id, id);

  if (!email) {
    notFound();
  }

  const record = email as EmailRecord;
  const draftRows = drafts as DraftRecord[];

  return (
    <AppShell user={user}>
      <div className="grid gap-6">
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit" })}
          href="/dashboard"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dashboard
        </Link>

        <section className="mf-panel rounded-md p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mf-mono mb-3 text-[10px] text-primary">
                Email review
              </p>
              <div className="flex flex-wrap gap-2">
                <CategoryBadge category={record.category} />
                <PriorityBadge priority={record.priority} />
                <RiskBadge riskScore={record.risk_score} />
                {record.needs_reply ? <Badge tone="amber">Needs reply</Badge> : null}
              </div>
              <h1 className="mt-4 break-words text-3xl font-semibold tracking-normal">
                {record.subject}
              </h1>
              <p className="mt-2 break-words text-sm text-muted-foreground">
                From {record.sender} / {formatDate(record.created_at)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="mf-panel rounded-md p-5">
            <h2 className="text-lg font-semibold">AI analysis</h2>
            <div className="mt-4 grid gap-4">
              <AnalysisBlock
                label="Summary"
                value={record.summary ?? "Run Analyze Inbox to create a summary."}
              />
              <AnalysisBlock
                label="Recommended action"
                value={
                  record.recommended_action ??
                  "Run analysis to receive a recommended next action."
                }
              />
              <div>
                <p className="text-sm font-medium">Action items</p>
                {record.action_items?.length ? (
                  <ul className="mt-2 grid gap-2">
                    {record.action_items.map((item) => (
                      <li className="flex gap-2 text-sm leading-6" key={item}>
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No action items recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <ReplyComposer emailId={record.id} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="mf-panel rounded-md p-5">
            <h2 className="text-lg font-semibold">Original email</h2>
            <pre className="mf-scroll mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-white/70 p-4 text-sm leading-6 text-foreground">
              {record.body || "No body text was available from Gmail."}
            </pre>
          </div>

          <div className="mf-panel rounded-md p-5">
            <h2 className="text-lg font-semibold">Saved drafts</h2>
            {draftRows.length ? (
              <div className="mt-4 grid gap-3">
                {draftRows.map((draft) => (
                  <div
                    className="rounded-md border border-border bg-white/70 p-3"
                    key={draft.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone={draft.gmail_draft_id ? "green" : "neutral"}>
                        {draft.gmail_draft_id ? "Gmail draft" : "App draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(draft.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      {draft.draft_text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Generated replies will be saved here.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function AnalysisBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}
