"use client";

import { ArrowUpRight, ArrowRight, AlignJustify, LayoutList, MailOpen, Search, ShieldCheck, SortAsc, Undo2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/frontend/components/empty-state";
import { CategoryBadge, PriorityBadge, RiskBadge } from "@/frontend/components/status-badge";
import { Badge } from "@/frontend/components/ui/badge";
import { buttonVariants } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import type { EmailRecord } from "@/lib/types";
import { cn, formatDate, getInitials } from "@/lib/utils";
import styles from "./app-workspace.module.css";

type DashboardFilter = "all" | "needs-reply" | "important" | "suspicious" | "newsletters" | "unanalyzed";
type SortMode = "newest" | "oldest" | "risk" | "priority";
type Density = "comfortable" | "compact";

export function DashboardInbox({ emails, hasConnection }: { emails: EmailRecord[]; hasConnection: boolean }) {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [density, setDensity] = useState<Density>("comfortable");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(emails[0]?.id ?? null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const filteredEmails = useMemo(() => sortEmails(filterBySearch(filterDashboardEmails(emails, activeFilter), query), sortMode), [activeFilter, emails, query, sortMode]);
  const selectedEmail = filteredEmails.find((email) => email.id === selectedEmailId) ?? filteredEmails[0] ?? null;
  const options = getFilterOptions(emails);

  return (
    <section className={styles.inbox} aria-labelledby="inbox-title">
      <div className={styles.inboxHeading}>
        <div><h2 id="inbox-title">Your inbox, with clarity.</h2><p role="status">{filteredEmails.length} of {emails.length} messages in this view</p></div>
        {!hasConnection && <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/connect">Connect Gmail</Link>}
      </div>
      <div className={styles.inboxToolbar}>
        <div className={styles.search}><Search size={16} strokeWidth={1.6} aria-hidden="true" /><Input aria-label="Search emails" onChange={(event) => setQuery(event.target.value)} placeholder="Find a message, person, or next step..." value={query} /></div>
        <label className={styles.sort}><SortAsc size={16} aria-hidden="true" /><select aria-label="Sort emails" onChange={(event) => setSortMode(event.target.value as SortMode)} value={sortMode}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="risk">Highest risk</option><option value="priority">Highest priority</option></select></label>
        <div className={styles.density} role="group" aria-label="Inbox density">
          <button aria-label="Comfortable view" aria-pressed={density === "comfortable"} onClick={() => setDensity("comfortable")} title="Comfortable view" type="button"><LayoutList size={17} aria-hidden="true" /></button>
          <button aria-label="Compact view" aria-pressed={density === "compact"} onClick={() => setDensity("compact")} title="Compact view" type="button"><AlignJustify size={17} aria-hidden="true" /></button>
        </div>
      </div>
      <div className={styles.filters} role="group" aria-label="Filter emails">
        {options.map((option) => <button aria-pressed={option.value === activeFilter} className={styles.filter} key={option.value} onClick={() => setActiveFilter(option.value)} type="button">{option.label}<span className={styles.filterCount}>{option.count}</span></button>)}
      </div>
      {filteredEmails.length ? (
        <div className={styles.inboxGrid}>
          <div className={styles.emailList}>
            {filteredEmails.map((email) => <EmailRow key={email.id} density={density} email={email} isSelected={selectedEmail?.id === email.id} onSelect={() => { setSelectedEmailId(email.id); if (window.matchMedia("(max-width: 767px)").matches) setMobilePreviewOpen(true); }} />)}
          </div>
          {selectedEmail && <EmailPreview email={selectedEmail} mobileOpen={mobilePreviewOpen} onClose={() => setMobilePreviewOpen(false)} />}
        </div>
      ) : (
        <EmptyState title={emails.length ? "Nothing here. A little room to breathe." : "A fresh start for your inbox."} description={emails.length ? "Try a different search or clear your filters to see your messages." : hasConnection ? "Choose Fetch unread above to bring your latest messages into this space." : "Connect Gmail to bring your messages into one calm space."} action={emails.length ? <button className={buttonVariants()} onClick={() => { setActiveFilter("all"); setQuery(""); }} type="button">Clear filters</button> : !hasConnection ? <Link className={buttonVariants()} href="/connect">Connect Gmail</Link> : null} />
      )}
    </section>
  );
}

function senderName(sender: string) { return sender.split("<")[0].trim().replace(/^"|"$/g, "") || sender; }
function senderAddress(sender: string) { return sender.match(/<(.+)>/)?.[1] ?? sender; }

function EmailRow({ email, isSelected, density, onSelect }: { email: EmailRecord; isSelected: boolean; density: Density; onSelect: () => void }) {
  const name = senderName(email.sender);
  return (
    <article className={cn(styles.emailRow, isSelected && styles.selectedRow, density === "compact" && styles.compact)}>
      <button className={styles.rowSelect} onClick={onSelect} type="button" aria-pressed={isSelected} aria-label={`Preview: ${email.subject}`}>
        <span className={cn(styles.senderAvatar, isSuspiciousEmail(email) && styles.riskyAvatar)}>{getInitials(name)}</span>
        <span className={styles.rowContent}>
          <span className={styles.rowTop}><span className={styles.sender}>{name}</span><time className={styles.rowDate} dateTime={email.created_at}>{formatDate(email.created_at)}</time></span>
          <span className={styles.rowSubject}>{email.subject}</span>
          {density === "comfortable" && <span className={styles.rowSnippet}>{email.summary ?? email.body}</span>}
        </span>
      </button>
      <div className={styles.rowFooter}>
        {email.summary ? <CategoryBadge category={email.category} /> : <Badge>Awaiting analysis</Badge>}
        {email.needs_reply && <span className={styles.replyFlag}><Undo2 size={11} aria-hidden="true" />Needs reply</span>}
        <Link href={`/emails/${email.id}`} aria-label={`Open ${email.subject}`}>Open <ArrowUpRight size={12} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

function EmailPreview({ email, mobileOpen, onClose }: { email: EmailRecord; mobileOpen: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const smallScreen = window.matchMedia("(max-width: 767px)");
    const onViewportChange = () => { if (!smallScreen.matches) onCloseRef.current(); };
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab") return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
      if (!items?.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    smallScreen.addEventListener("change", onViewportChange);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKeyDown); smallScreen.removeEventListener("change", onViewportChange); previousFocus?.focus(); };
  }, [mobileOpen]);
  const name = senderName(email.sender);
  return (
    <aside ref={panelRef} className={cn(styles.preview, mobileOpen && styles.previewOpen)} role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen ? true : undefined} aria-label="Message preview">
      <div className={styles.previewHeader}><button className={styles.previewClose} type="button" onClick={onClose} aria-label="Close preview"><X size={15} aria-hidden="true" /></button><span className={styles.previewLabel}>A moment of clarity</span><Link href={`/emails/${email.id}`}>Full message <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
      <div className={styles.previewSender}><span className={styles.senderAvatar}>{getInitials(name)}</span><div><strong>{name}</strong><p>{senderAddress(email.sender)}</p></div></div>
      <h3>{email.subject}</h3>
      <div className={styles.previewBadges}><PriorityBadge priority={email.priority} /><RiskBadge riskScore={email.risk_score} /></div>
      <div className={styles.summary}><h4><MailOpen size={14} aria-hidden="true" />{email.summary ? "The short version" : "Message preview"}</h4><p>{email.summary ?? email.body}</p></div>
      <div className={styles.recommendation}><h4><ShieldCheck size={14} aria-hidden="true" />Your next step</h4><p>{email.recommended_action ?? "Choose Analyze inbox to find the key details and suggested next step."}</p></div>
      <Link className={buttonVariants({ className: styles.previewAction })} href={`/emails/${email.id}`}>{email.needs_reply ? "Review & draft a reply" : "Read full message"}<ArrowRight size={15} aria-hidden="true" /></Link>
    </aside>
  );
}
function filterBySearch(emails: EmailRecord[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return emails;
  }

  return emails.filter((email) =>
    [
      email.sender,
      email.subject,
      email.summary,
      email.recommended_action,
      email.body
    ]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedQuery))
  );
}

