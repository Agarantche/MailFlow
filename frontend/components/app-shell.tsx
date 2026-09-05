import { ArrowUpRight, Home, Inbox, Leaf, LogOut, Settings, Waypoints } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CommandPalette, HeaderCommandTrigger, SidebarCommandTrigger } from "@/frontend/components/command-palette";
import { MailFlowMark } from "@/frontend/components/mailflow-mark";
import { isDemoUserId } from "@/backend/demo";
import { USER_COOKIE_NAME } from "@/backend/db";
import type { CurrentUser } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";
import styles from "./app-workspace.module.css";

const navigation = [
  { href: "/", icon: Home, label: "Home", key: "home" },
  { href: "/dashboard", icon: Inbox, label: "Inbox", key: "dashboard" },
  { href: "/lab", icon: Waypoints, label: "Decision Lab", key: "lab" },
  { href: "/settings", icon: Settings, label: "Settings", key: "settings" }
];

export function AppShell({ user, children, activeNav = "dashboard" }: {
  user: CurrentUser;
  children: ReactNode;
  activeNav?: "dashboard" | "settings" | "drafts";
}) {
  const isDemo = isDemoUserId(user.id);
  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/" aria-label="MailFlow home">
          <MailFlowMark className="size-9" />
          <span>MailFlow<span className={styles.brandDot}>.</span></span>
        </Link>
        <div className={styles.sidebarSearch}><SidebarCommandTrigger /></div>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navigation.map(({ href, icon: Icon, label, key }) => (
            <Link key={key} href={href} aria-current={activeNav === key ? "page" : undefined} className={cn(styles.navItem, activeNav === key && styles.navActive)}>
              <Icon size={18} strokeWidth={1.6} aria-hidden="true" /><span>{label}</span>
              {activeNav === key && <span className={styles.navDot} />}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarNote}>
          <Leaf size={22} strokeWidth={1.4} aria-hidden="true" />
          <p>A little less inbox.<br />A little more day.</p>
          <Link href="/lab">Make room for what matters <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
        <div className={styles.account}>
          <span className={styles.avatar}>{getInitials(user.email)}</span>
          <div className={styles.accountCopy}><p>{isDemo ? "Your demo space" : user.email}</p><span>{isDemo ? "Sample inbox" : `${user.plan} plan`}</span></div>
          <form action="/api/auth/logout" method="post"><button className={styles.signOut} name={USER_COOKIE_NAME} aria-label="Sign out" title="Sign out" type="submit"><LogOut size={17} aria-hidden="true" /></button></form>
        </div>
      </aside>
      <div className={styles.workspaceBody}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.mobileBrand}><MailFlowMark className="size-8" /><span>MailFlow.</span></Link>
          <span className={styles.breadcrumb}>Your space <span>/</span> <strong>{activeNav === "settings" ? "Settings" : "Inbox"}</strong></span>
          <HeaderCommandTrigger />
          <span className={styles.connectionLabel}><span />{isDemo ? "Demo space" : "Your workspace"}</span>
          <form className={styles.mobileLogout} action="/api/auth/logout" method="post"><button className={styles.signOut} aria-label="Sign out" type="submit"><LogOut size={17} aria-hidden="true" /></button></form>
        </header>
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          {navigation.map(({ href, icon: Icon, label, key }) => <Link key={key} href={href} aria-current={activeNav === key ? "page" : undefined} className={activeNav === key ? styles.mobileActive : undefined}><Icon size={17} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
        <main className={styles.main}>{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
