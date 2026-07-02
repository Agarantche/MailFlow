"use client";

import { Copy, FilePlus2, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";

export function ReplyComposer({ emailId }: { emailId: string }) {
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate(saveToGmail = false) {
    setIsLoading(true);
    setMessage(saveToGmail ? "Creating Gmail draft..." : "Generating reply...");

    let response: Response;

    try {
      response = await fetch(`/api/emails/${emailId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ saveToGmail })
      });
    } catch {
      setIsLoading(false);
      setMessage("Network error. Check your connection and try again.");
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      draftText?: string;
      gmailDraftId?: string | null;
      demo?: boolean;
    };

    setIsLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Could not generate reply.");
      return;
    }

    setDraft(payload.draftText ?? "");
    setMessage(
      payload.demo && payload.gmailDraftId
        ? "Demo reply generated and draft save simulated."
        : payload.demo
          ? "Demo reply generated. Review it before using it."
          : payload.gmailDraftId
            ? "Reply generated and saved as a Gmail draft."
            : "Reply generated. Review it before using it."
    );
  }

  async function copyDraft() {
    if (!draft) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draft);
      setMessage("Reply copied.");
    } catch {
      setMessage("Could not access the clipboard. Copy the text manually.");
    }
  }

  return (
    <div className="mf-panel rounded-md p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reply draft</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            MailFlow creates drafts only. You approve and send from Gmail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isLoading} onClick={() => generate(false)}>
            <Send className="size-4" aria-hidden="true" />
            Generate
          </Button>
          <Button
            disabled={isLoading}
            onClick={() => generate(true)}
            variant="secondary"
          >
            <FilePlus2 className="size-4" aria-hidden="true" />
            Save draft
          </Button>
          <Button
            disabled={!draft || isLoading}
            onClick={copyDraft}
            variant="outline"
          >
            <Copy className="size-4" aria-hidden="true" />
            Copy
          </Button>
        </div>
      </div>
      <Textarea
        className="mt-4"
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Generated reply will appear here."
        value={draft}
      />
      {message ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
