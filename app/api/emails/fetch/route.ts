import { NextResponse } from "next/server";

import { getErrorMessage, jsonError } from "@/backend/api";
import {
  UnauthorizedError,
  getGmailConnection,
  isDemoUserId,
  requireCurrentUser
} from "@/backend/db";
import { getDemoEmails } from "@/backend/demo";
import { fetchUnreadEmails, getFreshAccessToken } from "@/backend/gmail";
import { getSupabaseAdmin } from "@/backend/supabase";

export async function POST() {
  try {
    const user = await requireCurrentUser();

    if (isDemoUserId(user.id)) {
      const emails = getDemoEmails();

      return NextResponse.json({
        fetched: emails.length,
        emails,
        demo: true
      });
    }

    const connection = await getGmailConnection(user.id);

    if (!connection) {
      return jsonError("Connect Gmail before fetching emails.", 400);
    }

    const accessToken = await getFreshAccessToken(connection);
    const unreadEmails = await fetchUnreadEmails(accessToken, 25);

    if (!unreadEmails.length) {
      return NextResponse.json({
        fetched: 0,
        emails: []
      });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("emails")
      .upsert(
        unreadEmails.map((email) => ({
          user_id: user.id,
          gmail_message_id: email.gmailMessageId,
          thread_id: email.threadId,
          sender: email.sender,
          subject: email.subject,
          body: email.body
        })),
        {
          onConflict: "user_id,gmail_message_id"
        }
      )
      .select("*");

    if (error) {
      throw error;
    }

    return NextResponse.json({
      fetched: unreadEmails.length,
      emails: data ?? []
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(error.message, 401);
    }

    return jsonError(getErrorMessage(error), 500);
  }
}
