# Morrow

### Find a little room to roam.

**Morrow 3.0** is a polished, local-first weekend escape planner. Explore destinations, shape a trip, and keep the details together in one responsive browser experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-315C4C.svg)](https://github.com/sandipsahofficial/MORROW-AI/blob/main/LICENSE)
[![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F1D58A.svg)](#technology)
[![No build step](https://img.shields.io/badge/Build-none-315C4C.svg)](#run-locally)

> **Privacy-first prototype:** trip and preference data stays in this browser. Optional public services are clearly identified; there is no Morrow account, backend, or paid API.

**Contents:** [Features](#features) · [Run locally](#run-locally) · [Demo](#demo-morrow-30) · [Architecture](#project-structure) · [Privacy](#local-data-and-reset) · [Verification](#verification)

Morrow is built with semantic HTML, modern CSS, and plain JavaScript. No build step, package installation, sign-in, or paid service is required.

## Run locally

Open `index.html` in a modern browser, or serve the project folder with VS Code Live Server or another static web server. An HTTP origin is recommended for browser storage and optional network integrations. Fonts, destination photography, maps, weather, and nearby-place search need internet access; core local interactions do not.

## Features

| Area | What you can do |
| --- | --- |
| Discover | Search and filter destinations, review details, save places, and compare up to three options. |
| Plan | Create and edit trips, build day-by-day activities, track expenses, print, and share a trip summary. |
| Personalize | Maintain a local profile, travel preferences, theme, and prototype-test feedback. |
| Travel assistant | Ask travel questions; try optional local Ollama or clearly labelled deterministic catalogue suggestions. |
| Smart itinerary | Generate an editable sample plan, regenerate days, save it, or convert it into a trip. |
| Weather and map | Request Open-Meteo conditions and explore Leaflet/OpenStreetMap destination markers. |
| Trip tools | Manage simulated local group plans, per-trip checklists, journal memories, and financial summaries. |
| Dashboard | Review locally derived recommendations, trip reminders, checklist progress, and spending insights. |

### Morrow 2.0 experience

- **Overview:** saved places, planned/upcoming trips, estimated budgets, recent destinations, and popular trip styles.
- **Explore:** destination search, filters, sorting, details, favorites, and comparison.
- **My trips:** trip planning and editing, day-by-day activities, and six-category expense tracking.
- **Compare places:** compare up to three destinations by budget, distance, stay length, type, season, and activities.
- **Profile and prototype test:** local preferences, theme controls, sample usability tasks, and feedback ratings.

### Morrow 3.0 tools

Open **Morrow 3.0 Tools** in the sidebar:

- **Travel assistant:** optional Ollama endpoint/model, persistent chat, and transparent deterministic local responses.
- **Smart itinerary:** validated inputs, day-wise sample schedule, activity editing, local saves, and conversion to an existing trip.
- **Weather:** Open-Meteo current conditions with a clearly labelled sample fallback.
- **Map explorer:** Leaflet/OpenStreetMap destination markers and optional nearby-place lookup.
- **Group trips:** local-only simulated participants/roles, destination votes, activity suggestions, and shared expense records.
- **Checklists:** destination-aware packing lists saved per trip, with categories and completion progress.
- **Travel journal:** searchable memory entries with optional locally compressed photos (5 MB input limit).
- **Money insights:** actual-versus-estimated totals, category breakdown, per-person/per-day calculations, and CSV export.
- **Notifications and dashboard:** in-app reminders and summaries derived from the browser's saved data.

## Demo Morrow 3.0

1. Start at **Overview** and explore the locally calculated recommendations and travel widgets.
2. Ask the **Travel assistant** for a weekend idea; check that a fallback is labelled “not AI-generated.”
3. Generate an outline in **Smart itinerary**, regenerate a day, edit an activity, save, and convert it into **My trips**.
4. Open **Weather** and note whether the result is live or labelled sample data.
5. Explore **Map explorer** and select a destination marker; catalogue coordinates are approximate.
6. Open **Checklists** for a trip and mark or add an item.
7. Review **Group trips** and its local-only simulation; add a participant, vote, suggestion, or expense.
8. Add a dated memory in **Travel journal**, then check **Money insights** and **Notifications**.
9. Toggle the theme and resize the browser to inspect responsive layouts.

For the original trip-planning flow, see [Suggested presentation](#suggested-presentation).

## Technology

- **Core:** HTML, CSS, vanilla JavaScript; localStorage for browser-local persistence.
- **Optional AI:** Ollama local chat API; deterministic rule-based fallback.
- **Optional weather:** Open-Meteo forecast API.
- **Optional maps:** Leaflet 1.9.4 and OpenStreetMap tiles; nearby-place lookup uses public Nominatim.
- **No build tools or runtime packages** are required by the core application.

## Project structure

```text
.
├── index.html       # SPA shell, navigation, and screen markup
├── app.js           # Morrow 2.0 application, routing, and shared trip state
├── morrow3.js       # Morrow 3.0 local-first features and integrations
├── styles.css       # Design system, responsive screens, themes, and print styles
├── ARCHITECTURE.md  # Architecture, requirements, and implementation status
├── README.md        # Setup, product guide, demo, and verification notes
└── LICENSE          # MIT license
```

## Privacy and integration boundaries

- Ollama is optional and must be running locally with a selected model. Connection or browser CORS failures fall back to deterministic local suggestions.
- Weather uses Open-Meteo when reachable. Sample conditions and catalogue coordinates are clearly labelled; coordinates are not navigation-grade.
- Leaflet and OpenStreetMap tiles need internet access. Nearby search uses the public Nominatim service and may be unavailable.
- Group plans are simulated in this browser only: no accounts, backend, synchronization, or real-time collaboration.
- Journal photos and other prototype data remain in local browser storage, which is subject to browser quotas. Morrow has no application server receiving this data.
- Destination prices, activities, distances, and generated itinerary costs are illustrative estimates—not current quotes, bookings, or verified routes.

## Suggested presentation

1. Begin on **Overview** and point out the locally calculated travel statistics.
2. Open **Explore**, search for a destination or use a few filters, then open a destination card to show its description, attractions, tips, and related places.
3. Save a favorite and add two or three destinations to **Compare places**.
4. Choose **Make it a plan** (or **My trips → Plan a new escape**). Set dates, travellers, transport, budget, and preferences; generate the trip.
5. In **Trip details**, add or reorder an activity, then add an expense and show the updated totals and spending chart.
6. Try **Share trip**. Supported browsers open native sharing; otherwise Morrow copies a summary to the clipboard. Choose **Print / Save PDF** and select “Save as PDF” in the browser's print dialog.
7. Open **Profile** to edit local preferences, toggle dark mode, and finish on **Prototype test** to leave a rating and comment.

## Local data and reset

Morrow does not send prototype data to a server. Data is kept in this browser's `localStorage`:

- Existing prototype data: `morrow-saved`, `morrow-trips`, `morrow-feedback`, and `morrow-tasks`.
- Added Morrow 2.0 data: `morrow-compare`, `morrow-recent`, `morrow-profile`, and `morrow-theme`.
- Added Morrow 3.0 data: `morrow-schema-version`, `morrow-ai-settings`, `morrow-chat`, `morrow-smart-itineraries`, `morrow-groups`, `morrow-checklists`, `morrow-journal`, and `morrow-map-geocode-cache`.

The app normalizes older trip records from `morrow-trips` when it starts. Morrow 3.0 stores its additions under separate keys and reads trip, expense, preference, and saved-place data from the existing Morrow 2.0 records. To reset the demo, remove only the `morrow-*` entries for this page from the browser's developer tools. This permanently deletes the saved prototype data in that browser.

## Verification

Morrow 2.0 browser checks covered trip creation/editing and date validation, legacy trip migration, suggested activities, itinerary updates, expense validation and totals, destination comparison, filters and sorting, profile/theme persistence, print and share actions, local storage reloads, and responsive layouts. For the Morrow 3.0 implementation, `node --check app.js` and `node --check morrow3.js` pass, the local preview returned HTTP 200, and browser checks confirmed the local assistant fallback, itinerary generation/conversion, checklist persistence after reload, live Open-Meteo response, and Leaflet/OpenStreetMap tiles with approximate destination markers.

Group-form submission and its vote/suggestion/expense actions, journal CRUD and photo limits, finance export/calculations, notifications, mobile layout, and complete Morrow 2.0 regression were not fully re-verified in this implementation pass. This project has no automated test runner; those checks remain manual.

There is no automated test framework configured in this standalone project. PDF output uses the browser's print dialog; no PDF package is bundled. Native sharing depends on browser support.
