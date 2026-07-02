"use client";

import { RefreshCcw, ScanSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/frontend/components/ui/button";

type ActionState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function DashboardActions() {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({
    status: "idle",
    message: ""
  });

  async function runAction(endpoint: string, successPrefix: string) {
    setState({
      status: "loading",
      message: "Working..."
    });

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "POST"
      });
    } catch {
      setState({
        status: "error",
        message: "Network error. Check your connection and try again."
      });
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      fetched?: number;
      analyzed?: number;
      failures?: Array<unknown>;
    };

    if (!response.ok) {
      setState({
        status: "error",
        message: payload.error ?? "Request failed."
      });
      return;
    }

    setState({
      status: "success",
      message:
        endpoint.includes("fetch")
          ? `${successPrefix}: ${payload.fetched ?? 0}`
          : `${successPrefix}: ${payload.analyzed ?? 0}${
              payload.failures?.length
                ? `, ${payload.failures.length} failed`
                : ""
            }`
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={state.status === "loading"}
          onClick={() => runAction("/api/emails/fetch", "Fetched unread emails")}
        >
          <RefreshCcw className="size-4" aria-hidden="true" />
          Fetch unread
        </Button>
        <Button
          disabled={state.status === "loading"}
          onClick={() =>
            runAction("/api/emails/analyze", "Analyzed messages")
          }
          variant="secondary"
        >
          <ScanSearch className="size-4" aria-hidden="true" />
          Analyze inbox
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-rose-700"
              : "text-sm text-muted-foreground"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
