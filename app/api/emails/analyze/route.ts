import { NextRequest, NextResponse } from "next/server";

import { getErrorMessage, jsonError } from "@/backend/api";
import {
  UnauthorizedError,
  ensureUsageRow,
  getPlanLimits,
  isDemoUserId,
  incrementUsage,
  requireCurrentUser
} from "@/backend/db";
import { DEMO_ANALYZED_COOKIE_NAME, getDemoEmails } from "@/backend/demo";
import { analyzeEmailWithAI } from "@/backend/openai";
import { getSupabaseAdmin } from "@/backend/supabase";
import type { EmailRecord } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => ({}))) as {
      emailId?: string;
    };

    if (isDemoUserId(user.id)) {
      const targets = body.emailId
        ? getDemoEmails().filter((email) => email.id === body.emailId)
        : getDemoEmails().filter((email) => !email.summary);

      const response = NextResponse.json({
        requested: targets.length,
        analyzed: targets.length,
        failures: [],
        demo: true
      });

      response.cookies.set(DEMO_ANALYZED_COOKIE_NAME, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/"
      });

      return response;
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .is("summary", null)
      .order("created_at", { ascending: false })
      .limit(25);

    if (body.emailId) {
      query = query.eq("id", body.emailId);
    }

    const { data: emails, error } = await query;

    if (error) {
      throw error;
    }

    const usage = await ensureUsageRow(user.id);
    const limits = getPlanLimits(user.plan);
    const remaining = limits.emailsAnalyzed - usage.emails_analyzed;

    if (remaining <= 0) {
      return jsonError("Monthly email analysis limit reached.", 402);
    }

    const targets = ((emails ?? []) as EmailRecord[]).slice(0, remaining);
    let analyzed = 0;
    const failures: Array<{ emailId: string; subject: string; error: string }> =
      [];

    for (const email of targets) {
      try {
        const analysis = await analyzeEmailWithAI(email);
        const { error: updateError } = await supabase
          .from("emails")
          .update({
            category: analysis.category,
            priority: analysis.priority,
            risk_score: analysis.risk_score,
            needs_reply: analysis.needs_reply,
            summary: analysis.summary,
            action_items: analysis.action_items,
            recommended_action: analysis.recommended_action
          })
          .eq("id", email.id)
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        analyzed += 1;
      } catch (error) {
        failures.push({
          emailId: email.id,
          subject: email.subject,
          error: getErrorMessage(error)
        });
      }
    }

    if (analyzed > 0) {
      await incrementUsage(user.id, {
        emails_analyzed: analyzed
      });
    }

    return NextResponse.json({
      requested: targets.length,
      analyzed,
      failures
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(error.message, 401);
    }

    return jsonError(getErrorMessage(error), 500);
  }
}
