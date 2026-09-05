import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getErrorMessage, jsonError } from "@/backend/api";
import {
  UnauthorizedError,
  ensureUsageRow,
  getGmailConnection,
  getPlanLimits,
  isDemoUserId,
  incrementUsage,
  requireCurrentUser
} from "@/backend/db";
import {
  DEMO_ANALYZED_COOKIE_NAME,
  generateDemoReply,
  getDemoEmailById
} from "@/backend/demo";
import { createGmailDraft, getFreshAccessToken } from "@/backend/gmail";
import { generateReplyWithAI } from "@/backend/openai";
import { getSupabaseAdmin } from "@/backend/supabase";
import type { EmailRecord } from "@/lib/types";

const replyRequestSchema = z.discriminatedUnion("saveToGmail", [
  z.object({ saveToGmail: z.literal(false), draftText: z.undefined() }),
  z.object({
    saveToGmail: z.literal(true),
    draftText: z.string().max(20_000, "Keep your draft under 20,000 characters.")
      .refine((text) => text.trim().length > 0, "Write a reply before saving your draft.")
  })
]);

function isFlagged(email: EmailRecord) {
  return email.category === "Phishing" || email.category === "Spam" || (email.risk_score ?? 0) >= 7;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const rawBody: unknown = await request.json().catch(() => null);
    const parsed = replyRequestSchema.safeParse(
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? { saveToGmail: false, ...rawBody }
        : rawBody
    );
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid reply request.", 400);
    }
    const body = parsed.data;

    if (isDemoUserId(user.id)) {
      const email = getDemoEmailById(id, {
        analyzePending:
          request.cookies.get(DEMO_ANALYZED_COOKIE_NAME)?.value === "1"
      });

      if (!email) {
        return jsonError("Demo email not found.", 404);
      }

      if (body.saveToGmail && isFlagged(email)) {
        return jsonError("This message is flagged as suspicious. No reply draft is recommended.", 400);
      }

      if (!body.saveToGmail) {
        const usage = await ensureUsageRow(user.id);
        const limits = getPlanLimits(user.plan);
        if (usage.drafts_generated >= limits.draftsGenerated) {
          return jsonError("Monthly reply draft limit reached.", 402);
        }
      }

      const draftText = body.saveToGmail ? body.draftText : generateDemoReply(email);
      const shouldPersist = draftText !== "No reply recommended.";
      const gmailDraftId =
        body.saveToGmail && shouldPersist ? `demo-draft-${email.id}` : null;

      return NextResponse.json({
        draftText,
        gmailDraftId,
        draft: shouldPersist
          ? {
              id: `demo-app-draft-${email.id}`,
              user_id: user.id,
              email_id: email.id,
              draft_text: draftText,
              gmail_draft_id: gmailDraftId,
              created_at: new Date().toISOString()
            }
          : null,
        demo: true
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (emailError) {
      throw emailError;
    }
    if (!email) return jsonError("Email not found.", 404);

    if (body.saveToGmail && isFlagged(email as EmailRecord)) {
      return jsonError("This message is flagged as suspicious. No reply draft is recommended.", 400);
    }
    if (!body.saveToGmail) {
      const usage = await ensureUsageRow(user.id);
      const limits = getPlanLimits(user.plan);
      if (usage.drafts_generated >= limits.draftsGenerated) {
        return jsonError("Monthly reply draft limit reached.", 402);
      }
    }

    const draftText = body.saveToGmail ? body.draftText : await generateReplyWithAI(email as EmailRecord);
    const shouldPersist = draftText !== "No reply recommended.";
    let gmailDraftId: string | null = null;

    if (body.saveToGmail && shouldPersist) {
      const connection = await getGmailConnection(user.id);

      if (!connection) {
        return jsonError("Connect Gmail before saving drafts.", 400);
      }

      const accessToken = await getFreshAccessToken(connection);
      gmailDraftId = await createGmailDraft(
        accessToken,
        email as EmailRecord,
        draftText
      );
    }

    let draft = null;

    if (shouldPersist) {
      const { data, error } = await supabase
        .from("drafts")
        .insert({
          user_id: user.id,
          email_id: id,
          draft_text: draftText,
          gmail_draft_id: gmailDraftId
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      if (!body.saveToGmail) {
        await incrementUsage(user.id, { drafts_generated: 1 });
      }

      draft = data;
    }

    return NextResponse.json({
      draftText,
      gmailDraftId,
      draft
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(error.message, 401);
    }

    return jsonError(getErrorMessage(error), 500);
  }
}
