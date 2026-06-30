# CivicRadar Architecture

## Frontend Routes
The application is built as a Single Page Application (SPA) utilizing TanStack Router for type-safe routing.
- `/`: Landing page outlining the platform's value proposition.
- `/report`: Multi-step form where citizens submit unstructured complaints.
- `/dashboard`: The Civic Action Board aggregating statistics and issues.
- `/map`: An interactive SVG-based visualization of community hotspots.
- `/insights`: Deep-dive analytics on civic problem zones.
- `/about`: Project background and vision.

## Data Flow
1. **Input**: A user submits a plain-text report via the `/report` wizard.
2. **Triage**: The `classify` function (`src/lib/ai/index.ts`) intercepts the input. Currently, this invokes a deterministic mock engine (`mockClassifier.ts`).
3. **Structuring**: The engine outputs a strongly typed `ClassifyOutput` (category, urgency, suggested action).
4. **Optional location assist**: If the user clicks the browser geolocation button, rounded approximate coordinates and optional accuracy metadata are attached. If not, the existing zone fallback remains active.
5. **Proof metadata**: The report can include safe evidence metadata (`none`, `photo`, `video`, or `witness_note`). No files are uploaded or stored.
6. **Storage**: The result is enriched with a unique ID and timestamp, becoming a `DemandReport` which is saved to the browser's `localStorage` (`src/lib/data/store.ts`).
7. **Local verification loop**: Browser-local verification IDs, verification counts, demo resolution flags, and community contribution score are stored separately in `localStorage`.
8. **Consumption**: The `useDemands()` hook merges the local state with the static seeded data and serves it reactively to the map, dashboard, and insights views.

## Domain Model
The core application state revolves around the `DemandReport` interface located in `src/domain/demand/types.ts`. Key fields include:
- `category` & `sub_category`: Civic problem areas (e.g., `roads_potholes`).
- `urgency` & `impact_priority`: Evaluated severity metrics.
- `recommended_actor`: The entity best suited to fix the issue (e.g., `bbmp`).
- `affected_group`: The demographic most impacted (e.g., `commuters`).
- `evidence`: Optional metadata only; no files are stored.
- `approximateLocation`: Optional local/demo coordinates with `lat`, `lng`, optional `accuracyMeters`, `source` (`browser_geolocation` or `zone`), and optional `capturedAt`.
- `verificationCount`: Optional local community verification count.
- `resolvedInDemo`: Optional local demo lifecycle flag.

## Civic Proof & Resolution Loop
Phase C1 remains entirely client-side:
- Evidence metadata is saved with user-created reports.
- Community verification is one-per-issue per browser/device.
- Lifecycle stages are derived locally: Reported, AI triaged, Community verified, Routed, and Follow-up needed / Resolved in demo.
- Contribution score is local and restrained: +10 for a report, +5 for first verification, +3 for evidence metadata.

This is a transparent demo workflow. It does not perform official dispatch, upload files, authenticate users, or sync with a backend/database.

## Location Handling
- To preserve privacy, user-provided locations are mapped to predefined `BLR_ZONES` (Bengaluru zones).
- `/report` can optionally call `navigator.geolocation.getCurrentPosition` only after the user clicks "Use approximate current location".
- Browser geolocation uses low-risk options: `enableHighAccuracy: false`, a bounded timeout, and cached positions when available.
- Captured browser coordinates are rounded to approximately 110 meters before they are stored in the local report.
- If geolocation is denied, unsupported, unavailable, or times out, the report flow continues with the zone fallback.
- Reports with usable coordinates can show an external Google Maps handoff link using `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`.
- CivicRadar does not load Google Maps JavaScript API, use a Maps API key, embed a map, track live location, or store location data in a backend.
- **Deterministic Location**: The AI classification layer is strictly forbidden from hallucinating or altering location data. Geographic coordinates come only from the user's deliberate browser-location action or the selected zone fallback (`src/lib/geo/bengaluru.ts`), ensuring mapping remains explainable and reliable.

## Validation & Type-Safety
- The project enforces strict TypeScript compilation (`tsc --noEmit`).
- All data models rely on comprehensive enums and interfaces.
- The UI layer is safeguarded by ESLint and Prettier standardizations.

## Current Limitations
- Data does not synchronize across different browsers/devices.
- The mock AI operates via static keyword matching and heuristics rather than dynamic LLM inference.
- Map rendering is restricted to a predefined local coordinate system rather than a global tile server.
- Verification, demo resolution, and contribution score are local to the browser/device.
- Browser geolocation metadata and Google Maps handoff links remain local/demo-only and do not create official dispatch or backend records.