function sortEmails(emails: EmailRecord[], sortMode: SortMode) {
  const priorityRank = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1
  };

  return [...emails].sort((a, b) => {
    if (sortMode === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    if (sortMode === "risk") {
      return (b.risk_score ?? -1) - (a.risk_score ?? -1);
    }

    if (sortMode === "priority") {
      return (
        (priorityRank[b.priority ?? "Low"] ?? 0) -
        (priorityRank[a.priority ?? "Low"] ?? 0)
      );
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function getFilterOptions(emails: EmailRecord[]) {
  return [
    {
      value: "all",
      label: "All",
      count: emails.length
    },
    {
      value: "needs-reply",
      label: "Needs Reply",
      count: filterDashboardEmails(emails, "needs-reply").length
    },
    {
      value: "important",
      label: "Important",
      count: filterDashboardEmails(emails, "important").length
    },
    {
      value: "suspicious",
      label: "Suspicious",
      count: filterDashboardEmails(emails, "suspicious").length
    },
    {
      value: "newsletters",
      label: "Newsletters",
      count: filterDashboardEmails(emails, "newsletters").length
    },
    {
      value: "unanalyzed",
      label: "Unanalyzed",
      count: filterDashboardEmails(emails, "unanalyzed").length
    }
  ] satisfies Array<{
    value: DashboardFilter;
    label: string;
    count: number;
  }>;
}

function filterDashboardEmails(
  emails: EmailRecord[],
  filter: DashboardFilter
) {
  if (filter === "needs-reply") {
    return emails.filter((email) => email.needs_reply);
  }

  if (filter === "important") {
    return emails.filter(
      (email) => email.priority === "High" || email.priority === "Urgent"
    );
  }

  if (filter === "suspicious") {
    return emails.filter(isSuspiciousEmail);
  }

  if (filter === "newsletters") {
    return emails.filter((email) => email.category === "Newsletter");
  }

  if (filter === "unanalyzed") {
    return emails.filter((email) => !email.summary);
  }

  return emails;
}

function isSuspiciousEmail(email: EmailRecord) {
  return (
    email.category === "Phishing" ||
    email.category === "Spam" ||
    (email.risk_score ?? 0) >= 7
  );
}
