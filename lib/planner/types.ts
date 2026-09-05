/** Times are integer minutes after midnight, in one local working day. */
export type Workstream = "launch" | "customer" | "operations";

export interface PlannerTask {
  id: string;
  title: string;
  sender: string;
  excerpt: string;
  rationale: string;
  stream: Workstream;
  duration: number;
  value: number;
  deadline: number;
  release: number;
  dependencies: string[];
  blocked?: string;
}

export interface CalendarBlock {
  id: string;
  title: string;
  start: number;
  end: number;
}

export interface PlannerOptions {
  start: number;
  end: number;
  bufferPercent: number;
  switchMinutes: number;
  requiredIds: string[];
}

export interface ScheduledTask {
  taskId: string;
  start: number;
  end: number;
  /** Setup time is contiguous with the task and cannot overlap meetings. */
  setupStart: number;
}

export interface Plan {
  entries: ScheduledTask[];
  value: number;
  finish: number;
  workMinutes: number;
  switchMinutes: number;
}

export interface TaskExplanation {
  taskId: string;
  status: "scheduled" | "deferred" | "blocked" | "impossible";
  reason: string;
  /** Best value if this task is also required under the current commitments. */
  forcedValue: number | null;
  opportunityCost: number | null;
  displacedIds: string[];
}

export interface PlannerResult {
  /** Null when required tasks cannot all fit. Never silently drops commitments. */
  plan: Plan | null;
  unconstrainedPlan: Plan;
  greedyPlan: Plan;
  explanations: TaskExplanation[];
  conflictIds: string[];
  statesExplored: number;
  feasibleSubsets: number;
  errors: string[];
}
