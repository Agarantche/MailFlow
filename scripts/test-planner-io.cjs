"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

let parsePlannerInput;
let calendarExport;
const previousTsLoader = require.extensions[".ts"];
try {
  require.extensions[".ts"] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      fileName: filename,
    });
    module._compile(compiled.outputText, filename);
  };
  ({ parsePlannerInput, calendarExport } = require(path.join(__dirname, "../lib/planner/io.ts")));
} finally {
  if (previousTsLoader) require.extensions[".ts"] = previousTsLoader;
  else delete require.extensions[".ts"];
}

const fixture = () => ({
  version: 1,
  tasks: [{
    id: "a", title: "Ship the plan", sender: "Test sender", excerpt: "Test excerpt", rationale: "Test reason",
    stream: "launch", duration: 30, value: 20, release: 540, deadline: 1020, dependencies: [],
  }],
  meetings: [{ id: "standup", title: "Standup", start: 600, end: 615 }],
  options: { start: 540, end: 1020, bufferPercent: 10, switchMinutes: 5, requiredIds: [] },
});
const planFixture = () => ({
  entries: [{ taskId: "a", setupStart: 540, start: 545, end: 575 }],
  value: 20, finish: 575, workMinutes: 30, switchMinutes: 5,
});

let cases = 0;
function check(name, action) {
  try { action(); cases += 1; }
  catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}
function reject(name, mutate) {
  check(name, () => {
    const data = fixture();
    mutate(data);
    assert.throws(() => parsePlannerInput(JSON.stringify(data)), /Invalid plan/);
  });
}
const unfold = calendar => calendar.replace(/\r\n[ \t]/g, "");
function lines(calendar) {
  assert.ok(calendar.endsWith("\r\n"), "calendar must end with CRLF");
  assert.ok(!calendar.replace(/\r\n/g, "").match(/[\r\n]/), "calendar contains a bare CR or LF");
  const physical = calendar.slice(0, -2).split("\r\n");
  for (const line of physical) assert.ok(Buffer.byteLength(line, "utf8") <= 75, `line exceeds 75 UTF-8 octets: ${line}`);
  return unfold(calendar).slice(0, -2).split("\r\n");
}

check("valid version-one input round trips", () => assert.deepEqual(parsePlannerInput(JSON.stringify(fixture())), fixture()));
check("titles trim surrounding whitespace", () => {
  const data = fixture(); data.tasks[0].title = "  Important work  ";
  assert.equal(parsePlannerInput(JSON.stringify(data)).tasks[0].title, "Important work");
});
check("unknown fields are removed", () => {
  const data = fixture(); data.admin = true; data.tasks[0].onclick = "malicious()"; data.options.secret = "discard";
  assert.deepEqual(parsePlannerInput(JSON.stringify(data)), fixture());
});
check("prototype-shaped JSON keys cannot pollute objects", () => {
  const serialized = JSON.stringify(fixture()).replace('"version":1', '"version":1,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}');
  const parsed = parsePlannerInput(serialized);
  assert.equal({}.polluted, undefined);
  assert.ok(!Object.hasOwn(parsed, "__proto__"));
  assert.ok(!Object.hasOwn(parsed, "constructor"));
});
check("malformed JSON is rejected", () => assert.throws(() => parsePlannerInput("{"), /not valid JSON/));
check("oversized input is rejected", () => assert.throws(() => parsePlannerInput(" ".repeat(100001)), /too large/));
check("null root is rejected", () => assert.throws(() => parsePlannerInput("null"), /Invalid plan/));
check("array root is rejected", () => assert.throws(() => parsePlannerInput("[]"), /Invalid plan/));
reject("unsupported version", data => { data.version = 2; });
reject("object masquerading as tasks array", data => { data.tasks = { length: 1, 0: data.tasks[0] }; });
reject("unknown workstream", data => { data.tasks[0].stream = "arbitrary"; });
reject("numeric string is not coerced", data => { data.tasks[0].duration = "30"; });
reject("nested object is not executable text", data => { data.tasks[0].excerpt = { toString: "malicious" }; });
reject("empty task title", data => { data.tasks[0].title = "   "; });
reject("negative duration", data => { data.tasks[0].duration = -1; });
reject("too many tasks", data => { data.tasks = Array.from({ length: 17 }, (_, index) => ({ ...data.tasks[0], id: `t${index}` })); });
reject("too many meetings", data => { data.meetings = Array.from({ length: 31 }, (_, index) => ({ ...data.meetings[0], id: `m${index}` })); });
reject("identifier with injected calendar property", data => { data.tasks[0].id = "a\r\nBEGIN:VEVENT"; });
reject("malicious dependency shape", data => { data.tasks[0].dependencies = [{ id: "a" }]; });
reject("out of range minute", data => { data.options.end = 1441; });
reject("oversized excerpt", data => { data.tasks[0].excerpt = "x".repeat(3001); });

