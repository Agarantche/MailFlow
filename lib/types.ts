import type { CATEGORIES, PRIORITIES } from "@/lib/constants";

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Plan = "free" | "pro";

export type EmailAnalysis = {
  category: Category;
  priority: Priority;
  risk_score: number;
  needs_reply: boolean;
  summary: string;
  action_items: string[];
  recommended_action: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  google_id: string;
  plan: Plan;
  created_at: string;
};

export type Usage = {
  id: string;
  user_id: string;
  emails_analyzed: number;
  drafts_generated: number;
  billing_cycle_start: string;
  billing_cycle_end: string;
};

export type EmailRecord = {
  id: string;
  user_id: string;
  gmail_message_id: string;
  thread_id: string | null;
  sender: string;
  subject: string;
  body: string;
  category: Category | null;
  priority: Priority | null;
  risk_score: number | null;
  needs_reply: boolean | null;
  summary: string | null;
  action_items: string[] | null;
  recommended_action: string | null;
  created_at: string;
};

export type DraftRecord = {
  id: string;
  user_id: string;
  email_id: string;
  draft_text: string;
  gmail_draft_id: string | null;
  created_at: string;
};

export type GmailConnection = {
  id: string;
  user_id: string;
  email: string;
  google_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  created_at: string;
  updated_at: string;
};

export type GmailEmail = {
  gmailMessageId: string;
  threadId: string | null;
  sender: string;
  subject: string;
  body: string;
};
