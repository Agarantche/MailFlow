/* Independent, deterministic verification. Run: node scripts/test-planner.cjs */
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Use the project's existing TypeScript installation; leave no compiled files.
const previousTsLoader = require.extensions[".ts"];
let solvePlan;
try {
  require.extensions[".ts"] = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      fileName: filename,
    });
    module._compile(compiled.outputText, filename);
  };
  ({ solvePlan } = require(path.join(__dirname, "../lib/planner/solver.ts")));
} finally {
  if (previousTsLoader) require.extensions[".ts"] = previousTsLoader;
  else delete require.extensions[".ts"];
}

const streams = ["launch", "customer", "operations"];
const task = (id, changes = {}) => ({
  id, title: `Task ${id}`, sender: "Test fixture", excerpt: "Synthetic task",
  rationale: "Test fixture", stream: "launch", duration: 10, value: 10,
  release: 0, deadline: 60, dependencies: [], ...changes,
});
const options = (changes = {}) => ({
  start: 0, end: 60, bufferPercent: 0, switchMinutes: 0, requiredIds: [], ...changes,
});
const meeting = (start, end, id = `${start}-${end}`) => ({ id, title: "Meeting", start, end });
const overlaps = (a, b, c, d) => a < d && c < b;
const durationCache = new Map();

// Interpret the supplied numeric percentage's decimal spelling exactly. BigInt
// rational arithmetic keeps the oracle independent of floating-point rounding
// in the implementation (for example, 50 * 1.1 exceeds 55 in binary arithmetic).
function preciseBufferedMinutes(duration, percent) {
  const key = `${duration}/${percent}`;
  if (durationCache.has(key)) return durationCache.get(key);
  const [coefficient, exponent = "0"] = String(percent).toLowerCase().split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  let numerator = BigInt(whole + fraction);
  const scale = fraction.length - Number(exponent);
  const denominator = 100n * (scale >= 0 ? 10n ** BigInt(scale) : 1n);
  if (scale < 0) numerator *= 10n ** BigInt(-scale);
  const bufferedNumerator = BigInt(duration) * (denominator + numerator);
  const answer = Number((bufferedNumerator + denominator - 1n) / denominator);
  durationCache.set(key, answer);
  return answer;
}

