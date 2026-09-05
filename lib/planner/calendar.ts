import type { CalendarBlock } from "./types";

/** A clipped union for display and capacity accounting, matching solver exclusions. */
export function calendarWithinDay(blocks: CalendarBlock[], start: number, end: number): CalendarBlock[] {
  const merged: CalendarBlock[] = [];
  for (const block of blocks
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end))
    .map((item) => ({ ...item, start: Math.max(start, item.start), end: Math.min(end, item.end) }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end)) {
    const previous = merged[merged.length - 1];
    if (previous && block.start < previous.end) {
      previous.end = Math.max(previous.end, block.end);
      previous.title += ` + ${block.title}`;
      previous.id += `+${block.id}`;
    } else merged.push(block);
  }
  return merged;
}
