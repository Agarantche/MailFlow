"use client";

import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3,
  GitBranch, Info, Leaf, LockKeyhole, Mail, PencilLine, Plus, RotateCcw,
  SlidersHorizontal, Sparkles, Trash2, Upload, X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { LeafScene } from "@/frontend/components/leaf-scene";
import { MailFlowMark } from "@/frontend/components/mailflow-mark";
import { calendarWithinDay } from "@/lib/planner/calendar";
import { calendarExport, parsePlannerInput, type PlannerInput } from "@/lib/planner/io";
import { defaultOptions, demoMeetings, demoTasks } from "@/lib/planner/scenario";
import { bufferedDuration, formatTime, solvePlan } from "@/lib/planner/solver";
import type { CalendarBlock, Plan, PlannerOptions, PlannerTask, Workstream } from "@/lib/planner/types";

import styles from "./decision-lab.module.css";

const storageKey = "mailflow-decision-lab-v1";
const streamLabels: Record<Workstream, string> = { launch: "Launch", customer: "Customer", operations: "Operations" };
type View = "plan" | "tradeoffs" | "method";

function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function inputTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function minutesFromInput(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const timePattern = "(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00";
const validTime = /^(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)$/;

/** Native time inputs cannot represent the supported end-of-day value 24:00. */
function TimeField({ label, value, onChange }: { label: string; value: number; onChange: (minutes: number) => void }) {
  const [draft, setDraft] = useState(() => inputTime(value));
  useEffect(() => { setDraft(inputTime(value)); }, [value]);
  const hint = "Use 24-hour HH:MM format, from 00:00 through 24:00. Incomplete or invalid input reverts when you leave the field.";
  return <input aria-label={label} aria-description={hint} aria-invalid={!validTime.test(draft)} type="text" pattern={timePattern} title={hint} placeholder="HH:MM" maxLength={5} spellCheck={false} value={draft} onChange={(event) => {
    const next = event.target.value;
    setDraft(next);
    if (validTime.test(next)) onChange(minutesFromInput(next));
  }} onBlur={() => setDraft(inputTime(value))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />;
}

function freshInput(): PlannerInput {
  return { version: 1, tasks: demoTasks, meetings: demoMeetings, options: defaultOptions };
}

export function DecisionLab() {
  const [input, setInput] = useState<PlannerInput>(freshInput);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState(demoTasks[0]?.id ?? "");
  const [view, setView] = useState<View>("plan");
  const [showGreedy, setShowGreedy] = useState(false);
  const [notice, setNotice] = useState("");
  const [date, setDate] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { tasks, meetings, options } = input;
  const result = useMemo(() => solvePlan(tasks, meetings, options), [tasks, meetings, options]);
  const plan = result.plan;
  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0];
  const selectedExplanation = result.explanations.find((item) => item.taskId === selected?.id);
  const scheduledIds = new Set(plan?.entries.map((entry) => entry.taskId) ?? []);
  const hasCommitments = options.requiredIds.length > 0;
  const delta = plan ? plan.value - result.greedyPlan.value : 0;
  const totalWork = tasks.filter((task) => !task.blocked).reduce((sum, task) => sum + bufferedDuration(task, options.bufferPercent), 0);
  const displayMeetings = calendarWithinDay(meetings, options.start, options.end);
  const calendarMinutes = displayMeetings.reduce((sum, block) => sum + block.end - block.start, 0);
  const availableMinutes = Math.max(0, options.end - options.start - calendarMinutes);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const restored = parsePlannerInput(stored);
        // Preserve structurally valid drafts with temporary timing/graph errors;
        // the solver displays those errors so a reload never discards the work.
        setInput(restored);
        setSelectedId(restored.tasks[0]?.id ?? "");
      }
    } catch { setNotice("Saved plan could not be loaded. The sample inbox is ready."); }
    const today = new Date();
    setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Half-typed fields must not replace the last structurally valid draft.
    try { parsePlannerInput(JSON.stringify(input)); } catch { return; }
    try { localStorage.setItem(storageKey, JSON.stringify(input)); }
    catch { setNotice("Browser storage is unavailable. Export JSON to keep your changes."); }
  }, [input, ready]);

  function updateOptions(patch: Partial<PlannerOptions>) {
    setInput((current) => ({ ...current, options: { ...current.options, ...patch } }));
  }

  function updateTask(id: string, patch: Partial<PlannerTask>) {
    setInput((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task) }));
  }

  function toggleRequired(id: string) {
    updateOptions({ requiredIds: options.requiredIds.includes(id) ? options.requiredIds.filter((item) => item !== id) : [...options.requiredIds, id] });
  }

  function inspectTask(id: string) {
    setSelectedId(id);
    window.requestAnimationFrame(() => {
      const details = document.getElementById("request-details");
      if (!details) return;
      details.scrollTop = 0;
      if (window.matchMedia("(max-width: 1199px)").matches) {
        details.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
      }
    });
  }

  function resetDemo() {
    setInput(freshInput());
    setSelectedId(demoTasks[0]?.id ?? "");
    setShowGreedy(false);
    setNotice("Sample restored. All figures are computed from these fictional messages.");
  }

  function addTask() {
    if (tasks.length >= 16) return;
    const id = `task-${crypto.randomUUID().slice(0, 8)}`;
    const task: PlannerTask = {
      id, title: "New task", sender: "Your task", excerpt: "Add the request or source context here.",
      rationale: "Set an impact score that reflects the value of completing this work.",
      stream: "operations", duration: 30, value: 15, deadline: options.end, release: options.start, dependencies: []
    };
    setInput((current) => ({ ...current, tasks: [...current.tasks, task] }));
    setSelectedId(id);
    setNotice("Task added. Select its card to edit the request, timing, and impact.");
  }

  function removeTask(id: string) {
    setInput((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id).map((task) => ({ ...task, dependencies: task.dependencies.filter((dep) => dep !== id) })),
      options: { ...current.options, requiredIds: current.options.requiredIds.filter((dep) => dep !== id) }
    }));
    setNotice("Task removed, including its links as a prerequisite. Reset sample to restore the demo.");
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 100_000) throw new Error("Use a plan smaller than 100 KB.");
      const imported = parsePlannerInput(await file.text());
      const checked = solvePlan(imported.tasks, imported.meetings, imported.options);
      if (checked.errors.length) throw new Error(checked.errors.join(" "));
      setInput(imported);
      setSelectedId(imported.tasks[0]?.id ?? "");
      setNotice("Your plan is loaded. Changes are saved in this browser.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to import this plan."); }
    if (fileInput.current) fileInput.current.value = "";
  }

  function exportCalendar() {
    if (!plan) return;
    try {
      download(calendarExport(plan, tasks, date), `mailflow-plan-${date}.ics`, "text/calendar;charset=utf-8");
      setNotice("Calendar file downloaded. Times use your calendar’s local timezone; existing meetings are not duplicated.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not export calendar."); }
  }

  return (
    <div className={styles.lab}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="MailFlow home"><MailFlowMark className={styles.brandMark} /><span>MailFlow<span className={styles.brandPeriod}>.</span></span></Link>
        <nav className={styles.navigation} aria-label="Main navigation"><Link href="/">Home</Link><Link href="/dashboard">Inbox</Link><Link href="/lab" aria-current="page" className={styles.currentNav}>Day planner</Link></nav>
        <div className={styles.headerActions}>
          <span className={styles.localBadge}><span /> Your planning space</span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroAtmosphere} aria-hidden="true"><LeafScene variant="ambient" className={styles.leafCanvas} /></div>
          <div className={styles.heroCopy}>
            <p className={styles.welcome}>A little clarity. A little breathing room.</p>
            <h1>Make space for your day.</h1>
            <p>Bring your requests into focus. Make a plan that respects your time, and see what changes when your priorities do.</p>
          </div>
        </section>

        <section className={styles.planningTools} aria-label="Set up your day">
        <div className={styles.toolsHeading}><div><SlidersHorizontal size={19} /><h2>Your day, on your terms.</h2></div><button className={styles.textButton} onClick={resetDemo}><RotateCcw size={14} /> Reset sample</button></div>
        <section className={styles.controlBar} aria-label="Planning constraints">
          <label className={styles.timeControl}>Start<TimeField label="Workday start" value={options.start} onChange={(start) => updateOptions({ start })} /></label>
          <label className={styles.timeControl}>Finish by<TimeField label="Workday finish" value={options.end} onChange={(end) => updateOptions({ end })} /></label>
          <label className={styles.rangeControl}><span>Extra time per task <strong>{options.bufferPercent}%</strong></span><input aria-label="Time buffer" type="range" min="0" max="100" step="1" value={options.bufferPercent} onChange={(event) => updateOptions({ bufferPercent: Number(event.target.value) })} /></label>
          <label className={styles.switchControl}>Time to switch focus<select aria-label="Context switch time" value={options.switchMinutes} onChange={(event) => updateOptions({ switchMinutes: Number(event.target.value) })}>{Array.from(new Set([0, 5, 10, 15, options.switchMinutes])).sort((a, b) => a - b).map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}</select></label>
          <div className={styles.capacityNote}><Clock3 size={18} /><div><strong>{availableMinutes} minutes to work with</strong><span>{totalWork} requested, including your buffer</span></div></div>
        </section>

        <div className={styles.scenarios}>
          <span>Explore a different day</span>
          <button onClick={() => { updateOptions({ end: 900 }); setNotice("Day shortened to 3 PM. All commitments and deadlines still apply."); }}>Leave at 3 PM <ArrowRight size={12} /></button>
          <button onClick={() => { updateOptions({ bufferPercent: 35 }); setNotice("Every task now includes a 35% time buffer. This is a stress test, not a probability estimate."); }}>Everything takes longer <ArrowRight size={12} /></button>
          <button onClick={() => { updateOptions({ requiredIds: tasks.filter((task) => !task.blocked && result.explanations.find((item) => item.taskId === task.id)?.status !== "blocked").map((task) => task.id) }); setNotice("Every request without an external blocker is now required. Conflicts are explained below."); }}>Say yes to everything <ArrowRight size={12} /></button>
        </div>
        </section>

        {notice && <div className={styles.notice} role="status"><Info size={16} /><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={15} /></button></div>}
        {result.errors.length > 0 && <div className={styles.error} role="alert"><strong>Check the inputs</strong><p>{result.errors.join(" ")}</p></div>}
        {!plan && result.errors.length === 0 && <section className={styles.conflict} role="alert">
          <div><h2>Let’s make a little more room.</h2><p>These commitments cannot fit together: {result.conflictIds.map((id) => tasks.find((task) => task.id === id)?.title ?? id).join(" + ")}</p><small>Removing any one requirement makes this group feasible. Other conflicts may remain.</small></div>
          <button className={styles.primaryButton} onClick={() => updateOptions({ requiredIds: [] })}>Release all commitments <ArrowRight size={15} /></button>
        </section>}

        <section className={styles.planSummary} aria-label="Plan results" aria-live="polite">
          <div><span className={styles.summaryIcon}>{plan ? <Check size={19} /> : <Info size={19} />}</span><p>{plan ? <><strong>{plan.entries.length} requests, thoughtfully placed.</strong><span> {plan.value} impact points protected in your day.</span></> : <><strong>Your plan needs a little attention.</strong><span> Resolve the inputs or commitments to continue.</span></>}</p></div>
          {plan && <button onClick={() => setView("tradeoffs")} className={styles.summaryLink}>{delta >= 0 ? "+" : ""}{delta} pts {hasCommitments ? "vs. deadline-first without commitments" : "vs. deadline-first"}<ArrowUpRight size={15} /></button>}
        </section>

        <div className={styles.workspace}>
          <aside className={styles.inbox}>
            <div className={styles.sectionHeading}><h2>Your requests <span>{tasks.length}</span></h2><button aria-label="Add task" disabled={tasks.length >= 16} className={styles.iconButton} onClick={addTask}><Plus size={18} /></button></div>
            <p className={styles.sectionHint}>Open a request to adjust it. Lock the ones you’ve committed to.</p>
            <div className={styles.taskList}>
              {tasks.map((task) => {
                const explanation = result.explanations.find((item) => item.taskId === task.id);
                const required = options.requiredIds.includes(task.id);
                return <div key={task.id} className={`${styles.taskCard} ${selected?.id === task.id ? styles.selectedTask : ""}`} data-stream={task.stream}>
                  <button className={styles.taskSelect} onClick={() => inspectTask(task.id)} aria-pressed={selected?.id === task.id} aria-label={`Inspect ${task.title}`}>
                    <div className={styles.taskTop}><span>{task.sender}</span><span>{task.value} pts</span></div>
                    <h3>{task.title}</h3>
                    <div className={styles.taskMeta}><span className={styles.streamDot} /><span>{bufferedDuration(task, options.bufferPercent)} min</span><span>by {formatTime(task.deadline)}</span>{task.dependencies.length > 0 && <GitBranch size={12} />}</div>
                    <div className={styles.taskStatus} data-status={scheduledIds.has(task.id) ? "scheduled" : explanation?.status}>{scheduledIds.has(task.id) ? <Check size={13} /> : task.blocked ? <LockKeyhole size={13} /> : <span className={styles.statusDash}>—</span>}{scheduledIds.has(task.id) ? "In your plan" : explanation?.status === "blocked" ? "Waiting on someone" : explanation?.status === "impossible" ? "Cannot fit" : "Deferred"}<span className={styles.inspectAffordance}>Details <ArrowUpRight size={12} /></span></div>
                  </button>
                  <button className={`${styles.pinButton} ${required ? styles.pinned : ""}`} title={required ? "Release commitment" : "Require in plan"} aria-label={`${required ? "Release" : "Require"} ${task.title}`} aria-pressed={required} onClick={() => toggleRequired(task.id)}><LockKeyhole size={14} /></button>
                </div>;
              })}
              {!tasks.length && <div className={styles.emptyState}>An empty inbox. Add a task or import a plan to begin.</div>}
            </div>
            <div className={styles.inboxFooter}><div><span>Up to 16 tasks · locally saved</span>{selected && <><br /><a href="#request-details" className={styles.textButton}>Edit selected request ↓</a></>}</div><button className={styles.textButton} onClick={addTask} disabled={tasks.length >= 16}><Plus size={13} /> Add task</button></div>
          </aside>

          <section className={styles.workbench}>
            <div className={styles.planHeader}>
              <div><h2>A day with room to focus.</h2><p>{formatTime(options.start)}–{formatTime(options.end)} · Your planned work and fixed commitments</p></div>
              <span className={styles.verifiedBadge}><span /> {plan ? "Feasible plan" : "Needs attention"}</span>
            </div>
            <div className={styles.tabs} role="tablist" aria-label="Plan views">
              {([['plan', 'Day plan'], ['tradeoffs', 'Other possibilities'], ['method', 'How it works']] as const).map(([id, title], index) => <button key={id} id={`tab-${id}`} role="tab" tabIndex={view === id ? 0 : -1} aria-selected={view === id} aria-controls={`panel-${id}`} className={view === id ? styles.activeTab : ""} onClick={() => setView(id)} onKeyDown={(event) => {
                const views: View[] = ["plan", "tradeoffs", "method"];
                const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
                if (next === null) return;
                event.preventDefault();
                setView(views[next]);
                document.getElementById(`tab-${views[next]}`)?.focus();
              }}>{title}</button>)}
            </div>
            <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`} className={styles.viewPanel}>
              {view === "plan" && <>
                <div className={styles.timelineToolbar}><div className={styles.legend}>{(Object.keys(streamLabels) as Workstream[]).map((stream) => <span key={stream} data-stream={stream}><i />{streamLabels[stream]}</span>)}</div><label className={styles.compareToggle}><input type="checkbox" checked={showGreedy} onChange={(event) => setShowGreedy(event.target.checked)} /> Compare deadline-first</label></div>
                {!plan ? <div className={styles.emptyState}><GitBranch size={25} /><h3>A full calendar can’t fix conflicting promises.</h3><p>Release a commitment, extend the day, or revise a duration. No invalid plan is presented as a solution.</p></div> : <>
                  <DayStrip plan={plan} tasks={tasks} meetings={displayMeetings} options={options} />
                  <div className={`${styles.timelineColumns} ${showGreedy ? styles.comparing : ""}`}>
                    <div><div className={styles.timelineTitle}><span>Your considered plan</span><strong>{plan.value} pts</strong></div><Timeline plan={plan} tasks={tasks} meetings={displayMeetings} options={options} selectedId={selected?.id} onSelect={inspectTask} /></div>
                    {showGreedy && <div><div className={styles.timelineTitle}><span>Deadline-first{hasCommitments ? " · without commitments" : ""}</span><strong>{result.greedyPlan.value} pts</strong></div><Timeline plan={result.greedyPlan} tasks={tasks} meetings={displayMeetings} options={options} onSelect={inspectTask} /></div>}
                  </div>
                  <div className={styles.planFootnote}><Check size={14} /><span>Deadlines met. Prerequisites respected. {plan.switchMinutes} min for switching included.</span></div>
                </>}
              </>}
              {view === "tradeoffs" && <div className={styles.tradeoffs}>
                <h3>What would “yes” cost?</h3><p>For each deferred request, the solver finds the best plan that also includes it. The difference is the impact you give up, with your current commitments held fixed.</p>
                {result.explanations.filter((item) => item.status !== "scheduled").map((item) => {
                  const task = tasks.find((entry) => entry.id === item.taskId)!;
                  return <article key={item.taskId} className={styles.tradeoffCard}><div><button onClick={() => inspectTask(task.id)}>{task.title} <ArrowRight size={14} /></button><span>{item.opportunityCost === null ? "Unavailable" : item.opportunityCost === 0 ? "Same impact" : `${item.opportunityCost} points given up`}</span></div><p>{item.reason}</p>{item.displacedIds.length > 0 && <small>Would displace: {item.displacedIds.map((id) => tasks.find((entry) => entry.id === id)?.title).join(", ")}.</small>}<button disabled={item.forcedValue === null || hasCommitments && options.requiredIds.includes(task.id)} className={styles.textButton} onClick={() => { toggleRequired(task.id); setView("plan"); }}>Require this request <ArrowRight size={13} /></button></article>;
                })}
                {plan && result.explanations.every((item) => item.status === "scheduled") && <div className={styles.emptyState}>Every request fits. Try a shorter day or a larger buffer.</div>}
              </div>}
              {view === "method" && <div className={styles.method}>
                <div className={styles.methodIntro}><GitBranch size={24} /><h3>A plan you can question.</h3><p>The messages are fictional. The optimization is real, deterministic, and runs locally. You control the estimates and impact scores.</p></div>
                <div className={styles.methodGrid}><div><strong>{result.statesExplored.toLocaleString()}</strong><span>feasible states explored</span></div><div><strong>{result.feasibleSubsets.toLocaleString()}</strong><span>feasible task combinations</span></div></div>
                <ol><li><strong>Model the promises.</strong> Each request has a duration, value, deadline, earliest start, workstream, and prerequisites. A blocked request stays blocked.</li><li><strong>Search the combinations.</strong> Dynamic programming retains the earliest completion for each completed set and last workstream. An earlier equivalent state can always wait to reproduce a later one.</li><li><strong>Choose the best feasible set.</strong> Maximize total impact while honoring every commitment; break ties by finishing earlier. Work and context setup cannot cross calendar blocks.</li><li><strong>Make the trade-off inspectable.</strong> Force a deferred task into the solution to calculate its opportunity cost. If commitments conflict, find one inclusion-minimal conflicting group.</li></ol>
                <details open><summary>Assumptions & limits <ChevronDown size={15} /></summary><p>One person, one local day, up to 16 indivisible tasks. Values add together and are judgments, not money or predicted outcomes. Buffer increases all estimates; it does not represent a confidence level. Switching is charged between workstreams, including across meetings. First task needs no setup. Setup may precede a task’s earliest start. Dependencies must finish first. Meetings are fixed.</p><p>The deadline-first comparison picks the feasible next task with the earliest deadline. It honors timing and prerequisites but does not enforce your locks. Optimality applies only to this model; it cannot correct bad estimates or missing context. Message interpretation here is authored sample data, not live AI extraction.</p></details>
              </div>}
            </div>
          </section>

            {selected && <section id="request-details" className={styles.inspector} aria-label="Selected request details">
              <div className={styles.inspectorKicker}><span><PencilLine size={15} /> Request details</span><span data-stream={selected.stream} className={styles.streamPill}>{streamLabels[selected.stream]}</span></div>
              <div className={styles.inspectorHeading}><h3>{selected.title}</h3></div>
              <button className={`${styles.commitmentButton} ${options.requiredIds.includes(selected.id) ? styles.isCommitted : ""}`} onClick={() => toggleRequired(selected.id)} aria-pressed={options.requiredIds.includes(selected.id)}><LockKeyhole size={15} />{options.requiredIds.includes(selected.id) ? "Committed to this request" : "Make this a commitment"}<span>{options.requiredIds.includes(selected.id) ? "Release" : "Lock in"}</span></button>
              <blockquote><Mail size={16} /><div><p>“{selected.excerpt}”</p><cite>{selected.sender} · source context</cite></div></blockquote>
              <div className={styles.reason}><Sparkles size={16} /><p>{selectedExplanation?.reason ?? "Correct the inputs to compute this request’s place in the plan."}</p></div>
              <div className={styles.editGrid}>
                <label>Estimate, min<input aria-label="Task duration" type="number" min="1" max="1440" value={selected.duration} onChange={(event) => event.target.value && updateTask(selected.id, { duration: Math.max(1, Math.min(1440, Math.round(Number(event.target.value)))) })} /></label>
                <label>Impact, points<input aria-label="Task impact" type="number" min="0" max="1000" value={selected.value} onChange={(event) => event.target.value && updateTask(selected.id, { value: Math.max(0, Math.min(1000, Math.round(Number(event.target.value)))) })} /></label>
                <label>Deadline<TimeField key={`deadline-${selected.id}`} label="Task deadline" value={selected.deadline} onChange={(deadline) => updateTask(selected.id, { deadline })} /></label>
                <label>Earliest start<TimeField key={`release-${selected.id}`} label="Task earliest start" value={selected.release} onChange={(release) => updateTask(selected.id, { release })} /></label>
              </div>
              <p className={styles.rationale}>{selected.rationale} <span>Planned duration: {bufferedDuration(selected, options.bufferPercent)} min with buffer.</span></p>
              <div className={styles.dependencyLine}><GitBranch size={14} /><span>{selected.dependencies.length ? `After: ${selected.dependencies.map((id) => tasks.find((task) => task.id === id)?.title ?? id).join(" → ")}` : "No prerequisites"}</span></div>
              {selected.blocked && <div className={styles.blockedNote}><LockKeyhole size={14} /><span>{selected.blocked}</span><button className={styles.textButton} onClick={() => updateTask(selected.id, { blocked: undefined })}>Mark resolved <Check size={13} /></button></div>}
              <details className={styles.moreEdit}><summary>Edit request & dependencies <ChevronDown size={14} /></summary><div className={styles.moreEditFields}>
                <label>Request title<input aria-label="Task title" value={selected.title} maxLength={180} onChange={(event) => updateTask(selected.id, { title: event.target.value })} /></label>
                <label>Source context<textarea aria-label="Task source context" rows={3} maxLength={3000} value={selected.excerpt} onChange={(event) => updateTask(selected.id, { excerpt: event.target.value })} /></label>
                <label>Workstream<select aria-label="Task workstream" value={selected.stream} onChange={(event) => updateTask(selected.id, { stream: event.target.value as Workstream })}>{Object.entries(streamLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
                <label>Blocked by (leave empty if ready)<input aria-label="Task blocker" value={selected.blocked ?? ""} maxLength={500} onChange={(event) => updateTask(selected.id, { blocked: event.target.value || undefined })} /></label>
                <fieldset><legend>Complete these tasks first</legend>{tasks.filter((task) => task.id !== selected.id).map((task) => <label className={styles.dependencyCheck} key={task.id}><input type="checkbox" checked={selected.dependencies.includes(task.id)} onChange={(event) => updateTask(selected.id, { dependencies: event.target.checked ? [...selected.dependencies, task.id] : selected.dependencies.filter((id) => id !== task.id) })} />{task.title}</label>)}</fieldset>
                <button className={styles.deleteButton} onClick={() => removeTask(selected.id)}><Trash2 size={14} /> Remove request and its prerequisite links</button>
              </div></details>
            </section>}
        </div>

        <section className={styles.exportBar}>
          <div><h2>Good plans go with you.</h2><p>Make room in your calendar. Save your plan, or bring another one in.</p></div>
          <div className={styles.exportActions}><label>Calendar date<input aria-label="Calendar export date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className={styles.primaryButton} disabled={!plan || !plan.entries.length || !date} onClick={exportCalendar}><ArrowDownToLine size={16} /> Export calendar</button><button className={styles.secondaryButton} onClick={() => download(JSON.stringify(input, null, 2), "mailflow-scenario.json", "application/json")}><ArrowDownToLine size={14} /> JSON</button><button className={styles.secondaryButton} onClick={() => fileInput.current?.click()}><Upload size={14} /> Import</button><input ref={fileInput} className={styles.hiddenInput} aria-label="Import scenario JSON" type="file" accept=".json,application/json" onChange={(event) => void importFile(event.target.files?.[0])} /></div>
        </section>
        <details className={styles.calendarEditor}><summary><Clock3 size={15} /> Edit fixed calendar blocks <ChevronDown size={14} /></summary><div>{meetings.map((block) => <div key={block.id} className={styles.calendarEditRow}><input aria-label={`Title for ${block.title}`} value={block.title} onChange={(event) => setInput((current) => ({ ...current, meetings: current.meetings.map((item) => item.id === block.id ? { ...item, title: event.target.value } : item) }))} /><TimeField label={`Start of ${block.title}`} value={block.start} onChange={(start) => setInput((current) => ({ ...current, meetings: current.meetings.map((item) => item.id === block.id ? { ...item, start } : item) }))} /><TimeField label={`End of ${block.title}`} value={block.end} onChange={(end) => setInput((current) => ({ ...current, meetings: current.meetings.map((item) => item.id === block.id ? { ...item, end } : item) }))} /><button aria-label={`Remove ${block.title}`} className={styles.iconButton} onClick={() => setInput((current) => ({ ...current, meetings: current.meetings.filter((item) => item.id !== block.id) }))}><Trash2 size={14} /></button></div>)}<button className={styles.textButton} disabled={meetings.length >= 30} onClick={() => setInput((current) => ({ ...current, meetings: [...current.meetings, { id: `meeting-${crypto.randomUUID().slice(0, 8)}`, title: "New calendar block", start: options.start, end: Math.min(options.start + 30, options.end) }] }))}><Plus size={14} /> Add calendar block</button></div></details>
        <footer className={styles.footer}><span><Leaf size={16} /> A little more room, with MailFlow.</span><p>Sample requests are fictional. Your edits stay in this browser.</p><Link href="/dashboard">Back to your inbox <ArrowUpRight size={14} /></Link></footer>
      </main>
    </div>
  );
}

function DayStrip({ plan, tasks, meetings, options }: { plan: Plan; tasks: PlannerTask[]; meetings: CalendarBlock[]; options: PlannerOptions }) {
  const duration = Math.max(1, options.end - options.start);
  return <div className={styles.dayStripWrap} aria-label="Proportional overview of the working day"><div className={styles.dayStrip}>
    {meetings.filter((meeting) => meeting.end > options.start && meeting.start < options.end).map((meeting) => <span key={meeting.id} className={styles.stripMeeting} title={`${meeting.title}: ${formatTime(meeting.start)}–${formatTime(meeting.end)}`} style={{ left: `${Math.max(0, (meeting.start - options.start) / duration * 100)}%`, width: `${(Math.min(meeting.end, options.end) - Math.max(meeting.start, options.start)) / duration * 100}%` }} />)}
    {plan.entries.map((entry) => <span key={entry.taskId} data-stream={tasks.find((task) => task.id === entry.taskId)?.stream} className={styles.stripTask} title={`${tasks.find((task) => task.id === entry.taskId)?.title}: ${formatTime(entry.start)}–${formatTime(entry.end)}`} style={{ left: `${(entry.start - options.start) / duration * 100}%`, width: `${(entry.end - entry.start) / duration * 100}%` }} />)}
  </div><div className={styles.stripLabels}><span>{formatTime(options.start)}</span><span>Your day at a glance</span><span>{formatTime(options.end)}</span></div></div>;
}

function Timeline({ plan, tasks, meetings, options, selectedId, onSelect }: { plan: Plan; tasks: PlannerTask[]; meetings: CalendarBlock[]; options: PlannerOptions; selectedId?: string; onSelect: (id: string) => void }) {
  const events = [
    ...plan.entries.map((entry) => ({ id: entry.taskId, title: tasks.find((task) => task.id === entry.taskId)?.title ?? "Task", start: entry.setupStart, workStart: entry.start, end: entry.end, task: tasks.find((task) => task.id === entry.taskId) })),
    ...meetings.filter((meeting) => meeting.end > options.start && meeting.start < options.end).map((meeting) => ({ id: `calendar-${meeting.id}`, title: meeting.title, start: Math.max(meeting.start, options.start), workStart: meeting.start, end: Math.min(meeting.end, options.end), task: undefined }))
  ].sort((a, b) => a.start - b.start);
  let previousEnd = options.start;
  return <div className={styles.timeline}>
    {events.map((event) => {
      const idle = event.start - previousEnd;
      previousEnd = event.end;
      return <div key={event.id}>
        {idle > 0 && <div className={styles.idleRow}><span />{idle} min open</div>}
        {event.task ? <div className={styles.timelineRow} data-stream={event.task.stream}><span className={styles.timeLabel}>{formatTime(event.start)}</span><div className={styles.timelineMarker} /><button className={`${styles.timelineTask} ${selectedId === event.id ? styles.timelineSelected : ""}`} onClick={() => onSelect(event.id)}>
          {event.workStart > event.start && <div className={styles.setupLabel}>{event.workStart - event.start} min to switch context · work starts {formatTime(event.workStart)}</div>}
          <div><strong>{event.title}</strong><span>{event.task.value} pts</span></div><p>{formatTime(event.workStart)}–{formatTime(event.end)}<span>·</span>{event.end - event.workStart} min<span>·</span>{streamLabels[event.task.stream]}</p>
        </button></div> : <div className={`${styles.timelineRow} ${styles.meetingRow}`}><span className={styles.timeLabel}>{formatTime(event.start)}</span><div className={styles.timelineMarker} /><div className={styles.meetingBlock}><Clock3 size={14} /><strong>{event.title}</strong><span>{event.end - event.start} min · fixed</span></div></div>}
      </div>;
    })}
    {previousEnd < options.end && <div className={styles.idleRow}><span />{options.end - previousEnd} min open</div>}
    <div className={styles.dayEnd}><span>{formatTime(options.end)}</span><span>Close the laptop.</span><Check size={13} /></div>
  </div>;
}
