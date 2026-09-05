"use client";

import { Copy, FilePlus2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";

export function ReplyComposer({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [savedText, setSavedText] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function runAction(saveToGmail = false) {
    if (isLoading || (saveToGmail && !draft.trim())) return;
    setIsLoading(true);
    setMessage(saveToGmail ? "Creating Gmail draft..." : "Generating reply...");

    let response: Response;

    try {
      response = await fetch(`/api/emails/${emailId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(saveToGmail ? { saveToGmail: true, draftText: draft } : { saveToGmail: false })
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
      setMessage(payload.error ?? (saveToGmail ? "Could not save your draft." : "Could not generate reply."));
      return;
    }

    setDraft(payload.draftText ?? "");
    setSavedText(payload.gmailDraftId ? payload.draftText ?? null : null);
    setMessage(
      payload.demo && payload.gmailDraftId
        ? "Demo save simulated with your exact edited reply. No email was sent."
        : payload.demo
          ? "Demo reply generated. Review it before using it."
          : payload.gmailDraftId
            ? "Your reply was saved as a Gmail draft, with your edits intact."
            : "Reply generated. Review it before using it."
    );
    if (!payload.demo) router.refresh();
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
    <div className="mf-panel rounded-[14px] p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reply draft</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            MailFlow creates drafts only. You approve and send from Gmail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isLoading} onClick={() => runAction(false)}>
            <Sparkles className="size-4" aria-hidden="true" />
            {draft ? "Generate another" : "Generate a reply"}
          </Button>
          <Button
            disabled={isLoading || !draft.trim() || draft === "No reply recommended." || draft === savedText}
            onClick={() => runAction(true)}
            variant="secondary"
          >
            <FilePlus2 className="size-4" aria-hidden="true" />
            Save to Gmail
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
        aria-label="Reply draft"
        disabled={isLoading}
        maxLength={20000}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Start with a suggested reply, or write in your own words."
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
