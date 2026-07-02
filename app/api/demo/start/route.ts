import { NextRequest, NextResponse } from "next/server";

import { DEMO_COOKIE_NAME } from "@/backend/demo";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set(DEMO_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });

  return response;
}
