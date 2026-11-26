# Morrow 3.0 Architecture and Implementation Plan

## Existing architecture

- `index.html` is the single-page shell. Existing screens are sections selected by hash routes and `data-route` controls.
- `app.js` owns the destination catalogue, local application state, storage reads/writes, rendering, and one delegated click listener plus form-specific listeners. The app is a vanilla JavaScript script, not a module-based framework.
- `styles.css` contains the Morrow design system, responsive breakpoints, theme variables, and print rules.
- `README.md` documents the current prototype and presentation flow.
- There is no package manifest, bundler, automated test runner, API server, or authentication layer.
- Existing persisted data includes `morrow-saved`, `morrow-trips`, `morrow-feedback`, `morrow-tasks`, `morrow-compare`, `morrow-recent`, `morrow-profile`, and `morrow-theme`.

## Architectural constraints

1. Keep the existing screens and local data; add routes, sections, and handlers rather than replacing them.
2. Keep the app runnable as static files. No server, login, paid API, package install, or build step is required.
3. Use localStorage for compact user data, version new records, validate parsed values, and retain unknown/legacy data where feasible.
4. Treat Ollama, Open-Meteo, Leaflet, and OpenStreetMap as optional integrations. Every network failure must leave a usable, honestly labelled local state.
5. Never label deterministic responses as AI, sample conditions as live weather, approximate sample coordinates as verified navigation data, or local group actions as synchronized collaboration.
6. Bind event handlers once at startup and route dynamic controls through the existing delegated event handler.
7. Respect reduced motion, keyboard operation, accessible names, dark mode, and narrow viewports.

## Feature requirements and acceptance criteria

| Requirement | Acceptance criteria |
|---|---|
| REQ-01 AI assistant | Dedicated chat route; persistent timestamped history; clear action; suggested prompts; typing state; configurable Ollama endpoint/model; clearly identified deterministic local fallback on unavailable/disabled Ollama. |
| REQ-02 itinerary generator | Validate start location, destination, dates, party size, budget, interests, transport, and intensity; produce day-part activities, rest, costs, and preparation; regenerate a day; edit/remove activities; save locally and convert to an existing trip without losing its other fields. |
| REQ-03 weather | Request Open-Meteo forecast for the selected destination’s stored approximate/sample coordinate; show temperature, condition, precipitation chance when returned, and practical advice; identify live response and approximate location; label fallback as sample, never live. |
| REQ-04 map | Use Leaflet with OpenStreetMap tiles when available; select/zoom destination markers and show details; distinguish approximate fixture coordinates from verified map tiles; show a useful unavailable/offline state instead of fabricated roads or attraction coordinates. |
| REQ-05 recommendations | Rank the existing catalogue with an explainable local score using profile, budget, trips, saved places, duration, and interests; show score reasons and useful category groupings. |
| REQ-06 groups | Create local group plans, participants/roles, destination votes, shared itinerary suggestions, and budget view; label every group screen and action as simulated, local-only collaboration. |
| REQ-07 checklist | Store per-trip checklist items; seed suggestions by destination/transport; support all six requested categories, custom add/delete/check, and progress. |
| REQ-08 journal | Searchable/editable/deletable entries associated with trips and dates; local image selection with input-size and compressed-size limits; store compressed images as compact local data and handle storage quota errors visibly. |
| REQ-09 financial intelligence | Calculate actual/estimated totals, per-traveller and per-day costs, category breakdown, budget alerts and a clearly marked projection from existing expense history; export a CSV summary. |
| REQ-10 notifications | In-app notification center derived from trips, checklists, budgets, recommendations, and weather state; no browser notification permission needed. |
| REQ-11 dashboard | Add recommendations, recent memories, checklist progress, and insights to Overview; calculate all totals from persisted application data. |
| REQ-12 integration quality | Safe versioned persistence, working legacy trips, no duplicate listeners, accessible responsive layouts, theme persistence, no runtime errors in core workflows, and updated documentation. |

## Implementation plan

### Phase A — Core data and navigation

- **T001:** Add a versioned Morrow 3.0 storage envelope/migrations while reading the existing Morrow 2.0 keys without data loss.
- **T002:** Add route/view shells for Assistant, Smart itinerary, Map, Group trips, Checklist, Journal, and Notifications; extend responsive navigation without removing current entries.
- **T003:** Add local explainable recommendation scoring and render recommendation cards on Explore and Overview.
- **T004:** Derive notifications from saved trips, checklists, budgets, and recommendation changes; make the existing notification control open this real local center.

### Phase B — Trip intelligence

- **T005:** Implement the Assistant chat history, Ollama connection/model settings, typing state, and transparent deterministic fallback.
- **T006:** Implement the validated day-wise itinerary generator, regeneration, edit/remove, save, and conversion into the existing trip schema.
- **T007:** Add optional Open-Meteo weather retrieval and explicit sample fallback; surface weather advice in destination and trip views.
- **T008:** Add Leaflet/OpenStreetMap map loading, destination markers, marker detail actions, and offline/unavailable presentation; label fixture coordinates as approximate.

