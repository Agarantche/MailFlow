import type {
  CalendarBlock,
  Plan,
  PlannerOptions,
  PlannerResult,
  PlannerTask,
  ScheduledTask,
  TaskExplanation,
  Workstream,
} from "./types";

const STREAMS: Workstream[] = ["launch", "customer", "operations"];
const STREAM_COUNT = 4; // The fourth stream is the empty schedule's sentinel.
const INITIAL_STREAM = 3;
const MAX_TASKS = 16;

/** Format a local minute coordinate without involving the browser's timezone. */
export function formatTime(minutes: number): string {
  if (!Number.isFinite(minutes)) return "—";
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  return `${hours.toString().padStart(2, "0")}:${(rounded % 60).toString().padStart(2, "0")}`;
}

export function bufferedDuration(task: PlannerTask, percent: number): number {
  if (!Number.isSafeInteger(task.duration) || task.duration < 0 || !Number.isFinite(percent) || percent < 0) return NaN;
  // Interpret the displayed decimal percentage exactly. Binary arithmetic can
  // turn 50 * 1.1 into 55.00000000000001 and incorrectly reserve 56 minutes.
  // Computing duration + ceil(duration * percent / 100) alone has the same
  // defect for values such as 5000 minutes at 0.14%. No epsilon is safe either:
  // even a tiny positive buffer should round up by one whole minute.
  const [mantissa, exponentText = "0"] = percent.toString().toLowerCase().split("e");
  const decimalPlaces = mantissa.includes(".") ? mantissa.length - mantissa.indexOf(".") - 1 : 0;
  const scale = decimalPlaces - Number(exponentText);
  const ten = BigInt(10);
  const coefficient = BigInt(mantissa.replace(".", ""));
  const numerator = BigInt(task.duration) * coefficient * (scale < 0 ? ten ** BigInt(-scale) : BigInt(1));
  const denominator = BigInt(100) * (scale > 0 ? ten ** BigInt(scale) : BigInt(1));
  const extraMinutes = (numerator + denominator - BigInt(1)) / denominator;
  return Number(BigInt(task.duration) + extraMinutes);
}

function emptyPlan(start: number): Plan {
  return { entries: [], value: 0, finish: start, workMinutes: 0, switchMinutes: 0 };
}

const isMinute = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1440;

const isNonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