check("calendar envelope and floating local timestamps", () => {
  const calendar = calendarExport(planFixture(), fixture().tasks, "2026-09-04");
  const properties = lines(calendar);
  assert.equal(properties[0], "BEGIN:VCALENDAR");
  assert.equal(properties.at(-1), "END:VCALENDAR");
  assert.equal(properties.filter(line => line === "BEGIN:VEVENT").length, 1);
  assert.equal(properties.filter(line => line === "END:VEVENT").length, 1);
  assert.ok(properties.includes("DTSTART:20260904T090000"), "start must include context setup");
  assert.ok(properties.includes("DTEND:20260904T093500"));
  assert.ok(properties.some(line => /^DTSTAMP:\d{8}T\d{6}Z$/.test(line)));
  assert.ok(properties.includes("UID:a-20260904@decision-lab.mailflow.local"));
});

check("calendar text escapes punctuation and newlines", () => {
  const data = fixture();
  data.tasks[0].title = "Review\\approve; sales, ops\r\nNext line\nLast";
  data.tasks[0].rationale = "Reason; with, punctuation\\";
  data.tasks[0].excerpt = "line one\nline two";
  const properties = lines(calendarExport(planFixture(), data.tasks, "2026-09-04"));
  assert.ok(properties.includes("SUMMARY:Review\\\\approve\\; sales\\, ops\\nNext line\\nLast"));
  assert.ok(properties.find(line => line.startsWith("DESCRIPTION:")).includes("Reason\\; with\\, punctuation\\\\\\nImpact"));
});

check("a lone carriage return is escaped", () => {
  const data = fixture(); data.tasks[0].title = "First\rSecond";
  const properties = lines(calendarExport(planFixture(), data.tasks, "2026-09-04"));
  assert.ok(properties.includes("SUMMARY:First\\nSecond"));
});

check("invalid text controls are removed while tabs remain", () => {
  const data = fixture(); data.tasks[0].title = "A\u0000B\u0001C\u000BD\u000CE\u001FF\u007FG\tH";
  const properties = lines(calendarExport(planFixture(), data.tasks, "2026-09-04"));
  assert.ok(properties.includes("SUMMARY:ABCDEFG\tH"));
});

check("folded Unicode text stays within 75 octets and round trips", () => {
  const data = fixture();
  data.tasks[0].title = "Plan 🧭 café 東京 ".repeat(15);
  data.tasks[0].excerpt = "Résumé 中文 😀 ".repeat(80);
  const calendar = calendarExport(planFixture(), data.tasks, "2026-09-04");
  const properties = lines(calendar);
  assert.ok(calendar.includes("\r\n "), "long values must fold");
  assert.ok(properties.includes(`SUMMARY:${data.tasks[0].title}`));
  assert.ok(properties.find(line => line.startsWith("DESCRIPTION:")).endsWith(data.tasks[0].excerpt));
  assert.ok(!calendar.includes("\uFFFD"), "Unicode must not be corrupted");
});

check("CRLF in text cannot inject a second event", () => {
  const data = fixture();
  data.tasks[0].title = "Text\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Injected";
  const properties = lines(calendarExport(planFixture(), data.tasks, "2026-09-04"));
  assert.equal(properties.filter(line => line === "BEGIN:VEVENT").length, 1);
  assert.equal(properties.filter(line => line === "END:VEVENT").length, 1);
  assert.ok(properties.some(line => line.startsWith("SUMMARY:Text\\nEND:VEVENT\\nBEGIN:VEVENT")));
});

for (const [date, expected] of [
  ["2026-09-04", "20260905"], ["2026-12-31", "20270101"],
  ["2024-02-28", "20240229"], ["2024-02-29", "20240301"], ["2026-02-28", "20260301"],
]) {
  check(`midnight rolls ${date} to the next date`, () => {
    const plan = planFixture(); plan.entries[0] = { taskId: "a", setupStart: 1410, start: 1410, end: 1440 };
    const properties = lines(calendarExport(plan, fixture().tasks, date));
    assert.ok(properties.includes(`DTEND:${expected}T000000`));
    assert.ok(!properties.some(line => /T240000/.test(line)));
  });
}

for (const date of ["", "09/04/2026", "2026-9-4", "2026-02-29", "2024-02-30", "2026-13-01", "2026-00-01", "2026-01-00", "2026-09-04\r\nBEGIN:VEVENT"]) {
  check(`invalid date ${JSON.stringify(date)}`, () => assert.throws(() => calendarExport(planFixture(), fixture().tasks, date), /date/));
}

check("rollover beyond the four-digit calendar year is rejected", () => {
  const plan = planFixture(); plan.entries[0] = { taskId: "a", setupStart: 1410, start: 1410, end: 1440 };
  assert.throws(() => calendarExport(plan, fixture().tasks, "9999-12-31"), /date/i);
});

check("empty schedule exports a valid empty calendar", () => {
  const plan = planFixture(); plan.entries = [];
  const properties = lines(calendarExport(plan, fixture().tasks, "2026-09-04"));
  assert.ok(properties.includes("BEGIN:VCALENDAR"));
  assert.ok(!properties.includes("BEGIN:VEVENT"));
});

process.stdout.write(`Planner import/export verification passed: ${cases} cases.\n`);
process.stdout.write("Checked JSON shape and limits, calendar escaping, hostile text, UTF-8 folding, timestamps, leap dates, midnight rollover, and empty exports.\n");
