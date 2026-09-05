# MailFlow Decision Lab

A working Day planner at `/lab`: turn a deliberately difficult, fictional
launch-day inbox into a feasible day, compare it with an urgency-first plan, and
inspect the consequences of committing to a different task.

## Try it

From the project directory, run `npm install` if dependencies are missing, then
`npm run dev` and open `http://localhost:3000/lab`.

For a production preview, stop the development server, run `npm run build`, then
`npm run preview:background`. The preview binds to this computer only, at port
3000. Development and production builds share Next.js's `.next` directory, so do
not run a production build while the development server is writing to it.

- Start with the default 09:00–17:00 day, 15% extra time per task, and 10 minutes
  to switch focus. Turn on **Compare deadline-first** in the Day plan tab.
- Open a request to see **Request details**, adjust its estimate or impact, or
  make it a commitment. The inspector sits beside the plan on wide screens;
  selecting a task brings it into view on smaller screens.
- Require an early, low-value request and inspect which work it displaces in
  **Other possibilities**. **How it works** explains the model and its limits.
- Require the vendor approval task to see an unresolved external blocker make a
  commitment infeasible. Its dependent seat order is blocked too.
- Shorten the day to 15:00, or raise the duration buffer to 35%, and see the plan
  respond to lost capacity. Those are stress scenarios, not forecasts.
- Change a value judgment and solve again. The optimizer can reconcile priorities;
  it cannot decide what your priorities ought to be.

The sample contains twelve authored requests, three fixed calendar blocks, a
three-task release chain, two time-gated tasks, and an external approval blocker.
Names, source excerpts, estimates, and scores are all synthetic. The page does not
extract tasks with AI, connect to Gmail, send messages, or change a real calendar.

For the unchanged sample, the default optimum is **331 points**, versus **225**
for urgency-first: 106 points, or about 47%, more value under the authored scoring.
Requiring the six-point invoice request reduces the optimum to 285 points because
the 52-point pilot-customer task no longer fits. A 15:00 finish yields 262 points;
a 35% duration buffer yields 255. These are reproducible outputs of these inputs,
not estimates of real-world productivity gains.

`artifacts/decision-lab-plan.ics` is a generated sample for September 4, 2026;
`artifacts/decision-lab-scenario.json` is its editable input snapshot. Use the
page's date field to export a plan for your chosen local calendar date.

## Model and exactness

One person performs one task at a time. Tasks cannot be split, overlap meetings,
or finish after their deadline or the workday's end. A task becomes available at
its release time and only after every prerequisite finishes. A direct external
blocker prevents completion, as does an unavailable prerequisite.

Each task reserves `ceil(estimated minutes × (1 + buffer percent / 100))` minutes.
Changing workstream adds setup time immediately before the task; setup and work
must fit together in a free calendar interval. Setup may begin before a task's
release time, but the task itself may not. The first task has no setup cost, and
workstream context persists across breaks. The buffer extends task durations; it
does not reserve a separate percentage of the day.

The objective is the sum of selected task values, with earlier completion breaking
ties. Scores are user judgments, not money, measured productivity, or predictions.
Prerequisite tasks contribute their own scores, so those scores should represent
distinct value to avoid counting the same outcome twice. Missing a cutoff makes
a task unavailable for this day's plan; it does not claim the task is worthless
forever. There is no lateness penalty, partial credit, or uncertain travel time.

The solver keeps the earliest feasible finish for every completed-task subset and
last workstream. An earlier finish dominates a later finish in that state because
the planner can wait for a release or a calendar opening. Exploring every legal
next task therefore finds an optimum **within this finite, deterministic model**.
The implementation limits inputs to 16 tasks; subset search is exponential and
is intentionally a small-day planner.

Counterfactual explanations use the same feasible solutions: require an omitted
task, optimize again under the existing commitments, and compare the resulting
value and selected tasks. Opportunity cost is that value difference, not the
omitted task's duration. An impossible commitment produces no plan. A reported
conflicting commitment set is inclusion-minimal: removing any one member resolves
that conflict. It is not guaranteed to contain the fewest members among all
possible conflicts.

The urgency-first baseline uses the same feasibility constraints and padded
durations, but takes available requests by earliest deadline. The comparison is
an illustration on one intentionally challenging scenario, not a benchmark of
general productivity or of previous AI models.

## Code map

- `lib/planner/types.ts`: shared task, calendar, result, and explanation contracts.
- `lib/planner/scenario.ts`: transparent sample inputs and default settings.
- `lib/planner/solver.ts`: deterministic search and explanations.
- `app/lab`: the public route, with no account required.
- `frontend/components/decision-lab.tsx`: interactive controls, comparison, and schedule presentation.
- `lib/planner/io.ts`: validated JSON imports and local-time calendar exports.
- `lib/planner/calendar.ts`: clipped calendar union for display and capacity.

The useful separation is between authored evidence, editable judgments, and a
checkable scheduling calculation. A polished narrative cannot silently override
a deadline, invent an external approval, or drop a required commitment.
