import { ArrowLeft, CheckCircle2, MailOpen } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/frontend/components/app-shell";
import { ReplyComposer } from "@/frontend/components/reply-composer";
import { CategoryBadge, PriorityBadge, RiskBadge } from "@/frontend/components/status-badge";
import { Badge } from "@/frontend/components/ui/badge";
import styles from "@/frontend/components/app-workspace.module.css";
import { getCurrentUser, getEmailWithDrafts } from "@/backend/db";
import type { DraftRecord, EmailRecord } from "@/lib/types";
import { formatDate, getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connect");
  const { id } = await params;
  const { email, drafts } = await getEmailWithDrafts(user.id, id);
  if (!email) notFound();
  const record = email as EmailRecord;
  const draftRows = drafts as DraftRecord[];
  return (
    <AppShell user={user}>
      <div className={styles.detail}>
        <Link className={styles.backLink} href="/dashboard"><ArrowLeft size={15} aria-hidden="true" />Back to your inbox</Link>
        <section className={styles.detailHeading}>
          <div className="flex flex-wrap gap-2"><CategoryBadge category={record.category} /><PriorityBadge priority={record.priority} /><RiskBadge riskScore={record.risk_score} />{record.needs_reply && <Badge tone="amber">Needs reply</Badge>}</div>
          <h1>{record.subject}</h1>
          <div className={styles.detailSender}><span className={styles.senderAvatar}>{getInitials(record.sender)}</span><div><p>{record.sender}</p><span>{formatDate(record.created_at)}</span></div></div>
        </section>
        <section className={styles.detailColumns}>
          <div className={styles.detailPanel}>
            <h2 className="flex items-center gap-2"><MailOpen size={18} strokeWidth={1.5} aria-hidden="true" />The short version</h2>
            <div className={styles.analysisBlocks}>
              <AnalysisBlock label="What it says" value={record.summary ?? "Choose Analyze inbox on your dashboard to find the key details."} />
              <AnalysisBlock label="Your next step" value={record.recommended_action ?? "A suggested next step will appear once this message is analyzed."} />
              <div><h3>Things to do</h3>{record.action_items?.length ? <ul>{record.action_items.map((item) => <li key={item}><CheckCircle2 size={15} aria-hidden="true" />{item}</li>)}</ul> : <p>{record.summary ? "No action items were found in this message." : "Action items will appear after analysis."}</p>}</div>
            </div>
          </div>
          <div className={styles.detailPanel}><h2>The original message</h2><pre>{record.body || "No message text was available from Gmail."}</pre></div>
        </section>
        <ReplyComposer emailId={record.id} />
        <section className={styles.detailPanel}>
          <h2>Saved drafts</h2>
          {draftRows.length ? draftRows.map((draft) => <div className={styles.draft} key={draft.id}><div><Badge tone={draft.gmail_draft_id ? "green" : "neutral"}>{draft.gmail_draft_id ? "Gmail draft" : "Workspace draft"}</Badge><time dateTime={draft.created_at}>{formatDate(draft.created_at)}</time></div><p>{draft.draft_text}</p></div>) : <p className="mt-4 text-sm leading-7 text-muted-foreground">Your generated replies will be saved here. A first draft is a good place to start.</p>}
        </section>
      </div>
    </AppShell>
  );
}

function AnalysisBlock({ label, value }: { label: string; value: string }) { return <div><h3>{label}</h3><p>{value}</p></div>; }
