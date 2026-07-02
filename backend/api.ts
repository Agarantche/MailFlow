import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message
    },
    {
      status
    }
  );
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
