"use client";

import {
  ArrowUpRight,
  Clock3,
  Inbox,
  ListFilter,
  MailOpen,
  Search,
  ShieldAlert,
  SortAsc
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/frontend/components/empty-state";
import {
  CategoryBadge,
  PriorityBadge,
  RiskBadge
} from "@/frontend/components/status-badge";
import { Badge } from "@/frontend/components/ui/badge";
import { buttonVariants } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import type { EmailRecord } from "@/lib/types";
import { cn, formatDate, getInitials } from "@/lib/utils";

type DashboardFilter =
  | "all"
  | "needs-reply"
  | "important"
  | "suspicious"
  | "newsletters"
  | "unanalyzed";

type SortMode = "newest" | "oldest" | "risk" | "priority";
type Density = "comfortable" | "compact";

export function DashboardInbox({
  emails,
  hasConnection
}: {
  emails: EmailRecord[];
  hasConnection: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [density, setDensity] = useState<Density>("comfortable");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    emails[0]?.id ?? null
  );

  const filteredEmails = useMemo(() => {
    return sortEmails(
      filterBySearch(filterDashboardEmails(emails, activeFilter), query),
      sortMode
    );
  }, [activeFilter, emails, query, sortMode]);

  const selectedEmail =
    filteredEmails.find((email) => email.id === selectedEmailId) ??
    filteredEmails[0] ??
    null;
  const options = getFilterOptions(emails);

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mf-mono text-[10px] text-primary">Dynamic inbox</p>
          <h2 className="mt-1 text-xl font-semibold">Recent unread mail</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing {filteredEmails.length} of {emails.length} messages
          </p>
        </div>
        {!hasConnection ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/connect"
          >
            Connect Gmail
          </Link>
        ) : null}
      </div>

      <div className="mf-panel rounded-md p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sender, subject, summary, or action"
              value={query}
            />
          </div>

          <label className="flex items-center gap-2 rounded-md border border-border bg-white/70 px-3 py-2 text-sm">
            <SortAsc className="size-4 text-muted-foreground" aria-hidden="true" />
            <select
              className="bg-transparent text-sm outline-none"
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              value={sortMode}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="risk">Highest risk</option>
              <option value="priority">Highest priority</option>
            </select>
          </label>

          <div className="flex rounded-md border border-border bg-white/70 p-1">
            {(["comfortable", "compact"] as const).map((value) => (
              <button
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  density === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                key={value}
                onClick={() => setDensity(value)}
                type="button"
              >
                {value === "comfortable" ? "Comfort" : "Compact"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = option.value === activeFilter;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  buttonVariants({
                    variant: isActive ? "default" : "outline",
                    size: "sm"
                  }),
                  "h-auto min-h-9 shadow-sm"
                )}
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                type="button"
              >
                <ListFilter className="size-3.5" aria-hidden="true" />
                {option.label}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs",
                    isActive
                      ? "bg-primary-foreground/90 text-primary"
                      : "bg-white/80 text-muted-foreground"
                  )}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredEmails.length ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
          <div className="mf-panel overflow-hidden rounded-md">
            {filteredEmails.map((email) => (
              <EmailRow
                density={density}
                email={email}
                isSelected={selectedEmail?.id === email.id}
                key={email.id}
                onSelect={() => setSelectedEmailId(email.id)}
              />
            ))}
          </div>
          <EmailPreview email={selectedEmail} />
        </div>
      ) : (
        <EmptyState
          action={
            emails.length ? (
              <button
                className={buttonVariants()}
                onClick={() => {
                  setActiveFilter("all");
                  setQuery("");
                }}
                type="button"
              >
                Clear view
              </button>
            ) : hasConnection ? null : (
              <Link className={buttonVariants()} href="/connect">
                Connect Gmail
              </Link>
            )
          }
          description={
            emails.length
              ? "Adjust the search or filters to return to the inbox."
              : "Fetch unread Gmail messages to begin analysis. New records will appear here with loading-safe pending states."
          }
          title={emails.length ? "No matching emails" : "No emails yet"}
        />
      )}
    </section>
  );
}

function EmailRow({
  email,
  isSelected,
  density,
  onSelect
}: {
  email: EmailRecord;
  isSelected: boolean;
  density: Density;
  onSelect: () => void;
}) {
  const isPending = !email.summary;
  const isRisky = isSuspiciousEmail(email);
  const accent = isRisky
    ? "bg-rose-500"
    : email.needs_reply
      ? "bg-amber-500"
      : isPending
        ? "bg-sky-500"
        : "bg-emerald-500";

  return (
    <article
      className={cn(
        "group grid gap-4 border-b border-border transition-colors last:border-b-0 hover:bg-black/[0.03] md:grid-cols-[1fr_auto]",
        density === "compact" ? "p-3" : "p-4",
        isSelected ? "bg-primary/[0.08]" : "bg-transparent"
      )}
    >
      <button
        className="grid min-w-0 grid-cols-[2.75rem_1fr] gap-3 text-left"
        onClick={onSelect}
        type="button"
      >
        <span className="relative grid size-11 place-items-center rounded-md border border-border bg-white/80 text-sm font-semibold text-muted-foreground shadow-sm">
          <span
            className={cn(
              "absolute left-0 top-0 h-full w-1 rounded-l-md",
              accent
            )}
          />
          {getInitials(email.sender)}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold group-hover:text-primary">
              {email.subject}
            </span>
            {email.needs_reply ? <Badge tone="amber">Needs reply</Badge> : null}
            {isPending ? <Badge tone="blue">Pending analysis</Badge> : null}
          </span>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {email.sender}
          </span>
          {density === "comfortable" ? (
            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
              {email.summary ?? email.body}
            </span>
          ) : null}
        </span>
      </button>

      <div className="flex flex-wrap items-start gap-2 md:max-w-sm md:justify-end">
        <div className="flex flex-wrap gap-2 md:justify-end">
          <CategoryBadge category={email.category} />
          <PriorityBadge priority={email.priority} />
          <RiskBadge riskScore={email.risk_score} />
        </div>
        <Badge className="gap-1">
          <Clock3 className="size-3" aria-hidden="true" />
          {formatDate(email.created_at)}
        </Badge>
        <Link
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8"
          })}
          href={`/emails/${email.id}`}
        >
          Open
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function EmailPreview({ email }: { email: EmailRecord | null }) {
  if (!email) {
    return (
      <aside className="mf-panel rounded-md p-5">
        <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
      </aside>
    );
  }

  return (
    <aside className="mf-panel sticky top-24 hidden self-start rounded-md p-5 xl:block">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          {getInitials(email.sender)}
        </span>
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={`/emails/${email.id}`}
        >
          Open
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <h3 className="mt-4 text-base font-semibold leading-6">{email.subject}</h3>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {email.sender}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CategoryBadge category={email.category} />
        <PriorityBadge priority={email.priority} />
        <RiskBadge riskScore={email.risk_score} />
      </div>
      <div className="mt-5 rounded-md border border-border bg-white/70 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MailOpen className="size-4 text-primary" aria-hidden="true" />
          Summary
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {email.summary ?? email.body}
        </p>
      </div>
      <div className="mt-4 rounded-md border border-border bg-white/70 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="size-4 text-primary" aria-hidden="true" />
          Recommended action
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {email.recommended_action ?? "Analyze this email to get a recommendation."}
        </p>
      </div>
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
