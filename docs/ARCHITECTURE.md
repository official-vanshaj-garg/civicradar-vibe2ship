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
4. **Storage**: The result is enriched with a unique ID and timestamp, becoming a `DemandReport` which is saved to the browser's `localStorage` (`src/lib/data/store.ts`).
5. **Consumption**: The `useDemands()` hook merges the local state with the static seeded data and serves it reactively to the map, dashboard, and insights views.

## Domain Model
The core application state revolves around the `DemandReport` interface located in `src/domain/demand/types.ts`. Key fields include:
- `category` & `sub_category`: Civic problem areas (e.g., `roads_potholes`).
- `urgency` & `impact_priority`: Evaluated severity metrics.
- `recommended_actor`: The entity best suited to fix the issue (e.g., `bbmp`).
- `affected_group`: The demographic most impacted (e.g., `commuters`).

## Location Handling
- To preserve privacy, user-provided locations are mapped to predefined `BLR_ZONES` (Bengaluru zones).
- Precise coordinates are jittered and rounded to approximately 110 meters.
- **Deterministic Location**: The AI classification layer is strictly forbidden from hallucinating or altering location data. Geographic coordinates are purely derived from the user's deliberate zone selection (`src/lib/geo/bengaluru.ts`), ensuring mapping remains accurate and reliable.

## Validation & Type-Safety
- The project enforces strict TypeScript compilation (`tsc --noEmit`).
- All data models rely on comprehensive enums and interfaces.
- The UI layer is safeguarded by ESLint and Prettier standardizations.

## Current Limitations
- Data does not synchronize across different browsers/devices.
- The mock AI operates via static keyword matching and heuristics rather than dynamic LLM inference.
- Map rendering is restricted to a predefined local coordinate system rather than a global tile server.
