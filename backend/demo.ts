import type {
  CurrentUser,
  DraftRecord,
  EmailRecord,
  GmailConnection,
  Usage
} from "@/lib/types";

export const DEMO_COOKIE_NAME = "mailflow_demo";
export const DEMO_ANALYZED_COOKIE_NAME = "mailflow_demo_analyzed";
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export function isDemoModeEnabled() {
  return process.env.MAILFLOW_DEMO_MODE === "true";
}

export function isDemoUserId(userId: string) {
  return userId === DEMO_USER_ID;
}

export function getDemoUser(): CurrentUser {
  return {
    id: DEMO_USER_ID,
    email: "demo@mailflow.local",
    google_id: "demo-google-user",
    plan: "free",
    created_at: daysAgo(19)
  };
}

export function getDemoConnection(): GmailConnection {
  return {
    id: "demo-gmail-connection",
    user_id: DEMO_USER_ID,
    email: "demo.inbox@gmail.com",
    google_id: "demo-google-user",
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    token_expires_at: hoursFromNow(1),
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose"
    ],
    created_at: daysAgo(18),
    updated_at: hoursAgo(2)
  };
}

export function getDemoUsage(): Usage {
  return {
    id: "demo-usage",
    user_id: DEMO_USER_ID,
    emails_analyzed: 37,
    drafts_generated: 8,
    billing_cycle_start: cycleStart(),
    billing_cycle_end: cycleEnd()
  };
}

export function getDemoEmails(
  options: { analyzePending?: boolean } = {}
): EmailRecord[] {
  const emails: EmailRecord[] = [
    {
      id: "demo-email-exec-launch",
      user_id: DEMO_USER_ID,
      gmail_message_id: "demo-gmail-001",
      thread_id: "demo-thread-launch",
      sender: "Maya Chen <maya@northstar.example>",
      subject: "Final review for launch notes",
      body:
        "Hi Adam,\n\nCould you review the launch notes before tomorrow morning? I mainly need a quick check on the timeline, customer quotes, and the beta-program language. If anything looks off, send edits by 9 AM so I can fold them into the exec packet.\n\nThanks,\nMaya",
      category: "Work",
      priority: "Urgent",
      risk_score: 1,
      needs_reply: true,
      summary:
        "Maya needs a final review of launch notes before tomorrow morning, with edits due by 9 AM.",
      action_items: [
        "Review timeline language",
        "Check customer quotes",
        "Send edits or approval before 9 AM"
      ],
      recommended_action:
        "Reply with whether you can review the notes and ask for the latest document link if needed.",
      created_at: hoursAgo(1)
    },
    {
      id: "demo-email-invoice-risk",
      user_id: DEMO_USER_ID,
      gmail_message_id: "demo-gmail-002",
      thread_id: "demo-thread-invoice",
      sender: "Accounts Team <billing@northstar-payments.example>",
      subject: "Past due invoice - action required",
      body:
        "Hello,\n\nYour invoice is now past due. Please use the attached payment link to avoid service interruption. We changed payment processors last week, so do not use the old portal.\n\nRegards,\nAccounts Team",
      category: "Phishing",
      priority: "High",
      risk_score: 8,
      needs_reply: false,
      summary:
        "The email requests payment through a changed processor and asks the recipient to avoid the old portal.",
      action_items: [
        "Do not use the payment link",
        "Verify the invoice through a known billing portal",
        "Report the message if the sender cannot be verified"
      ],
      recommended_action:
        "Do not reply. Verify billing status through a trusted channel.",
      created_at: hoursAgo(3)
    },
    {
      id: "demo-email-support",
      user_id: DEMO_USER_ID,
      gmail_message_id: "demo-gmail-003",
      thread_id: "demo-thread-support",
      sender: "Lena Ortiz <lena@acme.example>",
      subject: "Question about the onboarding checklist",
      body:
        "Hi,\n\nWe are almost ready to roll MailFlow out to the pilot team. Can you confirm whether the onboarding checklist supports shared inboxes yet? If not, what should our admins do for the first cohort?\n\nBest,\nLena",
      category: "Support",
      priority: "Medium",
      risk_score: 1,
      needs_reply: true,
      summary:
        "Lena asks whether shared inboxes are supported in onboarding and needs guidance for admins if they are not.",
      action_items: [
        "Confirm shared inbox support status",
        "Provide an admin workaround for the first cohort"
      ],
      recommended_action:
        "Reply with the current support status and a conservative admin setup recommendation.",
      created_at: hoursAgo(5)
    },
    {
      id: "demo-email-newsletter",
      user_id: DEMO_USER_ID,
      gmail_message_id: "demo-gmail-004",
      thread_id: "demo-thread-newsletter",
      sender: "Product Signals <digest@signals.example>",
      subject: "This week in AI productivity",
      body:
        "The latest digest covers AI agents in support queues, safer draft workflows, and new research on executive-assistant automation. Read the full issue for benchmarks and product teardown notes.",
      category: "Newsletter",
      priority: "Low",
      risk_score: 0,
      needs_reply: false,
      summary:
        "A weekly newsletter about AI productivity trends, agent workflows, and support automation.",
      action_items: [],
      recommended_action: "Archive or read later. No reply is needed.",
      created_at: hoursAgo(9)
    },
    {
      id: "demo-email-sales",
      user_id: DEMO_USER_ID,
      gmail_message_id: "demo-gmail-005",
      thread_id: "demo-thread-sales",
      sender: "Jordan Blake <jordan@rivetcrm.example>",
      subject: "Quick idea for your Gmail workflow",
      body:
        "Hi Adam,\n\nI noticed your team is building around Gmail workflows. We help teams route buyer emails into CRM with less manual work. Would a short intro next week be useful?\n\nJordan",
      category: "Sales",
      priority: "Low",
      risk_score: 2,
      needs_reply: true,
      summary:
        "Jordan pitches a CRM workflow tool and asks for a short intro next week.",
      action_items: ["Decide whether the CRM pitch is relevant"],
      recommended_action:
        "Reply only if the integration is currently relevant; otherwise decline politely.",
      created_at: hoursAgo(14)
    },
    {
      id: "demo-email-unanalyzed",
      user_id: DEMO_USER_ID,
      gmail_message_id: "demo-gmail-006",
      thread_id: "demo-thread-pending",
      sender: "Sam Patel <sam@northstar.example>",
      subject: "Can you sanity-check this renewal note?",
      body:
        "Could you sanity-check the renewal note before I send it? I want to make sure it sounds clear and does not overpromise implementation timing.",
      category: null,
      priority: null,
      risk_score: null,
      needs_reply: null,
      summary: null,
      action_items: [],
      recommended_action: null,
      created_at: hoursAgo(20)
    }
  ];

  if (!options.analyzePending) {
    return emails;
  }

  return emails.map((email) =>
    email.id === "demo-email-unanalyzed"
      ? {
          ...email,
          category: "Work",
          priority: "Medium",
          risk_score: 1,
          needs_reply: true,
          summary:
            "Sam wants a sanity check on a renewal note to avoid unclear wording or overpromising implementation timing.",
          action_items: [
            "Review the renewal note",
            "Flag any overcommitments around implementation timing"
          ],
          recommended_action:
            "Ask Sam to send the draft and offer to review for clarity and commitment risk."
        }
      : email
  );
}

