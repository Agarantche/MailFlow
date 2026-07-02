import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { OAUTH_STATE_COOKIE_NAME } from "@/backend/db";
import { getGoogleOAuthUrl } from "@/backend/gmail";

export async function GET(request: NextRequest) {
  try {
    const state = randomUUID();
    const response = NextResponse.redirect(getGoogleOAuthUrl(state));

    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/"
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/connect?error=missing-google-config", request.url)
    );
  }
}
