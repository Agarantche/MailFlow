import { NextRequest, NextResponse } from "next/server";

import { DEMO_ANALYZED_COOKIE_NAME, DEMO_COOKIE_NAME } from "@/backend/demo";
import { USER_COOKIE_NAME } from "@/backend/db";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/connect", request.url), 303);

  response.cookies.delete(USER_COOKIE_NAME);
  response.cookies.delete(DEMO_COOKIE_NAME);
  response.cookies.delete(DEMO_ANALYZED_COOKIE_NAME);

  return response;
}
