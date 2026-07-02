import { NextRequest, NextResponse } from "next/server";

import {
  OAUTH_STATE_COOKIE_NAME,
  USER_COOKIE_NAME,
  ensureUsageRow
} from "@/backend/db";
import {
  exchangeCodeForTokens,
  fetchGoogleProfile,
  tokenExpiryFromNow
} from "@/backend/gmail";
import { getSupabaseAdmin } from "@/backend/supabase";
import type { CurrentUser } from "@/lib/types";

export async function GET(request: NextRequest) {
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get("code");
  const state = callbackUrl.searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/connect?error=oauth-state", request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleProfile(tokens.access_token);
    const supabase = getSupabaseAdmin();

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("*")
      .eq("google_id", profile.id)
      .maybeSingle();

    if (existingUserError) {
      throw existingUserError;
    }

    let user = existingUser as CurrentUser | null;

    if (user) {
      const { data, error } = await supabase
        .from("users")
        .update({
          email: profile.email
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      user = data as CurrentUser;
    } else {
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: profile.email,
          google_id: profile.id,
          plan: "free"
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      user = data as CurrentUser;
    }

    const { data: existingConnection, error: existingConnectionError } =
      await supabase
        .from("gmail_connections")
        .select("refresh_token")
        .eq("user_id", user.id)
        .eq("google_id", profile.id)
        .maybeSingle();

    if (existingConnectionError) {
      throw existingConnectionError;
    }

    const refreshToken =
      tokens.refresh_token ?? existingConnection?.refresh_token ?? null;

    if (!refreshToken) {
      throw new Error("Google did not return a refresh token.");
    }

    const { error: connectionError } = await supabase
      .from("gmail_connections")
      .upsert(
        {
          user_id: user.id,
          email: profile.email,
          google_id: profile.id,
          access_token: tokens.access_token,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiryFromNow(tokens.expires_in),
          scopes: tokens.scope ? tokens.scope.split(" ") : null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "user_id,google_id"
        }
      );

    if (connectionError) {
      throw connectionError;
    }

    await ensureUsageRow(user.id);

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(USER_COOKIE_NAME, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 60,
      path: "/"
    });
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return NextResponse.redirect(
      new URL("/connect?error=oauth-callback", request.url)
    );
  }
}
