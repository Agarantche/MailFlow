import { z } from "zod";

import type { CalendarBlock, Plan, PlannerOptions, PlannerTask } from "./types";

const minute = z.number().int().min(0).max(1440);
const identifier = z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/);
const inputSchema = z.object({
  version: z.literal(1),
  tasks: z.array(z.object({
    id: identifier,
    title: z.string().trim().min(1).max(180),
    sender: z.string().max(180),
    excerpt: z.string().max(3000),
    rationale: z.string().max(1000),
    stream: z.enum(["launch", "customer", "operations"]),
    duration: z.number().int().min(1).max(1440),
    value: z.number().int().min(0).max(1000),
    deadline: minute,
    release: minute,
    dependencies: z.array(identifier).max(16),
    blocked: z.string().max(500).optional()
  })).max(16),
  meetings: z.array(z.object({
    id: identifier,
    title: z.string().min(1).max(180),
    start: minute,
    end: minute
  })).max(30),
  options: z.object({
    start: minute,
    end: minute,
    bufferPercent: z.number().int().min(0).max(100),
    switchMinutes: z.number().int().min(0).max(60),
    requiredIds: z.array(identifier).max(16)
  })
});

export interface PlannerInput {
  version: 1;
  tasks: PlannerTask[];
  meetings: CalendarBlock[];
  options: PlannerOptions;
}

export function parsePlannerInput(text: string): PlannerInput {
  if (text.length > 100_000) throw new Error("This file is too large. Use a plan smaller than 100 KB.");
  let input: unknown;
  try { input = JSON.parse(text); } catch { throw new Error("This file is not valid JSON."); }
  const result = inputSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Invalid plan at ${issue.path.join(".") || "root"}: ${issue.message}`);
  }
  return result.data;
}

function escapeCalendar(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** RFC-style folding by UTF-8 bytes; continuation whitespace counts toward 75. */
function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      lines.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  lines.push(current);
  return lines.join("\r\n");
}

/** Floating local times deliberately match the date/time visible in the planner. */
export function calendarExport(plan: Plan, tasks: PlannerTask[], date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a calendar date before exporting.");
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error("Choose a valid calendar date before exporting.");
  }
  const compactDate = date.replace(/-/g, "");
  const timestamp = (minutes: number) => {
    if (minutes === 1440) {
      const next = new Date(`${date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      if (next.getUTCFullYear() > 9999) throw new Error("The calendar end date must be before year 10000.");
      return `${next.toISOString().slice(0, 10).replace(/-/g, "")}T000000`;
    }
    return `${compactDate}T${String(Math.floor(minutes / 60)).padStart(2, "0")}${String(minutes % 60).padStart(2, "0")}00`;
  };
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MailFlow//Decision Lab//EN", "CALSCALE:GREGORIAN"];
  for (const entry of plan.entries) {
    const task = tasks.find((item) => item.id === entry.taskId);
    if (!task) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${entry.taskId}-${compactDate}@decision-lab.mailflow.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${timestamp(entry.setupStart)}`,
      `DTEND:${timestamp(entry.end)}`,
      `SUMMARY:${escapeCalendar(task.title)}`,
      `DESCRIPTION:${escapeCalendar(`${task.rationale}\nImpact: ${task.value} points. Includes ${entry.start - entry.setupStart} minutes of context setup.\n${task.excerpt}`)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldCalendarLine).join("\r\n")}\r\n`;
}
