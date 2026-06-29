# CivicRadar

> Community Hero — Hyperlocal Problem Solver (Vibe2Ship Hackathon)

**CivicRadar** is an AI-powered hyperlocal community issue intelligence platform that turns scattered citizen reports into mapped, validated, AI-prioritized civic action cards.

## Problem
Community problems (potholes, broken streetlights, missing amenities) are often shared in fragmented social media threads, neighborhood chats, or Google reviews. Civic bodies, NGOs, and community leaders cannot effectively parse this unstructured noise, leading to delayed action and frustrated citizens. The "demand" for civic improvement remains invisible.

## Solution Overview
CivicRadar provides a unified intelligence layer. Residents can anonymously report missing services or broken infrastructure using plain language. The platform structures these reports into **Civic Issue Cards** with categorized tags, urgency scores, and recommended actors, aggregating them onto a live, searchable map to guide civic action.

## Key Features
- **Anonymous Reporting**: Frictionless entry. No login required.
- **AI-Powered Triage**: Converts plain text complaints into structured data.
- **Civic Action Cards**: Generates standardized, actionable reports.
- **Live Issue Grid**: Visualizes community hotspots on a dynamic map.
- **Action Board**: Groups issues by area, severity, and assigned actors (e.g., BBMP, BESCOM).
- **Privacy-First Design**: Auto-redacts personal info and rounds coordinates to ~110m.

## How the AI Triage Works (Current Demo)
The current demo utilizes a deterministic mock AI engine that instantly simulates the classification process:
1. **Input**: User submits a plain-language complaint.
2. **Analysis**: The triage engine categorizes the issue (e.g., `roads_potholes`), assesses the urgency, and identifies the affected demographic.
3. **Action Generation**: It formulates a concise summary and recommends a civic body (actor) to resolve it.

## Tech Stack
- **Framework**: React / Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS, Lucide Icons, UI components
- **State/Storage**: LocalStorage (client-only persistence for demo)

## Google Technologies (Planned)
- **Gemini / Google AI**: The deterministic triage engine is built as an adapter. We plan to replace the mock function with a real Gemini inference API to handle dynamic natural language processing and complex categorization.
- **Google Cloud Platform (GCP)**: For production scaling, hosting, and potentially leveraging BigQuery for issue analytics and reporting.

## Current Scope & Honest Limitations
To ensure a stable, robust Vibe2Ship demonstration, this build has the following boundaries:
- **Frontend-only**: There is no live backend or production database. All user submissions are persisted to your browser's `localStorage`.
- **Mock AI**: The intelligence layer is powered by a deterministic, in-process engine. This guarantees fast and reliable offline demos without API rate limits.
- **Seeded Pilot Data**: The Bengaluru map includes 40 pre-seeded, realistic civic issues to demonstrate clustering and analytics.
- **No Direct Civic Integration**: The platform currently recommends actors (e.g., BBMP) but does not automatically dispatch tickets to government APIs.

## Local Setup
Ensure you have [Bun](https://bun.sh/) installed.
```bash
# 1. Install dependencies
bun install

# 2. Run the development server
bun run dev
```

## Validation Commands
```bash
# Code formatting
bun run format

# Linting
bun run lint

# TypeScript verification
bun x tsc --noEmit

# Production build test
bun run build
```

## Folder Structure
```
civicradar-vibe2ship/
├── docs/               # Project documentation
├── src/
│   ├── components/     # UI, mapping, and layout components
│   ├── domain/         # Core data types and taxonomies
│   ├── lib/            # AI logic, state management, and geo-data
│   ├── routes/         # TanStack page routes
│   └── styles.css      # Core design tokens
└── package.json
```

---
*Submitted for Vibe2Ship Hackathon.*
