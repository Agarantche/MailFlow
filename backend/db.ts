import { cookies } from "next/headers";

import { PLAN_LIMITS } from "@/lib/constants";
import {
  DEMO_ANALYZED_COOKIE_NAME,
  DEMO_COOKIE_NAME,
  DEMO_USER_ID,
  getDemoConnection,
  getDemoDrafts,
  getDemoEmailById,
  getDemoEmails,
  getDemoUsage,
  getDemoUser,
  isDemoModeEnabled,
  isDemoUserId
} from "@/backend/demo";
import { getOptionalSupabaseAdmin, getSupabaseAdmin } from "@/backend/supabase";
import type {
  CurrentUser,
  DraftRecord,
  EmailRecord,
  GmailConnection,
  Plan,
  Usage
} from "@/lib/types";

export const USER_COOKIE_NAME = "mailflow_user_id";
export const OAUTH_STATE_COOKIE_NAME = "mailflow_oauth_state";

export class UnauthorizedError extends Error {
  constructor() {
    super("Connect Gmail to continue.");
    this.name = "UnauthorizedError";
  }
}

export function getBillingCycle(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan];
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const isDemoCookie = cookieStore.get(DEMO_COOKIE_NAME)?.value === "1";

  if (isDemoCookie || isDemoModeEnabled()) {
    return getDemoUser();
  }

  const supabase = getOptionalSupabaseAdmin();

  if (!supabase) {
    return getDemoUser();
  }

  const userId = cookieStore.get(USER_COOKIE_NAME)?.value;

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as CurrentUser | null) ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export async function ensureUsageRow(userId: string) {
  if (isDemoUserId(userId)) {
    return getDemoUsage();
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .lte("billing_cycle_start", now)
    .gt("billing_cycle_end", now)
    .order("billing_cycle_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing as Usage;
  }

  const cycle = getBillingCycle();
  const { data, error } = await supabase
    .from("usage")
    .insert({
      user_id: userId,
      emails_analyzed: 0,
      drafts_generated: 0,
      billing_cycle_start: cycle.start,
      billing_cycle_end: cycle.end
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Usage;
}

export async function incrementUsage(
  userId: string,
  increments: Partial<Pick<Usage, "emails_analyzed" | "drafts_generated">>
) {
  if (isDemoUserId(userId)) {
    const usage = getDemoUsage();

    return {
      ...usage,
      emails_analyzed: usage.emails_analyzed + (increments.emails_analyzed ?? 0),
      drafts_generated:
        usage.drafts_generated + (increments.drafts_generated ?? 0)
    };
  }

  const supabase = getSupabaseAdmin();
  const usage = await ensureUsageRow(userId);

  const { data, error } = await supabase
    .from("usage")
    .update({
      emails_analyzed:
        usage.emails_analyzed + (increments.emails_analyzed ?? 0),
      drafts_generated:
        usage.drafts_generated + (increments.drafts_generated ?? 0)
    })
    .eq("id", usage.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Usage;
}

export async function getGmailConnection(userId: string) {
  if (isDemoUserId(userId)) {
    return getDemoConnection();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GmailConnection | null) ?? null;
}

export async function getDashboardEmails(userId: string) {
  if (isDemoUserId(userId)) {
    const cookieStore = await cookies();

    return getDemoEmails({
      analyzePending:
        cookieStore.get(DEMO_ANALYZED_COOKIE_NAME)?.value === "1"
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []) as EmailRecord[];
}

export async function getEmailWithDrafts(userId: string, emailId: string) {
  if (isDemoUserId(userId)) {
    const cookieStore = await cookies();
    const email = getDemoEmailById(emailId, {
      analyzePending:
        cookieStore.get(DEMO_ANALYZED_COOKIE_NAME)?.value === "1"
    });

    return {
      email,
      drafts: email ? getDemoDrafts(email.id) : []
    };
  }

  const supabase = getSupabaseAdmin();
  const [{ data: email, error }, { data: drafts, error: draftsError }] =
    await Promise.all([
      supabase
        .from("emails")
        .select("*")
        .eq("id", emailId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("drafts")
        .select("*")
        .eq("email_id", emailId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    ]);

  if (error) {
    throw error;
  }

  if (draftsError) {
    throw draftsError;
  }

  return {
    email: (email as EmailRecord | null) ?? null,
    drafts: (drafts ?? []) as DraftRecord[]
  };
}

export { DEMO_USER_ID, isDemoUserId };
