import {
  Crown,
  FilePenLine,
  Inbox,
  LogOut,
  Settings,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/frontend/components/ui/button";
import {
  CommandPalette,
  HeaderCommandTrigger,
  SidebarCommandTrigger
} from "@/frontend/components/command-palette";
import { MailFlowMark } from "@/frontend/components/mailflow-mark";
import { isDemoUserId } from "@/backend/demo";
import { USER_COOKIE_NAME } from "@/backend/db";
import type { CurrentUser } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";

export function AppShell({
  user,
  children,
  activeNav = "dashboard"
}: {
  user: CurrentUser;
  children: ReactNode;
  activeNav?: "dashboard" | "settings" | "drafts";
}) {
  const isDemo = isDemoUserId(user.id);

  return (
    <div className="mf-shell-grid min-h-screen text-foreground">
      <aside className="mf-glass fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border lg:flex">
        <div className="flex h-[68px] items-center gap-3 border-b border-border px-5">
          <Link className="flex min-w-0 items-center gap-3" href="/dashboard">
            <MailFlowMark className="size-10 shrink-0" />
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-5">
                MailFlow
              </span>
              <span className="mf-mono block text-[10px] text-muted-foreground">
                Inbox AI
              </span>
            </span>
          </Link>
          {isDemo ? (
            <span className="ml-auto rounded-md border border-primary/30 bg-primary/[0.12] px-2 py-1 text-[10px] font-semibold text-primary">
              DEMO
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-5 px-3 py-4">
          <SidebarCommandTrigger />

          <nav className="grid gap-1">
            <ShellNavItem
              active={activeNav === "dashboard"}
              href="/dashboard"
              icon={Inbox}
              label="Inbox"
            />
            <ShellNavItem
              active={activeNav === "drafts"}
              href="/dashboard"
              icon={FilePenLine}
              label="Drafts"
              meta="Soon"
            />
            <ShellNavItem
              active={activeNav === "settings"}
              href="/settings"
              icon={Settings}
              label="Settings"
            />
          </nav>

          <div className="mt-auto rounded-md border border-primary/20 bg-primary/[0.08] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Protection active
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Gmail read and draft scopes only. Replies stay manual.
            </p>
          </div>
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md bg-white/70 p-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
              {getInitials(user.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user.email}</p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {user.plan} plan
              </p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon",
                  className: "size-8 shrink-0 text-muted-foreground"
                })}
                name={USER_COOKIE_NAME}
                title="Sign out"
                type="submit"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[248px]">
        <header className="mf-glass sticky top-0 z-20 border-b border-border">
          <div className="mx-auto flex h-[60px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link className="flex items-center gap-2 lg:hidden" href="/dashboard">
              <MailFlowMark className="size-9" />
              <span className="font-semibold">MailFlow</span>
            </Link>
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="mf-mono text-[10px] text-muted-foreground">
                Command center
              </p>
              <p className="truncate text-sm font-semibold">
                Prioritize, protect, and draft from one calm inbox.
              </p>
            </div>
            <HeaderCommandTrigger />
            <span className="hidden items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline-flex">
              <span className="size-1.5 rounded-full bg-primary" />
              {isDemo ? "Demo connected" : "Gmail connected"}
            </span>
            <Link
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "hidden border-amber-700/25 bg-amber-400/10 text-amber-800 hover:bg-amber-400/15 md:inline-flex"
              })}
              href="/settings"
            >
              <Crown className="size-4" aria-hidden="true" />
              Pro
            </Link>
          </div>
        </header>
        <main className="mf-rise mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

function ShellNavItem({
  active,
  href,
  icon: Icon,
  label,
  meta
}: {
  active?: boolean;
  href: string;
  icon: typeof Inbox;
  label: string;
  meta?: string;
}) {
  return (
    <Link
      className={cn(
        "group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px] shadow-primary/30"
          : "hover:bg-black/[0.03] hover:text-foreground"
      )}
      href={href}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta ? (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px]",
            active
              ? "bg-white/15 text-primary-foreground"
              : "bg-white/80 text-muted-foreground"
          )}
        >
          {meta}
        </span>
      ) : null}
    </Link>
  );
}
