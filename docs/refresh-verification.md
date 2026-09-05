# MailFlow visual refresh verification

The refresh replaces the landing, inbox, connection, settings, message detail, and planner presentation. The leaf scene is drawn locally from cached procedural sprites; Cabinet Grotesk and the inline botanical illustration are local assets.

## Automated checks

- Optimized Next.js production build, lint, and TypeScript validation passed.
- Planner: 213 cases, including 180 seeded scenarios; an independent search explored 408,703 ordered subsets and checked 869 forced-inclusion comparisons.
- Scenario/calendar import and export: 43 cases.
- Edited reply route: 21 isolated checks covering exact text preservation, validation, ownership, authentication, demo isolation, risk flags, and generation quotas. Run `npm run test:reply`.

## Browser checks

- Desktop 1440×900: hero canvas renders; pointer drag and pause/resume controls respond; leaf animation toggle state is correct. No landing console warnings or errors were observed.
- Landing sample email navigation and original/summary switching work. Inline artwork loads from a local SVG.
- Tablet 768×1024: the navigation menu exposes all main destinations.
- Phone 390×844: landing, inbox, settings, message details, and planner fit the viewport. Feature disclosures open and close, inbox filtering/search/sort work, and the message preview fills the viewport with keyboard dismissal.
- The planner preserves 331 points for the default scenario and 262 when leaving at 15:00. Task selection reveals its inspector, and the comparison shortcut selects Other possibilities.
- A multiline manually edited demo reply remains exactly unchanged after Save to Gmail; the UI confirms the save is simulated.
- Quick actions navigate to the connection page. The preview clearly identifies that live Google connection is not configured.
- The final production server was restarted on localhost:3000 and the new landing page was opened successfully.

Reduced-motion behavior and animation lifecycle cleanup were reviewed in source. Live Gmail/OpenAI calls were not exercised; browser actions used the demo environment.
