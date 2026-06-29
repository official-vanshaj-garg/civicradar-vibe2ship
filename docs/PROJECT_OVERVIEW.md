# CivicRadar — Project Overview

## Problem Statement Selected
**Community Hero — Hyperlocal Problem Solver**

## Solution Overview
CivicRadar is an AI-powered hyperlocal community issue intelligence platform. It solves the communication gap between citizens and local authorities by transforming unstructured complaints (e.g., "The streetlights are always out on 6th Main") into structured, categorized, and prioritized **Civic Issue Cards**. These cards are visualized on a live map and aggregated into an actionable dashboard for civic bodies, NGOs, and community organizers.

## Key Features
1. **Frictionless Issue Reporting**: Residents report issues anonymously using natural language.
2. **AI Triage Layer**: Structures text into actionable metadata (category, urgency, affected group).
3. **Geospatial Hotspots**: Plots issues onto a live Bengaluru grid.
4. **Civic Action Board**: Aggregates issues to identify underserved zones and generate action scores for impact.
5. **Privacy Protection**: Rounding geographic coordinates to ~110m and redacting PII from text.

## Technologies Used
- **Frontend**: React, Vite, TypeScript
- **Routing**: TanStack Router
- **UI & Styling**: Tailwind CSS, customized utility components, Lucide icons
- **State Management**: React hooks with `localStorage` persistence

## Google Technologies Utilized / Planned
- **Gemini Pro (Planned)**: Integration with Gemini for robust, dynamic natural language classification and sentiment analysis.
- **Google Cloud Platform (Planned)**: Hosting the application and utilizing Cloud SQL/BigQuery to store and analyze long-term civic data trends.

## Demo Flow
1. **Explore the Map**: A user lands on the Bengaluru civic grid, visualizing existing seeded hotspots across various wards.
2. **Report an Issue**: The user navigates to the Report page and types a complaint in plain English, selecting their approximate zone.
3. **AI Generation**: The engine processes the text and instantly previews a structured Civic Issue Card.
4. **Dashboard Aggregation**: The user submits the card, which is then immediately reflected on the live map and factored into the dashboard's statistics and action recommendations.

## Current Scope and Limitations
- The application currently runs entirely in the browser (frontend-only) to guarantee a seamless, rapid demonstration experience.
- State is preserved locally via `localStorage`.
- The AI intelligence layer operates in a deterministic mock mode for stability. Real AI endpoints can be hot-swapped into the `classify` adapter in the future.
- The data is limited to a Bengaluru pilot (seeded data + user local data).
