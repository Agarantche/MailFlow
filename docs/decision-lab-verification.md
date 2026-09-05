# Decision Lab: verification and limits

Run the standalone verifier from the project directory:

```sh
npm run test:planner
node scripts/test-planner-io.cjs
```

It uses the project's installed TypeScript compiler and Node's assertion module. It does not install dependencies, call a service, or generate compiled files. Its temporary TypeScript loader is restored immediately after loading the solver.

## What the verifier establishes

The test oracle independently enumerates dependency-valid ordered subsets, with no dynamic programming, state dominance, or imported scheduling helpers. For each ordering it scans integer minutes to locate the earliest legal placement. It records the best finish for each feasible task set, then independently selects the maximum-value schedule under the requested commitments. Equal-value schedules are compared by earliest finish; equivalent task orderings are allowed.

Earliest placement suffices for a fixed ordering: earlier completion leaves at least as much time for every later task, waiting is allowed, release times impose lower bounds, and deadlines impose upper bounds. The context-switch duration depends on the preceding task's stream, which a fixed ordering already determines. This argument depends on the scheduling assumptions below.

Every returned schedule also passes a separate direct validator. It checks unique task IDs, predecessor completion, blocked work, release times, inclusive deadlines, day boundaries, task duration, setup duration, calendar overlap, score sums, finish time, and work/setup totals. Required tasks must appear in a feasible committed plan. Conflicting commitments must actually be infeasible, and removing any single reported commitment must restore feasibility; this verifies inclusion-minimality, not minimum cardinality.

The suite compares the optimal score and finish time against the oracle, the count of feasible task subsets, and every task's forced-inclusion score and opportunity cost. It validates the greedy baseline as a feasible schedule and checks that its score cannot exceed the unconstrained optimum. Inputs are frozen to detect accidental mutation.

Duration checks use exact decimal rational arithmetic with BigInt, plus explicit expected-number regressions. This caught a real boundary defect during review: binary floating-point multiplication made `50 * 1.1` slightly larger than 55, so a naïve ceiling reserved 56 minutes for a 50-minute task with a 10% buffer. The solver now reserves exactly 55. Separate cases ensure a percentage just above the boundary still rounds upward, and a tiny positive buffer is not silently rounded away.

The verified scheduling run passes **213 cases**, including **408,703 independently enumerated ordered subsets** and **869 forced-inclusion comparisons**. The separate import/export suite passes **43 cases**, for **256 passing cases in total**. Counts are deterministic for the checked-in seed and fixtures.

## Application checks

The Next.js production build, TypeScript validation, and ESLint checks pass.
The running production page was exercised through browser controls: default and
shortened-day scores, increased buffers, required-task opportunity costs,
conflict recovery, keyboard tab navigation, overlapping calendar blocks, adding
a task, local persistence through an invalid workday, 24:00 input, and JSON
import. A 390-pixel viewport showed no horizontal page overflow.

The calendar button executed without a client error, but the in-app browser's
download-event observer timed out, so that transfer was not confirmed. The
exporter itself passes the file-format suite. A seven-event sample calendar and
its source scenario were also generated directly in `artifacts/` as usable files.

## Coverage

- Targeted examples exercise a greedy trap, deadline-sensitive ordering, meeting boundaries, indivisible work, release times, setup before release, setup interrupted by a meeting, context retained over idle time, rounding each buffered duration upward, blocked dependency chains, pinned prerequisites, conflicting pins, overlapping meetings, zero-value work, and meetings outside the working window.
- Invalid examples exercise dependency cycles, self-dependencies, missing references, duplicate task IDs, invalid times and durations, inverted intervals, negative buffers, nonfinite values, and the 16-task exact-search limit.
- 180 seeded cases combine up to seven tasks, three workstreams, dependencies, blockers, releases, deadlines, meeting overlaps, buffers, context switches, and commitments. Thirty roomy seven-task cases enumerate many complete permutations; the rest emphasize tight constraints. The random seed is `0x51a7e202`; a failure prints its complete reproducing input.
- A separate import/export suite checks JSON shape and size limits, removal of unknown fields, prototype-shaped input, identifier injection, escaped calendar text, invalid control characters, UTF-8 line folding of at most 75 octets, local event timestamps including setup time, leap dates, midnight rollover, invalid dates, and empty exports. It caught and verified fixes for unescaped lone carriage returns and rollover beyond a four-digit year. Graph feasibility belongs to the solver and is checked by the scheduling suite.

The command prints the number of cases, independently enumerated ordered subsets, and forced-inclusion comparisons. These are executable checks, not a proof covering every possible input or a benchmark against an earlier model.

## Model assumptions and practical limits

All times are integer minutes in a single local day. Tasks are indivisible and occupy one person's attention. Meetings are fixed unavailable intervals; touching endpoints do not overlap. A task may finish exactly at its deadline. A duration buffer is applied and rounded upward separately to each task.

Switching between workstreams adds setup immediately before the next task. That setup may precede the task's release but cannot overlap a meeting or preceding work. The first task has no setup, and context survives idle time and meetings. Dependencies require the predecessor's work to finish first. A blocked task makes its dependent work unavailable.

The objective is maximum summed user-assigned value, followed by earliest finish. It does not infer true business value from email, price lateness, model interruptions probabilistically, split work, or optimize multiple people. A buffer is a deterministic sensitivity setting, not a confidence interval. Counterfactual opportunity costs are exact within this model and the current commitments. A reported minimal conflict is one irreducible conflicting group; other groups may also exist.

The exact solver accepts at most 16 tasks because subset search grows exponentially. The independent exhaustive oracle is deliberately limited to seven-task random instances because it enumerates orderings. Larger production inputs would need a different capacity policy and broader performance testing.