function validate(
  tasks: PlannerTask[],
  meetings: CalendarBlock[],
  options: PlannerOptions,
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(tasks)) errors.push("Tasks must be an array.");
  if (!Array.isArray(meetings)) errors.push("Calendar blocks must be an array.");
  if (!options || typeof options !== "object") errors.push("Planner options are required.");
  if (errors.length) return errors;

  if (tasks.length > MAX_TASKS) errors.push(`The exact planner supports at most ${MAX_TASKS} tasks.`);
  if (!isMinute(options.start) || !isMinute(options.end) || options.start >= options.end) {
    errors.push("Working hours must be integer minutes from 00:00 to 24:00, with start before end.");
  }
  if (typeof options.bufferPercent !== "number" || !Number.isFinite(options.bufferPercent) || options.bufferPercent < 0) {
    errors.push("The time buffer must be a finite, nonnegative percentage.");
  }
  if (!isNonnegativeInteger(options.switchMinutes)) {
    errors.push("Context-switch time must be a nonnegative safe integer.");
  }
  if (!Array.isArray(options.requiredIds) || options.requiredIds.some(id => typeof id !== "string")) {
    errors.push("Required task IDs must be an array of strings.");
  }

  const ids = new Set<string>();
  let totalValue = 0;
  tasks.forEach((task, index) => {
    const label = `Task ${index + 1}`;
    if (!task || typeof task !== "object") {
      errors.push(`${label} must be an object.`);
      return;
    }
    if (typeof task.id !== "string" || !task.id.trim()) errors.push(`${label} needs a nonempty string ID.`);
    else if (ids.has(task.id)) errors.push(`Duplicate task ID: ${task.id}.`);
    else ids.add(task.id);
    for (const field of ["title", "sender", "excerpt", "rationale"] as const) {
      if (typeof task[field] !== "string") errors.push(`${label} ${field} must be a string.`);
    }
    if (!STREAMS.includes(task.stream)) errors.push(`${label} has an unknown workstream.`);
    if (!isNonnegativeInteger(task.duration) || task.duration === 0) {
      errors.push(`${label} duration must be a positive safe integer.`);
    } else if (Number.isFinite(options.bufferPercent) && options.bufferPercent >= 0 && !Number.isSafeInteger(bufferedDuration(task, options.bufferPercent))) {
      errors.push(`${label} buffered duration is too large to represent exactly.`);
    }
    if (!isNonnegativeInteger(task.value)) errors.push(`${label} value must be a nonnegative safe integer.`);
    else totalValue += task.value;
    if (!isMinute(task.release) || !isMinute(task.deadline) || task.release > task.deadline) {
      errors.push(`${label} release and deadline must be integer minutes in the same day, with release no later than deadline.`);
    }
    if (!Array.isArray(task.dependencies) || task.dependencies.some(id => typeof id !== "string")) {
      errors.push(`${label} dependencies must be an array of task IDs.`);
    } else if (new Set(task.dependencies).size !== task.dependencies.length) {
      errors.push(`${label} has duplicate dependencies.`);
    }
    if (task.blocked !== undefined && typeof task.blocked !== "string") {
      errors.push(`${label} blocked reason must be a string.`);
    }
  });
  if (!Number.isSafeInteger(totalValue)) errors.push("Combined task value is too large to represent exactly.");

  const meetingIds = new Set<string>();
  meetings.forEach((meeting, index) => {
    if (!meeting || typeof meeting !== "object") {
      errors.push(`Calendar block ${index + 1} must be an object.`);
      return;
    }
    if (typeof meeting.id !== "string" || !meeting.id.trim()) errors.push(`Calendar block ${index + 1} needs a string ID.`);
    else if (meetingIds.has(meeting.id)) errors.push(`Duplicate calendar block ID: ${meeting.id}.`);
    else meetingIds.add(meeting.id);
    if (typeof meeting.title !== "string") errors.push(`Calendar block ${index + 1} title must be a string.`);
    if (!isMinute(meeting.start) || !isMinute(meeting.end) || meeting.start >= meeting.end) {
      errors.push(`Calendar block ${index + 1} must have integer minute bounds with start before end.`);
    }
  });

  // Do not traverse a malformed graph. The checks above still report independent
  // input issues together, instead of throwing halfway through an edit in the UI.
  if (errors.length) return errors;
  const byId = new Map(tasks.map(task => [task.id, task]));
  for (const task of tasks) {
    for (const id of task.dependencies) {
      if (!byId.has(id)) errors.push(`Task "${task.title}" depends on unknown task "${id}".`);
    }
  }
  for (const id of options.requiredIds) {
    if (!byId.has(id)) errors.push(`Required task "${id}" does not exist.`);
  }
  if (errors.length) return errors;

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const dependency of byId.get(id)!.dependencies) {
      if (!visit(dependency)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  };
  for (const task of tasks) {
    if (!visit(task.id)) {
      errors.push(`Dependency cycle detected involving "${task.title}". Remove the cycle before planning.`);
      break;
    }
  }
  return errors;
}

/**
 * An exact, single-day optimizer for at most 16 atomic tasks.
 *
 * State = (completed subset, most recent workstream). All paths to that state
 * have the same earned value and the same available prerequisites. The path
 * finishing earliest dominates every later path: it may wait and reproduce any
 * later continuation, with the same setup cost. Fixed meeting exclusions and
 * release times preserve this property; setup depends ONLY on the last stream.
 * Therefore one earliest finish per state is sufficient, rather than every
 * permutation. We retain parents to recover the winning, feasible sequence.
 *
 * The objective is maximum summed value, then earliest final finish. There is
 * deliberately no secondary switch-count objective: that would require richer
 * state labels. This model also does not claim to optimize interruptible work,
 * parallel workers, arbitrary sequence-dependent setup, or uncertain outcomes.
 * Duration buffers are deterministic allowances, not confidence guarantees.
 *
 * Complexity: O(2^n * streams * n * (meetings + 1)) time and O(2^n * streams)
 * memory. Superset DP then answers every forced-task counterfactual exactly in
 * O(n * 2^n), without rerunning the scheduling search for each explanation.
 */
