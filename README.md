# CivicRadar

> Community Hero — Hyperlocal Problem Solver (Vibe2Ship Hackathon)

**CivicRadar** is an AI-powered hyperlocal community issue intelligence platform that turns scattered citizen reports into mapped, validated, AI-prioritized civic action cards.

## Problem
Community problems (potholes, broken streetlights, missing amenities) are often shared in fragmented social media threads, neighborhood chats, or Google reviews. Civic bodies, NGOs, and community leaders cannot effectively parse this unstructured noise, leading to delayed action and frustrated citizens. These recurring civic needs remain hard to see, prioritize, and act on.

## Solution Overview
CivicRadar provides a unified intelligence layer. Residents can anonymously report local civic issues or broken infrastructure using plain language. The platform structures these reports into **Civic Issue Cards** with categorized tags, urgency scores, responsible stakeholders, and suggested next actions, aggregating them onto a live, searchable map to guide civic action.

## Key Features
- **Anonymous Reporting**: Frictionless entry. No login required.
- **AI-Powered Triage**: Converts plain text complaints into structured data.
- **Civic Action Cards**: Generates standardized, actionable reports.
- **Live Issue Grid**: Visualizes community hotspots on a dynamic map.
- **Action Board**: Groups issues by area, severity, Civic Priority, and responsible stakeholder.
- **Accountability Action Pack**: Adds deterministic Civic Priority scoring, community signal strength, and a ranked action queue for judge-readable civic prioritization.
- **Civic Proof & Resolution Loop**: Captures evidence metadata, community verification, lifecycle status, and local contribution score without uploads or backend services.
- **Browser Geolocation + Maps Handoff**: Optional browser-local approximate location assist and plain external Google Maps links for reports with coordinates.
- **Privacy-First Design**: Auto-redacts personal info and rounds coordinates to ~110m.

## How the AI Triage Works (Current Demo)
The current demo utilizes a deterministic mock AI engine that instantly simulates the classification process:
1. **Input**: User submits a plain-language complaint.
2. **Analysis**: The triage engine categorizes the issue (e.g., `roads_potholes`), assesses the urgency, and identifies the affected demographic.
3. **Action Generation**: It formulates a concise summary, recommends a responsible stakeholder, and suggests a next action.

## Accountability Action Pack
This phase adds demo-safe deterministic civic action intelligence:
- **Civic Priority scoring**: A 0-100 score derived from urgency, impact priority, signal strength, upvotes, recency, and same-zone/category community signal strength.
- **Recommended stakeholder routing**: Each issue surfaces a responsible stakeholder and suggested next action from existing category and actor fields.
- **Community signal strength**: Counts other current reports in the same zone and category. This is deterministic grouping, not semantic clustering.
- **Action queue**: `/dashboard` now highlights **Top Civic Issues Needing Action**, sorted by Civic Priority with stakeholder, status, similar-signal count, and suggested action.

This is not official government integration and does not claim automatic escalation, dispatch, or resolution.

## Phase C1 Civic Proof & Resolution Loop
CivicRadar now adds a local-only proof and tracking layer:
- **Evidence metadata only**: Reports can note `none`, `photo`, `video`, or `witness_note`; no files are uploaded, stored, or previewed.
- **Community verification**: A browser/device can verify each issue once. Verification counts are stored in `localStorage`.
- **Civic lifecycle**: Issue details show Reported, AI triaged, Community verified, Routed, and Follow-up needed / Resolved in demo.
- **Community contribution**: A subtle local score gives +10 for a report, +5 for first verification, and +3 for evidence metadata.

This loop is demo/local only. It does not add backend, database, auth, uploads, official government dispatch, or real resolution tracking.

## Phase C2 Browser Geolocation + Google Maps External Handoff
CivicRadar now includes a low-risk location usefulness layer:
- **Optional browser geolocation assist**: `/report` has a user-triggered "Use approximate current location" button. It stores rounded latitude/longitude, optional browser accuracy, source, and captured timestamp in the local report only.
- **Zone fallback remains primary**: If permission is denied, unsupported, unavailable, or times out, the report flow continues with the existing Bengaluru zone selection.
- **External Google Maps handoff**: Issue details and report success can open `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>` in a new tab when coordinates are available.

This does not add Google Maps JavaScript API, a Maps API key, embedded maps, backend location storage, tracking, or official dispatch. Location data remains browser-local/localStorage demo data.

## Tech Stack
- **Framework**: React / Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS, Lucide Icons, UI components
- **State/Storage**: LocalStorage (client-only persistence for demo)

## Google Technologies
- **Google Cloud Run**: Google Cloud Run is used to host the public CivicRadar demo. The submitted deployment runs as a Cloud Run service in asia-south1. Cloud Build and Artifact Registry are used through the Cloud Run source deployment flow to build and store the deployed container image.
- **Gemini / Google AI (Planned)**: Gemini / Google AI is adapter-ready for a future classifier, but the submitted demo uses deterministic in-browser civic triage for stability.

## Current Scope & Honest Limitations
To ensure a stable, robust Vibe2Ship demonstration, this build has the following boundaries:
- **Frontend-only**: There is no live backend or production database. All user submissions are persisted to your browser's `localStorage`.
- **Mock AI**: The intelligence layer is powered by a deterministic, in-process engine. This guarantees fast and reliable offline demos without API rate limits.
- **Seeded Pilot Data**: The Bengaluru map includes 40 pre-seeded, realistic civic issues to demonstrate deterministic signal groups and analytics.
- **Local Proof Loop**: Evidence metadata, verification, demo resolution flags, and contribution score are stored locally in the browser.
- **Browser-Local Location Assist**: Optional approximate geolocation is stored only with local demo reports, and Google Maps is opened only through an external link.
- **No Direct Civic Integration**: The platform currently recommends responsible stakeholders but does not automatically dispatch tickets to government APIs.

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