export function getDemoEmailById(
  emailId: string,
  options: { analyzePending?: boolean } = {}
) {
  return getDemoEmails(options).find((email) => email.id === emailId) ?? null;
}

export function getDemoDrafts(emailId: string): DraftRecord[] {
  const email = getDemoEmailById(emailId);

  if (!email || email.id !== "demo-email-support") {
    return [];
  }

  return [
    {
      id: "demo-draft-support-001",
      user_id: DEMO_USER_ID,
      email_id: email.id,
      draft_text:
        "Hi Lena,\n\nThanks for checking. Shared inbox onboarding is not something I would treat as fully supported yet. For the first cohort, I would have admins connect individual pilot accounts and keep shared-inbox routing manual until we confirm the rollout path.\n\nBest,\nAdam",
      gmail_draft_id: null,
      created_at: hoursAgo(4)
    }
  ];
}

export function generateDemoReply(email: EmailRecord) {
  if (
    email.category === "Phishing" ||
    email.category === "Spam" ||
    (email.risk_score ?? 0) >= 7
  ) {
    return "No reply recommended.";
  }

  if (email.id === "demo-email-exec-launch") {
    return "Hi Maya,\n\nThanks for the heads up. Please send me the latest version of the launch notes and I can review the timeline, customer quotes, and beta-program language. I will flag anything that needs attention before the packet is finalized.\n\nBest,\nAdam";
  }

  if (email.id === "demo-email-support") {
    return "Hi Lena,\n\nThanks for checking. Shared inbox support is not something I would treat as confirmed yet. For the first cohort, I would recommend having admins connect individual pilot accounts and keeping shared-inbox routing manual until we validate the rollout path.\n\nBest,\nAdam";
  }

  if (email.id === "demo-email-sales") {
    return "Hi Jordan,\n\nThanks for reaching out. We are not evaluating additional CRM workflow tools right now, but I appreciate the note. If that changes, I will reach back out.\n\nBest,\nAdam";
  }

  return "Hi,\n\nThanks for the note. Could you send a bit more context so I can give you a useful answer?\n\nBest,\nAdam";
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function cycleStart() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}

function cycleEnd() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  ).toISOString();
}
