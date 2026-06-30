// Local-first demand store. Persists user-submitted reports to localStorage and merges with seed.
// (When a production database is wired up later, swap the read/write impls here behind the same hooks.)

import { useEffect, useState, useCallback } from "react";
import type { ApproximateLocation, DemandReport, EvidenceMetadata } from "@/domain/demand";
import { SEED_DEMANDS } from "./seed";

const STORAGE_KEY = "civicradar.user_reports.v1";
const SESSION_KEY = "civicradar.session";
const UPVOTES_KEY = "civicradar.upvotes.v1";
const VERIFIED_KEY = "civicradar.verified_issues.v1";
const VERIFICATION_COUNTS_KEY = "civicradar.verification_counts.v1";
const RESOLVED_KEY = "civicradar.resolved_demo.v1";
const CONTRIBUTION_KEY = "civicradar.contribution_score.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSessionId(): string {
  if (!isBrowser()) return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readUser(): DemandReport[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeUser(rows: DemandReport[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function readUpvotes(): Record<string, true> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem(UPVOTES_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeUpvotes(v: Record<string, true>) {
  if (!isBrowser()) return;
  localStorage.setItem(UPVOTES_KEY, JSON.stringify(v));
}

function readTrueMap(key: string): Record<string, true> {
  if (!isBrowser()) return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value === true),
    ) as Record<string, true>;
  } catch {
    return {};
  }
}

function writeTrueMap(key: string, value: Record<string, true>) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readNumberMap(key: string): Record<string, number> {
  if (!isBrowser()) return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed).reduce<Array<[string, number]>>((acc, [id, value]) => {
      const count = typeof value === "number" ? Math.max(0, value) : 0;
      if (count > 0) acc.push([id, count]);
      return acc;
    }, []);
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function writeNumberMap(key: string, value: Record<string, number>) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readContributionScore(): number {
  if (!isBrowser()) return 0;
  const raw = Number(localStorage.getItem(CONTRIBUTION_KEY) || "0");
  return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
}

function addContributionPoints(points: number) {
  if (!isBrowser() || points <= 0) return;
  localStorage.setItem(CONTRIBUTION_KEY, String(readContributionScore() + points));
}

function normalizeEvidence(evidence: EvidenceMetadata | undefined): EvidenceMetadata | undefined {
  if (!evidence) return undefined;
  if (!["none", "photo", "video", "witness_note"].includes(evidence.type)) return undefined;
  return {
    type: evidence.type,
    note: evidence.type === "witness_note" ? evidence.note?.slice(0, 180) : undefined,
    recordedAt: evidence.recordedAt,
  };
}

function normalizeApproximateLocation(
  location: ApproximateLocation | undefined,
): ApproximateLocation | undefined {
  if (!location) return undefined;
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return undefined;
  if (Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) return undefined;
  return {
    lat: location.lat,
    lng: location.lng,
    accuracyMeters:
      typeof location.accuracyMeters === "number" && Number.isFinite(location.accuracyMeters)
        ? Math.max(0, Math.round(location.accuracyMeters))
        : undefined,
    source: location.source === "browser_geolocation" ? "browser_geolocation" : "zone",
    capturedAt: location.capturedAt,
  };
}

function withLocalProofState(
  report: DemandReport,
  verificationCounts: Record<string, number>,
  resolved: Record<string, true>,
): DemandReport {
  return {
    ...report,
    evidence: normalizeEvidence(report.evidence),
    approximateLocation: normalizeApproximateLocation(report.approximateLocation),
    verificationCount: Math.max(report.verificationCount ?? 0, verificationCounts[report.id] ?? 0),
    resolvedInDemo: report.resolvedInDemo === true || resolved[report.id] === true,
  };
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function addDemand(report: DemandReport) {
  const next = [report, ...readUser()];
  writeUser(next);
  addContributionPoints(10 + (report.evidence && report.evidence.type !== "none" ? 3 : 0));
  emit();
}

export function toggleUpvote(id: string): boolean {
  const cur = readUpvotes();
  let upvoted: boolean;
  if (cur[id]) {
    delete cur[id];
    upvoted = false;
  } else {
    cur[id] = true;
    upvoted = true;
  }
  writeUpvotes(cur);
  // bump persisted user-row upvote count if applicable
  const user = readUser();
  const idx = user.findIndex((r) => r.id === id);
  if (idx >= 0) {
    user[idx] = { ...user[idx], upvotes: Math.max(0, user[idx].upvotes + (upvoted ? 1 : -1)) };
    writeUser(user);
  }
  emit();
  return upvoted;
}

export function verifyDemand(id: string): boolean {
  const verified = readTrueMap(VERIFIED_KEY);
  if (verified[id]) return false;

  verified[id] = true;
  writeTrueMap(VERIFIED_KEY, verified);

  const counts = readNumberMap(VERIFICATION_COUNTS_KEY);
  counts[id] = (counts[id] || 0) + 1;
  writeNumberMap(VERIFICATION_COUNTS_KEY, counts);

  addContributionPoints(5);
  emit();
  return true;
}

export function markResolvedInDemo(id: string): boolean {
  const resolved = readTrueMap(RESOLVED_KEY);
  if (resolved[id]) return false;
  resolved[id] = true;
  writeTrueMap(RESOLVED_KEY, resolved);
  emit();
  return true;
}

/**
 * Hook that returns the merged list of seed + user demand reports.
 * SSR-safe: returns just SEED on first render, hydrates user rows on client.
 */
export function useDemands(): {
  all: DemandReport[];
  upvotes: Record<string, true>;
  verifiedIssueIds: Record<string, true>;
  contributionScore: number;
  ready: boolean;
} {
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const user = hydrated ? readUser() : [];
  const upvotes = hydrated ? readUpvotes() : {};
  const verifiedIssueIds = hydrated ? readTrueMap(VERIFIED_KEY) : {};
  const verificationCounts = hydrated ? readNumberMap(VERIFICATION_COUNTS_KEY) : {};
  const resolved = hydrated ? readTrueMap(RESOLVED_KEY) : {};
  const contributionScore = hydrated ? readContributionScore() : 0;
  // Apply session upvote deltas to seed rows so UI reflects live count
  const seed = SEED_DEMANDS.map((r) =>
    withLocalProofState(
      upvotes[r.id] ? { ...r, upvotes: r.upvotes + 1 } : r,
      verificationCounts,
      resolved,
    ),
  );
  const all = [
    ...user.map((r) => withLocalProofState(r, verificationCounts, resolved)),
    ...seed,
  ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return {
    all,
    upvotes,
    verifiedIssueIds,
    contributionScore,
    ready: hydrated,
    ...({ tick } as unknown as object),
  };
}