### Phase C — Trip operations

- **T009:** Implement local-only group trip creation, participants/roles, voting, shared itinerary suggestions, and budget summary with simulation labels.
- **T010:** Add destination-aware, per-trip checklists with persistence and progress.
- **T011:** Add searchable journal CRUD and bounded client-side image compression/storage.
- **T012:** Extend trip financial views with per-person/per-day calculations, alerts, history, forecast labels, and CSV export.

### Phase D — Integration and release

- **T013:** Add dashboard recommendations, memories, checklist progress, notifications, and insights using existing local records.
- **T014:** Integrate the new routes with keyboard controls, responsive layouts, light/dark theme, reduced motion, empty/loading/error states, and existing navigation.
- **T015:** Exercise the old and new workflows, persistence/migration, invalid inputs, offline fallbacks, and mobile layouts; record results in README.

Dependencies: T001 precedes persistence-backed feature tasks; T002 precedes new screen tasks; T003 precedes recommendation notifications/dashboard; T006 and T010 precede relevant notification/dashboard summaries; T009–T012 precede the final integrated dashboard check. External services remain optional and are not acceptance prerequisites for local fallback behavior.

## Integration and data strategy

- Preserve the existing trip record shape (`destinationId`, dates, travellers, transport, budget, preferences, status, itinerary, expenses). New modules reference trip IDs instead of duplicating trip or expense totals.
- Add one version marker for new Morrow 3.0 records and migrate only those records under app ownership. Keep existing Morrow 2.0 keys readable and do not clear them during upgrades.
- Store compact chat, group, checklist, and journal metadata in namespaced keys. Validate array/object shape and field bounds at load and save.
- Calculate dashboard totals, alerts, and financial metrics at render time from trips/expenses; do not persist derived totals as a second source of truth.
- Generate journal image previews in the browser, resize before persistence, and report when a file exceeds the selected size limits or storage quota.
- The browser-only group feature has no shared backend, account, or real-time sync. Ollama requires an installed local Ollama service and an accessible configured model. Open-Meteo and map tiles require network access; their fallbacks remain explicit.

## Verification plan

1. Run `node --check app.js` after JavaScript changes; no automated test framework currently exists.
2. Browser-check the original Overview, Explore, Saved Places, trips, comparison, and prototype feedback flows.
3. Verify Ollama success/failure states separately; the deterministic fallback must remain usable when the endpoint is unreachable.
4. Verify itinerary generation, per-day regeneration, edit/delete, save, and conversion against a trip.
5. Verify live weather is only shown after a successful response and sample weather is marked as sample.
6. Verify map marker selection/zoom and the offline or tile-unavailable state; do not claim approximate fixture points are navigation-grade locations.
7. Verify recommendation reasons against the selected local profile/trip data.
8. Verify group labels, votes, checklist progress, journal CRUD/image bounds, financial calculations/export, and notification derivation.
9. Reload between workflows to verify migration and persistence; check for page errors and horizontal overflow at desktop and mobile widths.

## Implementation status and verification results

The Morrow 3.0 routes and local-first implementations are integrated with the existing classic-script SPA. `app.js` continues to own the Morrow 2.0 state and navigation; `morrow3.js` adds namespaced feature storage and binds its handlers once; `index.html` supplies the route shells; and `styles.css` provides the responsive, theme-aware presentation. Existing trip, expense, preference, and saved-place records remain the source of truth for the new derived views.

Implemented modules:

- Assistant with configurable Ollama endpoint/model, persistent timestamped history, a typing state, and an explicitly labelled deterministic fallback.
- Rule-based itinerary outlines with input validation, day regeneration, activity editing/removal/addition, local saves, and conversion to existing trip records.
- Open-Meteo current conditions with a clearly labelled sample fallback, plus a Leaflet/OpenStreetMap map using approximate catalogue coordinates and optional nearby-place lookup.
- Explainable local recommendations; local-only simulated group plans; trip checklists; bounded, compressed journal photos; derived financial insights and CSV export; local notifications; and overview widgets derived from existing records.

Verification performed:

- `node --check app.js` and `node --check morrow3.js` passed.
- The temporary HTTP preview returned HTTP 200.
- Browser checks confirmed local assistant fallback behavior, itinerary generation and conversion into a trip, checklist suggestions/addition and persistence after reload, live Open-Meteo weather, and OpenStreetMap tiles with six approximate destination markers.
- Morrow 2.0 browser checks were previously recorded in `README.md`; a complete regression pass was not repeated for Morrow 3.0.

Not fully verified in this pass: group creation and its participant/vote/suggestion/expense interactions, journal CRUD and photo-limit behavior, financial calculations/export, notification scenarios, mobile responsiveness, and the complete Morrow 2.0 regression journey. No automated test runner is configured. Optional Ollama, weather, map tiles, and nearby-place lookup depend on local service configuration or network/CORS availability; the local group feature is not synchronized.