function freezeDeep(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

/*
 * Exhaust every dependency-valid ordered subset without memoization or dominance
 * pruning. Place work by scanning integer minutes, not by the solver's calendar
 * search. For a fixed sequence, earliest placement cannot hurt a later task:
 * releases are lower bounds, deadlines are upper bounds, and waiting is allowed.
 */
function exhaustiveOracle(tasks, meetings, settings) {
  const bestBySet = new Map();
  let sequences = 0;
  function visit(entries, chosen, finish, value, lastStream) {
    sequences += 1;
    const key = [...chosen].sort().join("\0");
    const previous = bestBySet.get(key);
    if (!previous || finish < previous.finish) {
      bestBySet.set(key, { entries: [...entries], chosen: new Set(chosen), finish, value });
    }
    for (const item of tasks) {
      if (chosen.has(item.id) || item.blocked || item.dependencies.some(id => !chosen.has(id))) continue;
      const duration = preciseBufferedMinutes(item.duration, settings.bufferPercent);
      const setup = lastStream !== null && lastStream !== item.stream ? settings.switchMinutes : 0;
      const latestStart = Math.min(settings.end, item.deadline) - duration;
      for (let start = Math.max(item.release, finish + setup); start <= latestStart; start += 1) {
        const setupStart = start - setup;
        const end = start + duration;
        if (meetings.some(block => overlaps(setupStart, end, block.start, block.end))) continue;
        const entry = { taskId: item.id, start, end, setupStart };
        chosen.add(item.id);
        entries.push(entry);
        visit(entries, chosen, end, value + item.value, item.stream);
        entries.pop();
        chosen.delete(item.id);
        break;
      }
    }
  }
  visit([], new Set(), settings.start, 0, null);
  function best(required) {
    let result = null;
    for (const candidate of bestBySet.values()) {
      if (required.some(id => !candidate.chosen.has(id))) continue;
      if (!result || candidate.value > result.value || (candidate.value === result.value && candidate.finish < result.finish)) {
        result = candidate;
      }
    }
    return result;
  }
  return { best, sequences, subsets: bestBySet.size };
}

// Validate returned schedules directly from the input contract.
function validateSchedule(plan, tasks, meetings, settings, required, label) {
  assert.ok(plan, `${label}: expected a schedule`);
  const byId = new Map(tasks.map(item => [item.id, item]));
  const completed = new Set();
  let finish = settings.start;
  let lastStream = null;
  let value = 0;
  let workMinutes = 0;
  let switchMinutes = 0;
  for (const entry of plan.entries) {
    const item = byId.get(entry.taskId);
    assert.ok(item, `${label}: unknown scheduled task ${entry.taskId}`);
    assert.ok(!completed.has(item.id), `${label}: scheduled twice: ${item.id}`);
    assert.ok(!item.blocked, `${label}: blocked task scheduled: ${item.id}`);
    assert.ok(item.dependencies.every(id => completed.has(id)), `${label}: unfinished predecessor: ${item.id}`);
    for (const field of ["setupStart", "start", "end"]) assert.ok(Number.isInteger(entry[field]), `${label}: noninteger ${field}`);
    const expectedSetup = lastStream !== null && item.stream !== lastStream ? settings.switchMinutes : 0;
    assert.equal(entry.start - entry.setupStart, expectedSetup, `${label}: context setup for ${item.id}`);
    assert.ok(entry.setupStart >= finish, `${label}: task/setup overlaps preceding work`);
    assert.ok(entry.start >= item.release, `${label}: task starts before release`);
    assert.ok(entry.end <= item.deadline, `${label}: deadline exceeded`);
    assert.ok(entry.end <= settings.end, `${label}: working day exceeded`);
    assert.equal(entry.end - entry.start, preciseBufferedMinutes(item.duration, settings.bufferPercent), `${label}: buffered duration`);
    for (const block of meetings) {
      assert.ok(!overlaps(entry.setupStart, entry.end, block.start, block.end), `${label}: work/setup overlaps meeting ${block.id}`);
    }
    completed.add(item.id);
    value += item.value;
    workMinutes += entry.end - entry.start;
    switchMinutes += expectedSetup;
    finish = entry.end;
    lastStream = item.stream;
  }
  assert.ok(required.every(id => completed.has(id)), `${label}: silently dropped a required task`);
  assert.equal(plan.value, value, `${label}: score sum`);
  assert.equal(plan.finish, finish, `${label}: finishing time`);
  assert.equal(plan.workMinutes, workMinutes, `${label}: total work`);
  assert.equal(plan.switchMinutes, switchMinutes, `${label}: total setup`);
}

let verifiedCases = 0;
let oracleSequences = 0;
let forcedComparisons = 0;
const reports = [];

function checkCase(name, tasks, meetings = [], settings = options(), inspect = () => {}) {
  const original = JSON.stringify({ tasks, meetings, settings });
  freezeDeep(tasks); freezeDeep(meetings); freezeDeep(settings);
  const result = solvePlan(tasks, meetings, settings);
  assert.deepEqual(result.errors, [], `${name}: valid input rejected`);
  assert.equal(JSON.stringify({ tasks, meetings, settings }), original, `${name}: inputs mutated`);
  const oracle = exhaustiveOracle(tasks, meetings, settings);
  oracleSequences += oracle.sequences;
  const expected = oracle.best(settings.requiredIds);
  const unconstrained = oracle.best([]);
  if (!expected) {
    assert.equal(result.plan, null, `${name}: impossible commitments accepted`);
    assert.ok(result.conflictIds.length > 0, `${name}: missing conflicting commitments`);
    assert.ok(result.conflictIds.every(id => settings.requiredIds.includes(id)), `${name}: conflict names an unpinned task`);
    assert.equal(oracle.best(result.conflictIds), null, `${name}: reported conflict is actually feasible`);
    for (const removed of result.conflictIds) {
      assert.ok(oracle.best(result.conflictIds.filter(id => id !== removed)), `${name}: conflict is not inclusion-minimal`);
    }
  }
  else {
    validateSchedule(result.plan, tasks, meetings, settings, settings.requiredIds, name);
    assert.equal(result.plan.value, expected.value, `${name}: suboptimal score`);
    assert.equal(result.plan.finish, expected.finish, `${name}: not the earliest optimal finish`);
  }
  validateSchedule(result.unconstrainedPlan, tasks, meetings, settings, [], `${name} / unconstrained`);
  assert.equal(result.unconstrainedPlan.value, unconstrained.value, `${name}: unconstrained optimum`);
  assert.equal(result.unconstrainedPlan.finish, unconstrained.finish, `${name}: unconstrained earliest finish`);
  assert.equal(result.feasibleSubsets, oracle.subsets, `${name}: feasible subset count`);
  validateSchedule(result.greedyPlan, tasks, meetings, settings, [], `${name} / greedy baseline`);
  assert.ok(result.greedyPlan.value <= unconstrained.value, `${name}: baseline exceeds exhaustive optimum`);
  assert.equal(result.explanations.length, tasks.length, `${name}: explanation coverage`);
  assert.equal(new Set(result.explanations.map(item => item.taskId)).size, tasks.length, `${name}: duplicate explanation`);
  for (const item of tasks) {
    const explanation = result.explanations.find(entry => entry.taskId === item.id);
    assert.ok(explanation, `${name}: missing explanation for ${item.id}`);
    const forced = oracle.best([...settings.requiredIds, item.id]);
    assert.equal(explanation.forcedValue, forced?.value ?? null, `${name}: forced-inclusion value for ${item.id}`);
    if (expected && forced) assert.equal(explanation.opportunityCost, expected.value - forced.value, `${name}: opportunity cost for ${item.id}`);
    else assert.equal(explanation.opportunityCost, null, `${name}: infeasible opportunity cost should be unknown`);
    forcedComparisons += 1;
  }
  inspect(result, oracle);
  verifiedCases += 1;
  if (!name.startsWith("seeded")) reports.push(name);
  return result;
}

checkCase("empty workload", [], [], options({ start: 20 }));
checkCase("greedy trap: two useful tasks beat one urgent task", [
  task("tempting", { duration: 20, value: 12, deadline: 20 }),
  task("first", { duration: 15, value: 10 }),
  task("second", { duration: 15, value: 10 }),
], [], options({ end: 30 }), result => assert.equal(result.plan.value, 20));

checkCase("ordering preserves a tight deadline", [
  task("valuable", { value: 100, deadline: 20 }),
  task("urgent", { value: 90, deadline: 10 }),
], [], options({ end: 20 }), result => assert.equal(result.plan.value, 190));

checkCase("meeting and deadline boundaries are inclusive", [
  task("before", { deadline: 10 }),
  task("after", { release: 20, deadline: 30, dependencies: ["before"] }),
], [meeting(10, 20)], options({ end: 30 }), result => assert.equal(result.plan.value, 20));

checkCase("work is indivisible across a meeting", [task("too-long", { duration: 11, deadline: 30 })],
  [meeting(10, 20)], options({ end: 30, requiredIds: ["too-long"] }), result => assert.equal(result.plan, null));

checkCase("setup may precede work release", [
  task("first", { duration: 5, deadline: 5 }),
  task("released", { duration: 4, release: 10, deadline: 14, stream: "customer", dependencies: ["first"] }),
], [], options({ end: 14, switchMinutes: 5, requiredIds: ["released"] }), result => {
  assert.equal(result.plan.entries[1].setupStart, 5);
  assert.equal(result.plan.entries[1].start, 10);
});

checkCase("setup cannot cross a meeting", [
  task("first", { duration: 5, deadline: 5 }),
  task("second", { duration: 5, deadline: 20, stream: "customer", dependencies: ["first"] }),
], [meeting(8, 12)], options({ end: 20, switchMinutes: 4, requiredIds: ["second"] }), result => assert.equal(result.plan, null));

checkCase("context persists through calendar gaps", [
  task("first", { duration: 5, deadline: 5 }),
  task("same", { duration: 5, release: 15, deadline: 20, dependencies: ["first"] }),
], [meeting(5, 15)], options({ end: 20, switchMinutes: 9, requiredIds: ["same"] }), result => assert.equal(result.plan.switchMinutes, 0));

checkCase("buffer rounds each task upward", [task("a", { duration: 3 }), task("b", { duration: 3 })], [],
  options({ end: 9, bufferPercent: 50 }), result => assert.equal(result.plan.workMinutes, 5));

checkCase("10 percent buffer preserves an exact integer boundary", [task("a", { duration: 50, deadline: 55 })], [],
  options({ end: 55, bufferPercent: 10, requiredIds: ["a"] }), result => assert.equal(result.plan.workMinutes, 55));

checkCase("fractional percentage preserves an exact integer boundary", [task("a", { duration: 1000, deadline: 1001 })], [],
  options({ end: 1001, bufferPercent: 0.1, requiredIds: ["a"] }), result => assert.equal(result.plan.workMinutes, 1001));

checkCase("percentage just above a boundary still rounds upward", [task("a", { duration: 50, deadline: 56 })], [],
  options({ end: 56, bufferPercent: 10.000000000001, requiredIds: ["a"] }), result => assert.equal(result.plan.workMinutes, 56));

checkCase("any positive fractional buffer reserves another minute", [task("a", { duration: 10, deadline: 11 })], [],
  options({ end: 11, bufferPercent: Number.MIN_VALUE, requiredIds: ["a"] }), result => assert.equal(result.plan.workMinutes, 11));

checkCase("blocked prerequisite propagates through a chain", [
  task("blocked", { blocked: "Awaiting approval" }),
  task("child", { dependencies: ["blocked"] }),
  task("grandchild", { dependencies: ["child"] }),
  task("free"),
], [], options(), result => {
  assert.deepEqual(result.plan.entries.map(entry => entry.taskId), ["free"]);
  for (const id of ["blocked", "child", "grandchild"]) assert.equal(result.explanations.find(entry => entry.taskId === id).forcedValue, null);
});

checkCase("pinned task brings its dependency", [
  task("prerequisite", { value: 1 }), task("pinned", { dependencies: ["prerequisite"], value: 1 }),
  task("valuable", { value: 100 }),
], [], options({ end: 20, requiredIds: ["pinned"] }), result => assert.equal(result.plan.value, 2));

checkCase("individually feasible pins conflict together", [task("a", { duration: 20 }), task("b", { duration: 20 })], [],
  options({ end: 30, requiredIds: ["a", "b"] }), result => {
    assert.equal(result.plan, null);
    assert.ok(result.conflictIds.length > 0);
    assert.ok(result.conflictIds.every(id => ["a", "b"].includes(id)));
  });

checkCase("overlapping and touching meetings", [task("a", { duration: 10, deadline: 50 })],
  [meeting(10, 20), meeting(15, 25), meeting(25, 30)], options({ start: 8, end: 50 }), result => assert.equal(result.plan.entries[0].start, 30));

checkCase("zero value work does not delay an optimal plan", [task("zero", { value: 0 }), task("positive")], [],
  options(), result => assert.equal(result.plan.finish, 10));

checkCase("zero value required task remains a commitment", [task("zero", { value: 0 })], [],
  options({ requiredIds: ["zero"] }), result => assert.equal(result.plan.entries.length, 1));

checkCase("meetings outside the work window", [task("a")], [meeting(0, 20), meeting(80, 90)],
  options({ start: 30, end: 60 }), result => assert.equal(result.plan.entries[0].start, 30));

function invalidCase(name, tasks, meetings = [], settings = options()) {
  const result = solvePlan(tasks, meetings, settings);
  assert.ok(Array.isArray(result.errors) && result.errors.length > 0, `${name}: missing validation errors`);
  assert.equal(result.plan, null, `${name}: invalid input produced a plan`);
  verifiedCases += 1;
  reports.push(name);
}
invalidCase("dependency cycle rejected", [task("a", { dependencies: ["b"] }), task("b", { dependencies: ["a"] })]);
invalidCase("self dependency rejected", [task("a", { dependencies: ["a"] })]);
invalidCase("unknown dependency rejected", [task("a", { dependencies: ["missing"] })]);
invalidCase("duplicate task IDs rejected", [task("a"), task("a")]);
invalidCase("unknown required task rejected", [task("a")], [], options({ requiredIds: ["missing"] }));
invalidCase("negative duration rejected", [task("a", { duration: -1 })]);
invalidCase("noninteger time rejected", [task("a", { release: 0.5 })]);
invalidCase("inverted meeting rejected", [task("a")], [meeting(20, 10)]);
invalidCase("inverted work window rejected", [task("a")], [], options({ start: 60, end: 20 }));
invalidCase("reversed release deadline rejected", [task("a", { release: 40, deadline: 30 })]);
invalidCase("negative buffer rejected", [task("a")], [], options({ bufferPercent: -1 }));
invalidCase("nonfinite value rejected", [task("a", { value: Number.NaN })]);
invalidCase("exact search input limit enforced", Array.from({ length: 17 }, (_, index) => task(`t${index}`)));

// Reproducible cases; no network, current time, solver-derived expected answers,
// or test libraries are used. Seed is printed to make a failure replayable.
const seed = 0x51a7e202;
let state = seed;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 0x100000000;
}
const integer = (low, high) => low + Math.floor(random() * (high - low + 1));
const randomCases = 180;
for (let index = 0; index < randomCases; index += 1) {
  // Roomy seven-task cases force enumeration of many complete permutations;
  // the remaining cases emphasize narrow windows and conflicting constraints.
  const roomy = index % 6 === 0;
  const count = roomy ? 7 : integer(1, 7);
  const end = roomy ? 90 : integer(25, 90);
  const start = integer(0, 5);
  const items = [];
  for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
    const release = roomy || random() < 0.55 ? start : integer(start, end - 1);
    const deadline = roomy || random() < 0.45 ? end : integer(release, end);
    items.push(task(`t${itemIndex}`, {
      duration: integer(2, roomy ? 8 : 16), value: integer(0, 25), release, deadline,
      stream: streams[integer(0, streams.length - 1)],
      dependencies: roomy ? [] : items.filter(() => random() < 0.14).map(item => item.id),
      ...(!roomy && random() < 0.07 ? { blocked: "External dependency" } : {}),
    }));
  }
  const blocks = [];
  for (let blockIndex = 0, count = roomy ? 0 : integer(0, 3); blockIndex < count; blockIndex += 1) {
    const meetingStart = integer(start, end - 1);
    blocks.push(meeting(meetingStart, Math.min(end, meetingStart + integer(1, 12)), `m${blockIndex}`));
  }
  const settings = options({
    start, end, switchMinutes: integer(0, 6), bufferPercent: [0, 10, 25, 50][integer(0, 3)],
    requiredIds: items.filter(() => random() < 0.17).map(item => item.id),
  });
  try {
    checkCase(`seeded case ${index} (seed ${seed})`, items, blocks, settings);
  } catch (error) {
    process.stderr.write(`Reproduction: ${JSON.stringify({ index, seed, tasks: items, meetings: blocks, options: settings }, null, 2)}\n`);
    throw error;
  }
}

process.stdout.write(`Planner verification passed: ${verifiedCases} cases (${reports.length} targeted + ${randomCases} seeded).\n`);
process.stdout.write(`Independent oracle: ${oracleSequences.toLocaleString("en-US")} ordered subsets; ${forcedComparisons} forced-inclusion comparisons.\n`);
process.stdout.write(`Seed: 0x${seed.toString(16)}. Checked feasibility, maximum score, earliest finish, all task counterfactuals, commitments, input immutability, and malformed inputs.\n`);
