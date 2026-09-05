"use strict";
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node regression runner, matching the existing .cjs test scripts. */

// Exercise the route's real validation and branching without sending email,
// spending AI credits, or writing to the user's database.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { NextResponse } = require("next/server");

const filename = path.join(__dirname, "../app/api/emails/[id]/reply/route.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: filename
}).outputText;

function harness(options = {}) {
  const calls = { ai: 0, gmail: [], inserts: [], increments: [], database: 0 };
  const user = { id: options.demo ? "demo" : "owner", plan: "free" };
  const email = {
    id: "message", user_id: options.emailOwner ?? user.id, sender: "Maya <maya@example.test>",
    subject: "Review", body: "A sample email", category: options.category ?? "Work", risk_score: options.risk ?? 0
  };
  class UnauthorizedError extends Error {}
  const imports = {
    "next/server": { NextResponse },
    zod: require("zod"),
    "@/backend/api": {
      jsonError: (error, status = 400) => NextResponse.json({ error }, { status }),
      getErrorMessage: (error) => error.message
    },
    "@/backend/db": {
      UnauthorizedError,
      requireCurrentUser: async () => { if (options.unauthorized) throw new UnauthorizedError("Sign in."); return user; },
      isDemoUserId: (id) => id === "demo",
      ensureUsageRow: async () => ({ drafts_generated: options.usage ?? 0 }),
      getPlanLimits: () => ({ draftsGenerated: 20 }),
      getGmailConnection: async () => options.disconnected ? null : { user_id: user.id },
      incrementUsage: async (id, usage) => { calls.increments.push({ id, usage }); }
    },
    "@/backend/demo": {
      DEMO_ANALYZED_COOKIE_NAME: "analyzed",
      getDemoEmailById: (id) => id === email.id ? email : null,
      generateDemoReply: () => { calls.ai += 1; return "Generated sample reply."; }
    },
    "@/backend/gmail": {
      getFreshAccessToken: async () => "mock-token",
      createGmailDraft: async (token, record, draftText) => {
        calls.gmail.push({ token, emailId: record.id, draftText });
        return "gmail-draft";
      }
    },
    "@/backend/openai": {
      generateReplyWithAI: async () => { calls.ai += 1; return "Generated reply."; }
    },
    "@/backend/supabase": {
      getSupabaseAdmin: () => {
        calls.database += 1;
        return {
          from(table) {
            const filters = {};
            let inserted;
            return {
              select() { return this; },
              eq(key, value) { filters[key] = value; return this; },
              async maybeSingle() {
                assert.equal(table, "emails");
                // The fake store enforces the same ownership predicate as the query.
                return { data: filters.id === email.id && filters.user_id === email.user_id ? email : null, error: null };
              },
              insert(value) { assert.equal(table, "drafts"); inserted = value; calls.inserts.push(value); return this; },
              async single() { return { data: { id: "app-draft", ...inserted }, error: null }; }
            };
          }
        };
      }
    }
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)((name) => {
    if (!(name in imports)) throw new Error(`Unexpected route dependency: ${name}`);
    return imports[name];
  }, loaded, loaded.exports);
  return {
    calls,
    async invoke(body, id = "message", malformed = false) {
      const response = await loaded.exports.POST({
        json: async () => { if (malformed) throw new Error("Invalid JSON"); return body; },
        cookies: { get: () => undefined }
      }, { params: Promise.resolve({ id }) });
      return { status: response.status, body: await response.json() };
    }
  };
}

let cases = 0;
async function check(name, action) {
  try { await action(); cases += 1; }
  catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}

