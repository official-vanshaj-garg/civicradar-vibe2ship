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

## Tech Stack
- **Framework**: React / Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS, Lucide Icons, UI components
- **State/Storage**: LocalStorage (client-only persistence for demo)

## Google Technologies
- **Google Cloud Run**: Google Cloud Run is the intended mandatory deployment target.
- **Gemini / Google AI (Planned)**: The deterministic triage engine is built as an adapter. Gemini is future/adapter-ready, but not active. We plan to replace the mock function with a real Gemini inference API to handle dynamic natural language processing and complex categorization.

## Current Scope & Honest Limitations
To ensure a stable, robust Vibe2Ship demonstration, this build has the following boundaries:
- **Frontend-only**: There is no live backend or production database. All user submissions are persisted to your browser's `localStorage`.
- **Mock AI**: The intelligence layer is powered by a deterministic, in-process engine. This guarantees fast and reliable offline demos without API rate limits.
- **Seeded Pilot Data**: The Bengaluru map includes 40 pre-seeded, realistic civic issues to demonstrate deterministic signal groups and analytics.
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
