import { AlertCircle, ArrowLeft, ArrowRight, Check, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LeafScene } from "@/frontend/components/leaf-scene";
import { MailFlowMark } from "@/frontend/components/mailflow-mark";
import { Alert } from "@/frontend/components/ui/alert";
import { Button, buttonVariants } from "@/frontend/components/ui/button";
import styles from "@/frontend/components/app-workspace.module.css";
import { hasGoogleEnv, hasSupabaseEnv } from "@/backend/env";

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const isConfigured = hasGoogleEnv() && hasSupabaseEnv();
  return (
    <main className={styles.connect}>
      <header className={styles.connectNav}>
        <Link className={styles.brand} href="/" aria-label="MailFlow home"><MailFlowMark className="size-9" /><span>MailFlow.</span></Link>
        <Link href="/"><ArrowLeft size={14} aria-hidden="true" />Back home</Link>
      </header>
      <section className={styles.connectContent}>
        <div className={styles.connectHero}>
          <LeafScene variant="ambient" className={styles.connectScene} interactive={false} />
          <h1>A fresh start.<span>For your inbox.</span></h1>
          <p>Less to sift through. More room to think. Your calmer corner of the internet starts here.</p>
        </div>
        <div className={styles.connectCard}>
          <h2>Come on in.</h2>
          <p>Bring your Gmail inbox along, or take a quiet look around with our sample inbox.</p>
          <div className={styles.connectButtons}>
            {isConfigured ? <Link className={buttonVariants()} href="/api/auth/google/start"><Mail size={17} aria-hidden="true" />Continue with Google<ArrowRight size={16} aria-hidden="true" /></Link> : <Button disabled aria-describedby="connection-unavailable"><Mail size={17} aria-hidden="true" />Continue with Google</Button>}
            <Link className={buttonVariants({ variant: isConfigured ? "outline" : "default" })} href="/api/demo/start">Explore the demo<ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {!isConfigured && <p id="connection-unavailable" className={styles.connectionNotice}>Gmail connection isn’t available in this preview. The demo is ready to explore, with no account needed.</p>}
          {params.error && <Alert className="mt-5 flex gap-2 border-rose-200 bg-rose-50 text-rose-800"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>We couldn’t connect your account. Please try again, or explore the demo for now.</span></Alert>}
          <div className={styles.connectDivider}>
            <ul className={styles.permissionList}>
              <li><Check size={15} aria-hidden="true" /><span>Read unread messages and surface what matters.</span></li>
              <li><Check size={15} aria-hidden="true" /><span>Save summaries and suggested next steps in your workspace.</span></li>
              <li><ShieldCheck size={15} aria-hidden="true" /><span>Create reply drafts when you ask. You review and send them from Gmail.</span></li>
            </ul>
          </div>
        </div>
      </section>
      <footer className={styles.connectFooter}>A little less inbox. A little more life.</footer>
    </main>
  );
}
