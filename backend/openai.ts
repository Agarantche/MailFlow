import { z } from "zod";

import { CATEGORIES, PRIORITIES } from "@/lib/constants";
import { optionalEnv, requireEnv } from "@/backend/env";
import { ANALYSIS_PROMPT, REPLY_PROMPT } from "@/backend/prompts";
import type { EmailAnalysis, EmailRecord } from "@/lib/types";

const analysisSchema = z.object({
  category: z.enum(CATEGORIES).catch("Other"),
  priority: z.enum(PRIORITIES).catch("Low"),
  risk_score: z.coerce.number().min(0).max(10),
  needs_reply: z.coerce.boolean(),
  summary: z.string().min(1),
  action_items: z.array(z.string()).default([]),
  recommended_action: z.string().min(1)
});

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function analyzeEmailWithAI(
  email: Pick<EmailRecord, "sender" | "subject" | "body">
): Promise<EmailAnalysis> {
  const content = await createChatCompletion(
    [
      {
        role: "system",
        content: ANALYSIS_PROMPT
      },
      {
        role: "user",
        content: formatEmailForPrompt(email)
      }
    ],
    { type: "json_object" }
  );

  let json: unknown;

  try {
    json = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON for email analysis.");
  }

  const parsed = analysisSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error("OpenAI analysis did not match the expected schema.");
  }

  return parsed.data;
}

export async function generateReplyWithAI(
  email: Pick<
    EmailRecord,
    | "sender"
    | "subject"
    | "body"
    | "category"
    | "priority"
    | "risk_score"
    | "summary"
    | "recommended_action"
  >
) {
  if (
    email.category === "Phishing" ||
    email.category === "Spam" ||
    (email.risk_score ?? 0) >= 7
  ) {
    return "No reply recommended.";
  }

  return createChatCompletion([
    {
      role: "system",
      content: REPLY_PROMPT
    },
    {
      role: "user",
      content: formatEmailForPrompt(email)
    }
  ]);
}

async function createChatCompletion(
  messages: ChatMessage[],
  responseFormat?: { type: "json_object" }
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: optionalEnv("OPENAI_MODEL") ?? "gpt-4o-mini",
      temperature: 0.2,
      messages,
      response_format: responseFormat
    })
  });

  const payload = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "OpenAI request failed.");
  }

  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return content;
}

function formatEmailForPrompt(
  email: Pick<EmailRecord, "sender" | "subject" | "body"> &
    Partial<Pick<EmailRecord, "summary" | "recommended_action">>
) {
  const context =
    email.summary || email.recommended_action
      ? `\nKnown analysis:\nSummary: ${email.summary ?? "Not analyzed"}\nRecommended action: ${email.recommended_action ?? "Not analyzed"}\n`
      : "";

  return `From: ${email.sender}
Subject: ${email.subject}${context}
Body:
${email.body.slice(0, 12000)}`;
}
