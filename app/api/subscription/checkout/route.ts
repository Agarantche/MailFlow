import { NextResponse } from "next/server";

import { getErrorMessage, jsonError } from "@/backend/api";
import { UnauthorizedError, requireCurrentUser } from "@/backend/db";
import { optionalEnv } from "@/backend/env";

export async function POST() {
  try {
    await requireCurrentUser();

    return NextResponse.json({
      status: "placeholder",
      message:
        "Stripe checkout is ready to wire. Add Stripe keys and replace this placeholder with a Checkout Session.",
      priceId: optionalEnv("STRIPE_PRICE_ID_PRO") ?? null
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(error.message, 401);
    }

    return jsonError(getErrorMessage(error), 500);
  }
}
