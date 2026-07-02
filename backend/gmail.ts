import { GMAIL_SCOPES } from "@/lib/constants";
import { getAppUrl, getGoogleRedirectUri, requireEnv } from "@/backend/env";
import { getSupabaseAdmin } from "@/backend/supabase";
import type { EmailRecord, GmailConnection, GmailEmail } from "@/lib/types";

type TokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  id: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
};

type GmailHeader = {
  name: string;
  value: string;
};

type GmailMessagePart = {
  mimeType?: string;
  headers?: GmailHeader[];
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
};

type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  payload?: GmailMessagePart;
};

export function getGoogleOAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code"
    })
  });

  const payload = (await response.json()) as TokenResponse;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error_description ?? payload.error ?? "Google OAuth failed."
    );
  }

  return payload;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token"
    })
  });

  const payload = (await response.json()) as TokenResponse;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error_description ?? payload.error ?? "Could not refresh Gmail token."
    );
  }

  return payload;
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not fetch Google profile.");
  }

  return (await response.json()) as GoogleProfile;
}

export async function getFreshAccessToken(connection: GmailConnection) {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  const isFresh = expiresAt > Date.now() + 60_000;

  if (isFresh) {
    return connection.access_token;
  }

  if (!connection.refresh_token) {
    throw new Error("Gmail refresh token is missing. Reconnect Gmail.");
  }

  const tokens = await refreshAccessToken(connection.refresh_token);
  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { error } = await getSupabaseAdmin()
    .from("gmail_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? connection.refresh_token,
      token_expires_at: tokenExpiresAt,
      scopes: tokens.scope ? tokens.scope.split(" ") : connection.scopes,
      updated_at: new Date().toISOString()
    })
    .eq("id", connection.id);

  if (error) {
    throw error;
  }

  return tokens.access_token;
}

async function gmailFetch<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {}
) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    }
  );

  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gmail API request failed.");
  }

  return payload;
}

export async function fetchUnreadEmails(accessToken: string, limit = 25) {
  const list = await gmailFetch<{ messages?: Array<{ id: string }> }>(
    accessToken,
    `messages?${new URLSearchParams({
      maxResults: String(limit),
      q: "is:unread"
    }).toString()}`
  );

  if (!list.messages?.length) {
    return [];
  }

  const messages = await Promise.all(
    list.messages.map((message) =>
      gmailFetch<GmailMessage>(
        accessToken,
        `messages/${message.id}?${new URLSearchParams({
          format: "full"
        }).toString()}`
      )
    )
  );

  return messages.map(normalizeGmailMessage);
}

export async function createGmailDraft(
  accessToken: string,
  email: Pick<EmailRecord, "sender" | "subject" | "thread_id">,
  draftText: string
) {
  const subject = email.subject.toLowerCase().startsWith("re:")
    ? email.subject
    : `Re: ${email.subject}`;
  const raw = encodeMimeMessage({
    to: email.sender,
    subject,
    body: draftText
  });

  const draft = await gmailFetch<{ id: string }>(accessToken, "drafts", {
    method: "POST",
    body: JSON.stringify({
      message: {
        raw,
        threadId: email.thread_id ?? undefined
      }
    })
  });

  return draft.id;
}

export function tokenExpiryFromNow(expiresInSeconds?: number) {
  if (!expiresInSeconds) {
    return null;
  }

  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

export function getOAuthCallbackUrl() {
  return `${getAppUrl().replace(/\/$/, "")}/api/auth/google/callback`;
}

function normalizeGmailMessage(message: GmailMessage): GmailEmail {
  const headers = message.payload?.headers ?? [];

  return {
    gmailMessageId: message.id,
    threadId: message.threadId ?? null,
    sender: getHeader(headers, "from") ?? "Unknown sender",
    subject: getHeader(headers, "subject") ?? "(No subject)",
    body: extractBody(message.payload) || message.snippet || ""
  };
}

function getHeader(headers: GmailHeader[], name: string) {
  return headers.find((header) => header.name.toLowerCase() === name)?.value;
}

function extractBody(payload?: GmailMessagePart): string {
  if (!payload) {
    return "";
  }

  const parts = flattenParts(payload);
  const plainPart =
    parts.find((part) => part.mimeType === "text/plain" && part.body?.data) ??
    (payload.mimeType === "text/plain" ? payload : undefined);
  const htmlPart =
    parts.find((part) => part.mimeType === "text/html" && part.body?.data) ??
    (payload.mimeType === "text/html" ? payload : undefined);

  if (plainPart?.body?.data) {
    return decodeBase64Url(plainPart.body.data).trim();
  }

  if (htmlPart?.body?.data) {
    return stripHtml(decodeBase64Url(htmlPart.body.data)).trim();
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data).trim();
  }

  return "";
}

function flattenParts(part: GmailMessagePart): GmailMessagePart[] {
  return [part, ...(part.parts ?? []).flatMap(flattenParts)];
}

function decodeBase64Url(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64")
    .toString("utf8")
    .replace(/\u0000/g, "");
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function encodeMimeMessage({
  to,
  subject,
  body
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
