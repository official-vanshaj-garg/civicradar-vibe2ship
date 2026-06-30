# CivicRadar

Hyperlocal civic issue reporting and resolution platform for Vibe2Ship.

## Links
- **Live App**: https://civicradar-378091373108.asia-south1.run.app
- **GitHub Repository**: https://github.com/official-vanshaj-garg/civicradar-vibe2ship
- **Problem Statement**: Community Hero - Hyperlocal Problem Solver
- **Participant**: Vanshaj

## Overview
CivicRadar helps citizens report local civic issues, receive a structured civic action packet, add evidence metadata, verify issues, track lifecycle status, and view civic signals through a dashboard and map.

Report -> Triage -> Validate -> Route -> Track -> Follow up / Resolve in demo

## Problem
Currently, civic reporting suffers from several gaps:
- fragmented reporting across platforms and social media
- hard to validate community signal from noise
- unclear accountability for who owns the issue
- lack of transparent tracking of resolution status

## Key Features
- Civic issue reporting
- Deterministic civic triage and action packet
- Civic priority score
- Community signal strength
- Responsible stakeholder and suggested next action
- Evidence metadata only, no file uploads
- Community verification
- Civic lifecycle timeline
- Civic contribution score
- Civic dashboard
- Hyperlocal Bengaluru civic map
- Optional browser geolocation assist
- External Google Maps handoff link

## Google Technologies Used
- Google Cloud Run for deployment
- Google Cloud project infrastructure
- Google Maps external handoff links

Note: The app does not use Google Maps JavaScript API. The app does not use a Maps API key. The app does not use Gemini in the current deployed version.

## Tech Stack
- React 19
- TypeScript
- Vite
- TanStack Router / TanStack Start
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide icons
- Bun
- localStorage

## Prototype Scope
- Reports are stored in browser localStorage.
- Reports update dashboard and map in the same browser.
- Verification is local to the same browser/device.
- Evidence is metadata only.
- No backend database in current version.
- No official government dispatch.
- No government integration claimed.
- No file upload.

## Production Roadmap
- Cloud Firestore or Cloud Run API backed by Firestore for shared reports
- Cloud Storage for optional image/video evidence
- Server-side Gemini triage
- Rate limiting and abuse prevention
- Moderation dashboard
- Stakeholder routing workflows
- Public issue status pages
- Analytics for civic hotspots

## Local Development
Ensure you have Bun installed.

```bash
bun install
bun run dev
bun run build
bun run lint
```

## Deployment
The app is deployed on Google Cloud Run.
Live URL: https://civicradar-378091373108.asia-south1.run.app

## Validation
Final release validation passed successfully:
- ESLint passed with 0 errors
- TypeScript passed
- Vite build passed
- Live Cloud Run smoke test passed for home, report, dashboard, and map

## License
Built for Vibe2Ship as a hackathon prototype.
