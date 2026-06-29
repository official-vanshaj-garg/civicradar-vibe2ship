# CivicRadar Testing & Validation

## Code Quality and Build Validation
The project mandates a clean build pipeline before any code is checked in. During the migration to CivicRadar, the following commands were rigorously executed:

### 1. Code Formatting
```bash
bun run format
```
Ensures consistent code style via Prettier across all `.ts`, `.tsx`, `.json`, and `.md` files.

### 2. Linting
```bash
bun run lint
```
Utilizes ESLint to verify codebase hygiene, prevent unused variables, and enforce React hooks best practices.

### 3. Type Checking
```bash
bun x tsc --noEmit
```
Performs a strict TypeScript compilation pass. This ensures our deterministic AI outputs map perfectly to the UI layer components without runtime type errors.

### 4. Production Build
```bash
bun run build
```
Executes the Vite build pipeline to produce optimized static assets and tests the SSR environment generation for errors.

## Manual Route Verification
Every major route was manually audited and tested to verify standard user flows:
- **Landing (`/`)**: Hero copy, CTA navigation, and layout rendering.
- **Reporting (`/report`)**: Jitter-based location simulation, fallback handling, and step-by-step form submission.
- **Action Board (`/dashboard`)**: Metric aggregations, leaderboard sorting, and matrix table layout.
- **Civic Grid (`/map`)**: Canvas pin rendering, category filtering, and drawer toggling.
- **Insights (`/insights`)**: Community signal group presentation and Civic Priority processing.

## Search Audit for Old Branding
Before public readiness, automated global searches were performed across the entire repository to ensure legacy project branding and context were fully eradicated.

**Search Patterns Checked (and Cleared):**
- Legacy platform name and brand permutations
- Legacy component names (e.g. `[Old name] Card`, `[Old name] Signal`)
- Legacy intelligence features (e.g. `[Old] Signal Engine`)
- `demand graph`
- `local demand intelligence`
- Non-civic legacy terms and platform names
- Legacy metric names

*Note: The string `demand` remains strictly as an internal TypeScript binding (e.g., `useDemands`, `DemandReport`) deeply embedded in the application architecture. This retains the structural stability of the demo without surfacing any legacy terminology to the public UI.*
