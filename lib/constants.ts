export const CATEGORIES = [
  "Work",
  "Personal",
  "Billing",
  "Support",
  "Sales",
  "Newsletter",
  "Spam",
  "Phishing",
  "Other"
] as const;

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const FREE_PLAN_LIMITS = {
  emailsAnalyzed: 100,
  draftsGenerated: 20,
  gmailAccounts: 1
} as const;

export const PRO_PLAN_LIMITS = {
  emailsAnalyzed: 5000,
  draftsGenerated: 1000,
  gmailAccounts: 5
} as const;

export const PLAN_LIMITS = {
  free: FREE_PLAN_LIMITS,
  pro: PRO_PLAN_LIMITS
} as const;

export const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose"
] as const;

export const FREE_PLAN_COPY = [
  "100 email analyses/month",
  "20 reply drafts/month",
  "1 Gmail account"
];

export const PRO_PLAN_COPY = [
  "Higher analysis and draft limits",
  "Multiple Gmail accounts",
  "Priority workflows and automation-ready billing"
];
