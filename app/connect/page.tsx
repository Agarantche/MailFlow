import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MailFlowMark } from "@/frontend/components/mailflow-mark";
import { Alert } from "@/frontend/components/ui/alert";
import { buttonVariants } from "@/frontend/components/ui/button";
import { hasGoogleEnv, hasSupabaseEnv } from "@/backend/env";

export default async function ConnectPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const isConfigured = hasGoogleEnv() && hasSupabaseEnv();

  return (
    <main className="mf-shell-grid mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <Link className="flex items-center gap-3 font-semibold" href="/">
          <MailFlowMark className="size-10" />
          <span>MailFlow</span>
        </Link>
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/"
        >
          Home
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <p className="mf-mono text-[11px] text-primary">OAuth handoff</p>
          <h1 className="mf-display mt-3 text-5xl leading-none tracking-normal">
            Connect Gmail
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            MailFlow requests read access and Gmail draft creation support only.
            It does not request the Gmail send scope, and it never sends mail.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              aria-disabled={!isConfigured}
              className={buttonVariants({
                className: !isConfigured ? "pointer-events-none opacity-50" : ""
              })}
              href="/api/auth/google/start"
            >
              <Mail className="size-4" aria-hidden="true" />
              Continue with Google
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/api/demo/start"
            >
              Try demo inbox
            </Link>
          </div>

          {params.error ? (
            <Alert className="mt-6 border-rose-700/25 bg-rose-400/10 text-rose-700">
              <AlertCircle className="mr-2 inline size-4" aria-hidden="true" />
              Connection failed. Check OAuth credentials and callback settings.
            </Alert>
          ) : null}

          {!isConfigured ? (
            <Alert className="mt-6">
              Add Supabase and Google OAuth environment variables before
              connecting Gmail.
            </Alert>
          ) : null}
        </div>

        <div className="mf-panel overflow-hidden rounded-lg">
          <div className="relative h-44">
            <Image
              alt="Monstera plant in a bright room"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 36rem, 100vw"
              src="https://images.unsplash.com/photo-1545241047-6083a3684587?w=1200&q=75"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#fffdf8]/80 to-transparent"
            />
          </div>
          <div className="p-5">
          <h2 className="text-lg font-semibold">Requested capabilities</h2>
          <div className="mt-5 grid gap-4">
            {[
              "Read recent unread messages for analysis",
              "Create Gmail drafts when you click Save draft",
              "Store summaries, recommendations, and usage counts in Supabase"
            ].map((item) => (
              <div
                className="flex gap-3 rounded-md border border-border bg-white/70 p-3"
                key={item}
              >
                <CheckCircle2
                  className="mt-0.5 size-5 text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm leading-6">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3 rounded-md border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-900">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            Messages flagged as suspicious return no recommended reply.
          </div>
          </div>
        </div>
      </section>
    </main>
  );
}
