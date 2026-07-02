"use client";

import {
  ArrowRight,
  BadgeCheck,
  Brain,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileEdit,
  Gauge,
  Inbox,
  KeyRound,
  Lock,
  MailCheck,
  PenLine,
  Plug,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wand2
} from "lucide-react";
import { MotionConfig, motion, type Variants } from "motion/react";
import Link from "next/link";

import { MailFlowMark } from "@/frontend/components/mailflow-mark";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } }
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

const reveal = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-12%" }
} as const;

const eyebrow =
  "inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.22em] text-primary";

const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const btnSecondary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const navLinks = [
  { href: "#solution", label: "Security" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" }
];

const credentials = [
  "Google OAuth 2.0",
  "Read-only Gmail scope",
  "Draft-only compose",
  "No gmail.send scope",
  "Server-side AI",
  "Tokens in Supabase",
  "Demo mode included"
];

const inboxItems = [
  {
    icon: ShieldCheck,
    title: "Invoice reminder from a new domain",
    meta: "Billing · High · Risk 7/10",
    dot: "bg-rose-500"
  },
  {
    icon: MailCheck,
    title: "Follow-up on Q3 launch timeline",
    meta: "Work · Urgent · Needs reply",
    dot: "bg-primary"
  },
  {
    icon: ScanSearch,
    title: "Weekly product digest",
    meta: "Newsletter · Low · No reply",
    dot: "bg-neutral-300"
  }
] as const;

const scopes = [
  { label: "openid", note: "Identity", denied: false },
  { label: "email", note: "Account email", denied: false },
  { label: "profile", note: "Display name", denied: false },
  { label: "gmail.readonly", note: "Read recent messages", denied: false },
  { label: "gmail.compose", note: "Create drafts only", denied: false },
  { label: "gmail.send", note: "Never requested", denied: true }
];

const features = [
  {
    icon: ScanSearch,
    title: "Risk-aware triage",
    body: "Categories, priority, and a 0–10 risk score flag suspicious senders and unusual asks before you reply."
  },
  {
    icon: Wand2,
    title: "Action-ready summaries",
    body: "Long threads collapse into the one or two sentences and bullet actions that actually matter."
  },
  {
    icon: PenLine,
    title: "Safe reply drafting",
    body: "Tone-matched replies you can copy, edit, or save to Gmail Drafts. Nothing is ever sent for you."
  },
  {
    icon: Gauge,
    title: "Usage tracking",
    body: "Free-plan caps for analyses and drafts stay visible in-app — no surprise overages or quiet quota burns."
  },
  {
    icon: Inbox,
    title: "Demo mode included",
    body: "Explore the full UI with realistic sample emails before connecting a real Gmail account."
  },
  {
    icon: BadgeCheck,
    title: "Pro-ready",
    body: "Lift limits with a Stripe-ready Pro tier when you outgrow the generous free plan."
  }
];

const steps = [
  {
    number: "01",
    icon: Plug,
    title: "Connect your Gmail",
    body: "Sign in with Google. MailFlow requests read-only inbox access and draft creation — never send."
  },
  {
    number: "02",
    icon: Brain,
    title: "AI triages your unread",
    body: "Each message gets a category, priority, risk score, summary, and concrete action items."
  },
  {
    number: "03",
    icon: PenLine,
    title: "Review, copy, or save",
    body: "Generate a reply, edit it, then copy it or save it as a Gmail draft. You stay in control."
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    highlight: false,
    description: "Triage one Gmail account with generous monthly limits.",
    cta: { label: "Start free", href: "/connect" },
    features: [
      "1 Gmail account",
      "100 AI analyses / month",
      "20 saved drafts / month",
      "Risk + priority scoring",
      "Demo inbox included"
    ]
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "per month",
    highlight: true,
    description: "For people who live in their inbox and want bigger limits.",
    cta: { label: "Upgrade in app", href: "/connect" },
    features: [
      "Higher monthly analysis limit",
      "Higher saved-draft limit",
      "Priority OpenAI model",
      "Stripe billing (Stripe-ready)",
      "Everything in Free"
    ]
  }
];

const metrics = [
  { value: "25", label: "Unread fetched per run" },
  { value: "0", label: "Send scopes requested" },
  { value: "<10s", label: "From inbox to triaged" }
];

const faqs = [
  {
    q: "Can MailFlow send email on my behalf?",
    a: "No. MailFlow never requests the gmail.send scope. Replies are saved as Gmail Drafts or copied to your clipboard — you decide when to hit send."
  },
  {
    q: "What does the AI actually see?",
    a: "Only the recent unread messages you ask MailFlow to fetch (up to 25 per run). Analysis happens server-side, and nothing is sent to OpenAI from the browser."
  },
  {
    q: "Can I try it without connecting Gmail?",
    a: "Yes. Demo mode loads realistic sample emails with simulated analysis and draft saves — no Supabase, OpenAI, or Google credentials required."
  },
  {
    q: "Will my AI usage cost me anything?",
    a: "The free plan covers 100 analyses and 20 drafts a month. Usage is visible in the settings page so you never get surprised."
  }
];

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="mf-light min-h-screen bg-white font-[family-name:var(--font-sans)] text-neutral-900">
        {/* Nav */}
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <Link className="flex items-center gap-3" href="/">
              <MailFlowMark className="size-9" />
              <span>
                <span className="block text-sm font-semibold leading-4 text-neutral-900">
                  MailFlow
                </span>
                <span className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  AI Gmail assistant
                </span>
              </span>
            </Link>
            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 md:flex"
            >
              {navLinks.map((link) => (
                <Link
                  className="rounded-full px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 sm:inline-flex"
                href="/api/demo/start"
              >
                Try demo
              </Link>
              <Link
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                href="/connect"
              >
                Connect Gmail
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="mf-hero-grid pointer-events-none absolute inset-0"
          />
          <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-20 text-center lg:pb-24 lg:pt-28">
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="mx-auto flex max-w-3xl flex-col items-center"
            >
              <motion.span variants={item} className={eyebrow}>
                <Sparkles className="size-3.5" aria-hidden="true" />
                Gmail triage without auto-send
              </motion.span>
              <motion.h1
                variants={item}
                id="hero-heading"
                className="mf-display mt-6 text-5xl leading-[1.02] text-neutral-900 sm:text-6xl lg:text-7xl"
              >
                Get to inbox calm
                <br />
                before your coffee.
              </motion.h1>
              <motion.p
                variants={item}
                className="mt-6 max-w-2xl text-balance text-lg leading-8 text-neutral-500"
              >
                An AI-powered Gmail assistant that reads recent unread mail,
                highlights risk, summarizes what matters, and drafts safe
                replies for review. Nothing leaves your account without your tap.
              </motion.p>
              <motion.div
                variants={item}
                className="mt-9 flex flex-wrap items-center justify-center gap-3"
              >
                <Link className={btnPrimary} href="/connect">
                  Start with Gmail
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link className={btnSecondary} href="/api/demo/start">
                  Try demo inbox
                </Link>
              </motion.div>
              <motion.p
                variants={item}
                className="mt-5 flex items-center gap-2 text-xs text-neutral-400"
              >
                <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                Read-only Gmail access. We never ask for the send scope.
              </motion.p>
            </motion.div>

            {/* Product visual */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-[0_40px_80px_-48px_rgb(24_24_27/0.25)]"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-primary">
                    Live inbox model
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    Unread analysis
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
                  <span className="size-1.5 rounded-full bg-rose-500" />3 suspicious
                </span>
              </div>
              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_15rem]">
                <div className="grid gap-3">
                  {inboxItems.map((row) => (
                    <div
                      className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 transition-colors hover:bg-neutral-50"
                      key={row.title}
                    >
                      <span className="relative grid size-10 place-items-center overflow-hidden rounded-lg border border-neutral-200 bg-white">
                        <span
                          className={`absolute left-0 top-0 h-full w-1 ${row.dot}`}
                        />
                        <row.icon
                          className="size-4 text-neutral-600"
                          aria-hidden="true"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {row.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-neutral-400">
                          {row.meta}
                        </p>
                      </div>
                      <Sparkles className="size-4 text-primary" aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                      <Gauge className="size-4 text-primary" aria-hidden="true" />
                      Flow health
                    </div>
                    <div className="mt-4 flex h-20 items-end gap-1.5">
                      {[42, 66, 54, 84, 62, 92, 74].map((h, i) => (
                        <span
                          className="flex-1 rounded-t bg-primary/70"
                          key={`${h}-${i}`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs leading-5 text-neutral-500">
                    <Sparkles
                      className="mb-1.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    Recommended: verify the sender domain before responding.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust ticker */}
        <section
          aria-label="Trust signals"
          className="border-y border-neutral-200 bg-neutral-50/60"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-8">
            <p className="text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Built on principled defaults
            </p>
            <div className="mf-marquee-mask overflow-hidden">
              <div className="mf-marquee-track gap-3">
                {[...credentials, ...credentials].map((label, i) => (
                  <span
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600"
                    key={`${label}-${i}`}
                  >
                    <span className="size-1.5 rounded-full bg-primary/70" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Solution / Security */}
        <section
          aria-labelledby="solution-heading"
          className="border-b border-neutral-200"
          id="solution"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
            <motion.div {...reveal} variants={fadeUp}>
              <span className={eyebrow}>
                <Lock className="size-3.5" aria-hidden="true" />
                Security model
              </span>
              <h2
                id="solution-heading"
                className="mf-display mt-5 text-4xl text-neutral-900 sm:text-5xl"
              >
                You hold the send button.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-neutral-500">
                MailFlow is opinionated about what it does <em>not</em> do. The
                OAuth scopes, the data path, and the defaults are all set so the
                AI never pushes an email out of your account on its own.
              </p>
              <ul className="mt-8 grid gap-3">
                {[
                  "No gmail.send scope is ever requested — replies live in Gmail Drafts until you press send.",
                  "Read scope is gmail.readonly, limited to the messages you choose to fetch.",
                  "Gmail tokens are stored in Supabase, encrypted at rest in production.",
                  "OpenAI is called server-side; your raw inbox never reaches the browser bundle."
                ].map((point) => (
                  <li className="flex items-start gap-3 text-sm leading-6" key={point}>
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-neutral-600">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              {...reveal}
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-6"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <KeyRound className="size-4 text-primary" aria-hidden="true" />
                OAuth scopes requested
              </div>
              <div className="mt-5 grid gap-2.5">
                {scopes.map((scope) => (
                  <div
                    className={
                      scope.denied
                        ? "flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5"
                        : "flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5"
                    }
                    key={scope.label}
                  >
                    <span
                      className={
                        scope.denied
                          ? "font-[family-name:var(--font-mono)] text-xs text-rose-500 line-through"
                          : "font-[family-name:var(--font-mono)] text-xs text-neutral-900"
                      }
                    >
                      {scope.label}
                    </span>
                    <span
                      className={
                        scope.denied
                          ? "text-xs font-medium text-rose-500"
                          : "text-xs text-neutral-400"
                      }
                    >
                      {scope.note}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section
          aria-labelledby="features-heading"
          className="border-b border-neutral-200"
          id="features"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
            <motion.div
              {...reveal}
              variants={fadeUp}
              className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <div className="max-w-2xl">
                <span className={eyebrow}>
                  <Wand2 className="size-3.5" aria-hidden="true" />
                  What you get
                </span>
                <h2
                  id="features-heading"
                  className="mf-display mt-5 text-4xl text-neutral-900 sm:text-5xl"
                >
                  Built for triage, not autopilot.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-neutral-500">
                  Every feature is designed so you stay the one pressing send.
                </p>
              </div>
              <Link
                className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                href="/connect"
              >
                Try it on your inbox
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </motion.div>
            <motion.ul
              {...reveal}
              variants={stagger}
              className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature) => (
                <motion.li
                  variants={item}
                  className="group flex flex-col bg-white p-6 transition-colors hover:bg-neutral-50"
                  key={feature.title}
                >
                  <span className="grid size-10 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-primary transition-colors group-hover:border-primary/30">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {feature.body}
                  </p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* How it works */}
        <section
          aria-labelledby="how-heading"
          className="border-b border-neutral-200 bg-neutral-50/60"
          id="how"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
            <motion.div
              {...reveal}
              variants={fadeUp}
              className="mx-auto max-w-2xl text-center"
            >
              <span className={eyebrow}>
                <Plug className="size-3.5" aria-hidden="true" />
                How it works
              </span>
              <h2
                id="how-heading"
                className="mf-display mt-5 text-4xl text-neutral-900 sm:text-5xl"
              >
                Three steps to a quieter inbox.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-500">
                From OAuth to draft in under a minute. No background sending, no
                scope creep, no surprises.
              </p>
            </motion.div>
            <motion.ol
              {...reveal}
              variants={stagger}
              className="relative mt-14 grid gap-4 sm:grid-cols-3"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-[16%] top-9 hidden border-t border-dashed border-neutral-300 sm:block"
              />
              {steps.map((step) => (
                <motion.li
                  variants={item}
                  className="relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-6"
                  key={step.number}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-primary">
                      <step.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-neutral-300">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {step.body}
                  </p>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* Pricing */}
        <section
          aria-labelledby="pricing-heading"
          className="border-b border-neutral-200"
          id="pricing"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
            <motion.div
              {...reveal}
              variants={fadeUp}
              className="mx-auto max-w-2xl text-center"
            >
              <span className={eyebrow}>
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Pricing
              </span>
              <h2
                id="pricing-heading"
                className="mf-display mt-5 text-4xl text-neutral-900 sm:text-5xl"
              >
                Start free. Upgrade when it pays for itself.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-500">
                Limits are visible in the dashboard so you always know where you
                stand.
              </p>
            </motion.div>
            <motion.div
              {...reveal}
              variants={stagger}
              className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2"
            >
              {plans.map((plan) => (
                <motion.div
                  variants={item}
                  className={
                    plan.highlight
                      ? "relative rounded-2xl border border-neutral-900 bg-white p-7 shadow-[0_30px_60px_-44px_rgb(24_24_27/0.3)]"
                      : "relative rounded-2xl border border-neutral-200 bg-white p-7"
                  }
                  key={plan.name}
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 right-6 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
                      Recommended
                    </span>
                  ) : null}
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {plan.name}
                    </h3>
                    <div className="text-right">
                      <span className="text-3xl font-semibold tabular-nums text-neutral-900">
                        {plan.price}
                      </span>
                      <span className="ml-1 text-xs text-neutral-400">
                        {plan.cadence}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    {plan.description}
                  </p>
                  <ul className="mt-6 grid gap-2.5">
                    {plan.features.map((feat) => (
                      <li
                        className="flex items-start gap-2 text-sm leading-6 text-neutral-600"
                        key={feat}
                      >
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    className={`mt-7 w-full ${
                      plan.highlight ? btnPrimary : btnSecondary
                    }`}
                    href={plan.cta.href}
                  >
                    {plan.cta.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Metrics band */}
        <section aria-label="Product metrics" className="border-b border-neutral-200 bg-neutral-50/60">
          <motion.dl
            {...reveal}
            variants={stagger}
            className="mx-auto grid w-full max-w-6xl gap-px overflow-hidden border-x border-neutral-200 bg-neutral-200 px-0 sm:grid-cols-3"
          >
            {metrics.map((metric) => (
              <motion.div
                variants={item}
                className="flex flex-col items-center gap-1 bg-neutral-50 px-6 py-12 text-center"
                key={metric.label}
              >
                <dt className="sr-only">{metric.label}</dt>
                <dd className="mf-display text-5xl tabular-nums text-neutral-900">
                  {metric.value}
                </dd>
                <p className="text-sm text-neutral-500">{metric.label}</p>
              </motion.div>
            ))}
          </motion.dl>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq-heading"
          className="border-b border-neutral-200"
          id="faq"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:py-28">
            <motion.div {...reveal} variants={fadeUp}>
              <span className={eyebrow}>
                <Eye className="size-3.5" aria-hidden="true" />
                FAQ
              </span>
              <h2
                id="faq-heading"
                className="mf-display mt-5 text-4xl text-neutral-900 sm:text-5xl"
              >
                Answers before you connect.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-neutral-500">
                If something here is unclear, demo mode is the fastest way to see
                what MailFlow does with email — without giving it any.
              </p>
              <Link className={`mt-6 ${btnSecondary}`} href="/api/demo/start">
                <Inbox className="size-4" aria-hidden="true" />
                Open the demo inbox
              </Link>
            </motion.div>
            <motion.dl {...reveal} variants={stagger} className="grid gap-3">
              {faqs.map((faq) => (
                <motion.div
                  variants={item}
                  className="rounded-2xl border border-neutral-200 bg-white p-5"
                  key={faq.q}
                >
                  <dt className="text-sm font-semibold text-neutral-900">
                    {faq.q}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-neutral-500">
                    {faq.a}
                  </dd>
                </motion.div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* Closing CTA */}
        <section aria-labelledby="cta-heading" className="border-b border-neutral-200">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-24">
            <motion.div
              {...reveal}
              variants={fadeUp}
              className="grid gap-8 rounded-3xl border border-neutral-200 bg-neutral-50/70 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-12"
            >
              <div>
                <span className={eyebrow}>
                  <FileEdit className="size-3.5" aria-hidden="true" />
                  Ready when you are
                </span>
                <h2
                  id="cta-heading"
                  className="mf-display mt-5 text-3xl text-neutral-900 sm:text-4xl"
                >
                  Hand your inbox a calmer Monday.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
                  Connect Gmail with read-only access, or kick the tires with the
                  demo inbox first. Either way, send stays in your hands.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end lg:flex-col">
                <Link className={btnPrimary} href="/connect">
                  Connect Gmail
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link className={btnSecondary} href="/api/demo/start">
                  Try demo first
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <MailFlowMark className="size-8" />
              <div>
                <p className="text-sm font-semibold leading-4 text-neutral-900">
                  MailFlow
                </p>
                <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  AI Gmail assistant · MVP
                </p>
              </div>
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500"
            >
              <Link className="transition-colors hover:text-neutral-900" href="#solution">
                Security
              </Link>
              <Link className="transition-colors hover:text-neutral-900" href="#features">
                Features
              </Link>
              <Link className="transition-colors hover:text-neutral-900" href="#pricing">
                Pricing
              </Link>
              <Link className="transition-colors hover:text-neutral-900" href="#faq">
                FAQ
              </Link>
              <Link className="transition-colors hover:text-neutral-900" href="/connect">
                Connect Gmail
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </MotionConfig>
  );
}