(async () => {
  await check("save preserves exact edits and consumes no generation", async () => {
    const app = harness({ usage: 20 });
    const draftText = "  Hi Maya,\n\nTuesday works — café at 10?\n\n  Alex  ";
    const response = await app.invoke({ saveToGmail: true, draftText });
    assert.equal(response.status, 200);
    assert.equal(response.body.draftText, draftText);
    assert.equal(app.calls.gmail[0].draftText, draftText);
    assert.equal(app.calls.inserts[0].draft_text, draftText);
    assert.equal(app.calls.inserts[0].user_id, "owner");
    assert.equal(app.calls.ai, 0);
    assert.deepEqual(app.calls.increments, []);
  });
  await check("generation remains separate and counts once", async () => {
    const app = harness();
    const response = await app.invoke({ saveToGmail: false });
    assert.equal(response.status, 200);
    assert.equal(app.calls.ai, 1);
    assert.equal(app.calls.gmail.length, 0);
    assert.deepEqual(app.calls.increments, [{ id: "owner", usage: { drafts_generated: 1 } }]);
  });
  await check("generation still respects monthly quota", async () => {
    const app = harness({ usage: 20 });
    assert.equal((await app.invoke({ saveToGmail: false })).status, 402);
    assert.equal(app.calls.ai, 0);
    assert.equal(app.calls.inserts.length, 0);
  });
  await check("demo echoes edited text without external side effects", async () => {
    const app = harness({ demo: true });
    const response = await app.invoke({ saveToGmail: true, draftText: "My own reply.\nUnchanged." });
    assert.equal(response.status, 200);
    assert.equal(response.body.draftText, "My own reply.\nUnchanged.");
    assert.equal(response.body.demo, true);
    assert.equal(response.body.gmailDraftId, "demo-draft-message");
    assert.equal(app.calls.database, 0);
    assert.equal(app.calls.gmail.length, 0);
    assert.equal(app.calls.ai, 0);
  });
  for (const [name, options] of [["phishing", { category: "Phishing" }], ["spam", { category: "Spam" }], ["high risk", { risk: 7 }], ["demo risk", { demo: true, risk: 8 }]]) {
    await check(`${name} cannot bypass the existing reply guard`, async () => {
      const app = harness(options);
      assert.equal((await app.invoke({ saveToGmail: true, draftText: "Manual reply" })).status, 400);
      assert.equal(app.calls.gmail.length, 0);
      assert.equal(app.calls.inserts.length, 0);
    });
  }
  for (const [name, body] of [
    ["empty draft", { saveToGmail: true, draftText: "" }],
    ["whitespace draft", { saveToGmail: true, draftText: " \n\t " }],
    ["missing draft", { saveToGmail: true }],
    ["oversized draft", { saveToGmail: true, draftText: "x".repeat(20001) }],
    ["wrong type", { saveToGmail: true, draftText: {} }],
    ["coerced operation", { saveToGmail: "true", draftText: "Reply" }],
    ["ambiguous generation", { saveToGmail: false, draftText: "Do not discard me" }],
    ["null request", null], ["array request", []]
  ]) {
    await check(`${name} is rejected before side effects`, async () => {
      const app = harness();
      assert.equal((await app.invoke(body)).status, 400);
      assert.equal(app.calls.ai, 0);
      assert.equal(app.calls.database, 0);
      assert.equal(app.calls.gmail.length, 0);
    });
  }
  await check("malformed JSON is not treated as generation", async () => {
    const app = harness();
    assert.equal((await app.invoke(null, "message", true)).status, 400);
    assert.equal(app.calls.ai, 0);
  });
  await check("authentication is required before saving", async () => {
    const app = harness({ unauthorized: true });
    assert.equal((await app.invoke({ saveToGmail: true, draftText: "Reply" })).status, 401);
    assert.equal(app.calls.database, 0);
  });
  await check("another user's email cannot receive a draft", async () => {
    const app = harness({ emailOwner: "someone-else" });
    assert.equal((await app.invoke({ saveToGmail: true, draftText: "Reply" })).status, 404);
    assert.equal(app.calls.gmail.length, 0);
    assert.equal(app.calls.inserts.length, 0);
  });
  await check("disconnected Gmail returns a recoverable error", async () => {
    const app = harness({ disconnected: true });
    assert.equal((await app.invoke({ saveToGmail: true, draftText: "Reply" })).status, 400);
    assert.equal(app.calls.gmail.length, 0);
    assert.equal(app.calls.ai, 0);
    assert.equal(app.calls.inserts.length, 0);
  });
  console.log(`Reply draft regression checks passed: ${cases}. No external services called.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