export function solvePlan(
  tasks: PlannerTask[],
  meetings: CalendarBlock[],
  options: PlannerOptions,
): PlannerResult {
  const errors = validate(tasks, meetings, options);
  if (errors.length) {
    const start = options && isMinute(options.start) ? options.start : 0;
    return {
      plan: null,
      unconstrainedPlan: emptyPlan(start),
      greedyPlan: emptyPlan(start),
      explanations: [],
      conflictIds: [],
      statesExplored: 0,
      feasibleSubsets: 0,
      errors,
    };
  }

  const count = tasks.length;
  const subsetCount = 1 << count;
  const indexById = new Map(tasks.map((task, index) => [task.id, index]));
  const durations = tasks.map(task => bufferedDuration(task, options.bufferPercent));
  const streams = tasks.map(task => STREAMS.indexOf(task.stream));
  const dependencyMasks = tasks.map(task => task.dependencies.reduce((mask, id) => mask | (1 << indexById.get(id)!), 0));
  const requiredMask = options.requiredIds.reduce((mask, id) => mask | (1 << indexById.get(id)!), 0);
  const blockedMask = tasks.reduce((mask, task, index) => task.blocked ? mask | (1 << index) : mask, 0);

  // A fresh merged calendar avoids both double-counting overlapping blocks and
  // mutating the caller's arrays. Boundaries use half-open intervals [start,end).
  const calendar: { start: number; end: number }[] = [];
  for (const meeting of [...meetings].sort((a, b) => a.start - b.start || a.end - b.end)) {
    const previous = calendar[calendar.length - 1];
    if (previous && meeting.start <= previous.end) previous.end = Math.max(previous.end, meeting.end);
    else calendar.push({ start: meeting.start, end: meeting.end });
  }

  const earliestSlot = (index: number, previousFinish: number, previousStream: number): ScheduledTask | null => {
    const task = tasks[index];
    const setup = previousStream !== INITIAL_STREAM && previousStream !== streams[index] ? options.switchMinutes : 0;
    // Release constrains the work start. Setup may precede release, but cannot
    // precede the preceding task, overlap a meeting, or be detached from work.
    let setupStart = Math.max(previousFinish, task.release - setup);
    const occupiedDuration = setup + durations[index];
    const latestEnd = Math.min(options.end, task.deadline);
    for (const meeting of calendar) {
      if (setupStart + occupiedDuration <= meeting.start) break;
      if (setupStart >= meeting.end) continue;
      setupStart = meeting.end;
    }
    const end = setupStart + occupiedDuration;
    if (end > latestEnd) return null;
    return { taskId: task.id, setupStart, start: setupStart + setup, end };
  };

  const finish = new Float64Array(subsetCount * STREAM_COUNT);
  finish.fill(Infinity);
  const parent = new Int32Array(finish.length);
  parent.fill(-1);
  const finalTask = new Int8Array(finish.length);
  finalTask.fill(-1);
  const bestSubsetState = new Int32Array(subsetCount);
  bestSubsetState.fill(-1);
  const values = new Float64Array(subsetCount);
  for (let mask = 1; mask < subsetCount; mask++) {
    const leastBit = mask & -mask;
    const index = 31 - Math.clz32(leastBit);
    values[mask] = values[mask ^ leastBit] + tasks[index].value;
  }

  finish[INITIAL_STREAM] = options.start;
  let statesExplored = 0;
  let feasibleSubsets = 0;
  // Setting an unset bit always increases a mask, so numeric mask order is a
  // topological order. No state is expanded before all its parents are settled.
  for (let mask = 0; mask < subsetCount; mask++) {
    for (let stream = 0; stream < STREAM_COUNT; stream++) {
      const state = mask * STREAM_COUNT + stream;
      if (!Number.isFinite(finish[state])) continue;
      statesExplored++;
      const currentBest = bestSubsetState[mask];
      if (currentBest === -1 || finish[state] < finish[currentBest]) bestSubsetState[mask] = state;
      for (let index = 0; index < count; index++) {
        const bit = 1 << index;
        if ((mask & bit) || (blockedMask & bit) || (mask & dependencyMasks[index]) !== dependencyMasks[index]) continue;
        const slot = earliestSlot(index, finish[state], stream);
        if (!slot) continue;
        const nextState = (mask | bit) * STREAM_COUNT + streams[index];
        if (slot.end < finish[nextState]) {
          finish[nextState] = slot.end;
          parent[nextState] = state;
          finalTask[nextState] = index;
        }
      }
    }
    if (bestSubsetState[mask] !== -1) feasibleSubsets++;
  }

  const betterState = (candidate: number, incumbent: number): boolean => {
    if (candidate === -1) return false;
    if (incumbent === -1) return true;
    const candidateValue = values[Math.floor(candidate / STREAM_COUNT)];
    const incumbentValue = values[Math.floor(incumbent / STREAM_COUNT)];
    return candidateValue > incumbentValue || (candidateValue === incumbentValue && finish[candidate] < finish[incumbent]);
  };

  // bestExtension[required] is the best feasible superset of required. This is
  // a max-over-supersets transform, using the exact same value/finish ordering.
  const bestExtension = new Int32Array(bestSubsetState);
  for (let index = 0; index < count; index++) {
    const bit = 1 << index;
    for (let mask = 0; mask < subsetCount; mask++) {
      if (mask & bit) continue;
      const candidate = bestExtension[mask | bit];
      if (betterState(candidate, bestExtension[mask])) bestExtension[mask] = candidate;
    }
  }

  const reconstruct = (state: number): Plan => {
    const lastState = state;
    const entries: ScheduledTask[] = [];
    let workMinutes = 0;
    let switchMinutes = 0;
    while (finalTask[state] !== -1) {
      const index = finalTask[state];
      const previousState = parent[state];
      const previousStream = previousState % STREAM_COUNT;
      const setup = previousStream !== INITIAL_STREAM && previousStream !== streams[index] ? options.switchMinutes : 0;
      entries.push({ taskId: tasks[index].id, end: finish[state], start: finish[state] - durations[index], setupStart: finish[state] - durations[index] - setup });
      workMinutes += durations[index];
      switchMinutes += setup;
      state = previousState;
    }
    return {
      entries: entries.reverse(),
      value: values[Math.floor(lastState / STREAM_COUNT)],
      finish: finish[lastState],
      workMinutes,
      switchMinutes,
    };
  };

  const unconstrainedPlan = reconstruct(bestExtension[0]);
  const selectedState = bestExtension[requiredMask];
  const plan = selectedState === -1 ? null : reconstruct(selectedState);

  // Transparent comparison baseline: choose earliest deadline among currently
  // dependency-ready candidates with a feasible next slot; ties favor value,
  // then input order. It may wait for a release and does not enforce user pins.
  const greedyPlan = emptyPlan(options.start);
  let greedyMask = 0;
  let greedyStream = INITIAL_STREAM;
  while (true) {
    let chosen = -1;
    let chosenSlot: ScheduledTask | null = null;
    for (let index = 0; index < count; index++) {
      const bit = 1 << index;
      if ((greedyMask & bit) || (blockedMask & bit) || (greedyMask & dependencyMasks[index]) !== dependencyMasks[index]) continue;
      const slot = earliestSlot(index, greedyPlan.finish, greedyStream);
      if (!slot) continue;
      if (chosen === -1 || tasks[index].deadline < tasks[chosen].deadline || (tasks[index].deadline === tasks[chosen].deadline && tasks[index].value > tasks[chosen].value)) {
        chosen = index;
        chosenSlot = slot;
      }
    }
    if (chosen === -1 || !chosenSlot) break;
    greedyPlan.entries.push(chosenSlot);
    greedyPlan.value += tasks[chosen].value;
    greedyPlan.finish = chosenSlot.end;
    greedyPlan.workMinutes += durations[chosen];
    greedyPlan.switchMinutes += chosenSlot.start - chosenSlot.setupStart;
    greedyMask |= 1 << chosen;
    greedyStream = streams[chosen];
  }

  const conflictIds: string[] = [];
  if (!plan) {
    let conflictMask = requiredMask;
    // Deletion gives an inclusion-minimal unsatisfiable set: removing ANY one
    // remaining pin makes it feasible. This is not a minimum-cardinality set.
    // One pass is enough because feasibility is monotone as pins are removed.
    for (let index = 0; index < count; index++) {
      const bit = 1 << index;
      if (!(conflictMask & bit)) continue;
      if (bestExtension[conflictMask ^ bit] === -1) conflictMask ^= bit;
    }
    tasks.forEach((task, index) => { if (conflictMask & (1 << index)) conflictIds.push(task.id); });
  }

  const selectedIds = new Set(plan?.entries.map(entry => entry.taskId) ?? []);
  const blockedAncestor = (index: number): PlannerTask | null => {
    if (tasks[index].blocked) return tasks[index];
    for (const id of tasks[index].dependencies) {
      const result = blockedAncestor(indexById.get(id)!);
      if (result) return result;
    }
    return null;
  };
  const explanations: TaskExplanation[] = tasks.map((task, index) => {
    const forcedState = bestExtension[requiredMask | (1 << index)];
    const forcedPlan = forcedState === -1 ? null : reconstruct(forcedState);
    const forcedIds = new Set(forcedPlan?.entries.map(entry => entry.taskId) ?? []);
    const displacedIds = forcedPlan && plan ? plan.entries.filter(entry => !forcedIds.has(entry.taskId)).map(entry => entry.taskId) : [];
    const opportunityCost = forcedPlan && plan ? plan.value - forcedPlan.value : null;
    const shared = { taskId: task.id, forcedValue: forcedPlan?.value ?? null, opportunityCost, displacedIds };
    if (selectedIds.has(task.id)) {
      const slot = plan!.entries.find(entry => entry.taskId === task.id)!;
      return { ...shared, status: "scheduled", reason: `Scheduled ${formatTime(slot.start)}–${formatTime(slot.end)}, before its ${formatTime(task.deadline)} deadline; contributes ${task.value} value.` };
    }
    const blocker = blockedAncestor(index);
    if (blocker) {
      return { ...shared, status: "blocked", reason: blocker.id === task.id ? `Blocked: ${task.blocked}` : `Depends on “${blocker.title}”, which is blocked: ${blocker.blocked}` };
    }
    if (!forcedPlan) {
      const feasibleAlone = bestExtension[1 << index] !== -1;
      const reason = !feasibleAlone
        ? "No legal schedule includes this task and its prerequisites within the working hours, meeting gaps, release times, and deadlines."
        : !plan
          ? "The current required tasks cannot fit together. Resolve the highlighted conflict before comparing this task."
          : "This task can fit on its own with its prerequisites, but cannot fit alongside all current required tasks.";
      return { ...shared, status: "impossible", reason };
    }
    const reason = opportunityCost! > 0
      ? `Requiring this task lowers the best achievable value by ${opportunityCost}${displacedIds.length ? ` and displaces ${displacedIds.length} scheduled task${displacedIds.length === 1 ? "" : "s"}` : ""}.`
      : forcedPlan.finish > plan!.finish
        ? `An equally valuable alternative includes this task, but finishes at ${formatTime(forcedPlan.finish)} instead of ${formatTime(plan!.finish)}.`
        : "An alternative includes this task with the same value and finish time; the displayed plan is one of several tied optima.";
    return { ...shared, status: "deferred", reason };
  });

  return { plan, unconstrainedPlan, greedyPlan, explanations, conflictIds, statesExplored, feasibleSubsets, errors: [] };
}
