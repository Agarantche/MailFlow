import { NextRequest, NextResponse } from "next/server";

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      saveToGmail?: boolean;
    };

    if (isDemoUserId(user.id)) {
      const email = getDemoEmailById(id, {
        analyzePending:
          request.cookies.get(DEMO_ANALYZED_COOKIE_NAME)?.value === "1"
      });

      if (!email) {
        return jsonError("Demo email not found.", 404);
      }

      const usage = await ensureUsageRow(user.id);
      const limits = getPlanLimits(user.plan);

      if (usage.drafts_generated >= limits.draftsGenerated) {
        return jsonError("Monthly reply draft limit reached.", 402);
      }

      const draftText = generateDemoReply(email);
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
      .single();

    if (emailError) {
      throw emailError;
    }

    const usage = await ensureUsageRow(user.id);
    const limits = getPlanLimits(user.plan);

    if (usage.drafts_generated >= limits.draftsGenerated) {
      return jsonError("Monthly reply draft limit reached.", 402);
    }

    const draftText = await generateReplyWithAI(email as EmailRecord);
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

      await incrementUsage(user.id, {
        drafts_generated: 1
      });

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
