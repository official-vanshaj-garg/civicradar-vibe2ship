import {
  ACTOR_LABEL,
  CATEGORY_META,
  PRIORITY_RANK,
  type AffectedGroup,
  type DemandCategory,
  type DemandReport,
  type DemandStatus,
  type ImpactPriority,
} from "./types";

export interface CivicPriorityContext {
  similarSignalCount: number;
  nowMs: number;
}

export interface CivicActionBrief {
  categoryLabel: string;
  urgencyLabel: string;
  severityLabel: string;
  affectedGroupLabel: string;
  responsibleStakeholder: string;
  suggestedNextAction: string;
  whyItMatters: string;
  confidenceLabel: string;
  statusLabel: string;
  civicPriorityScore: number;
  civicPriorityReason: string;
  communitySignalCount: number;
  communitySignalLabel: string;
  communitySignalStrength: number;
}

const IMPACT_BOOST: Record<ImpactPriority, number> = {
  low: 6,
  medium: 12,
  high: 18,
  critical: 24,
};

const GROUP_LABEL: Record<AffectedGroup, string> = {
  students: "Students",
  working_women: "Working women",
  elderly: "Elderly residents",
  families: "Families",
  commuters: "Commuters",
  disabled_citizens: "Disabled citizens",
  general: "Residents",
};

const STATUS_LABEL: Record<DemandStatus, string> = {
  new: "New signal",
  reviewing: "Needs review",
  acknowledged: "Acknowledged in demo queue",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sentenceCase(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function softenAction(action: string) {
  const clean = action.trim().replace(/\.$/, "");
  if (/^(suggested|recommended):/i.test(clean)) return `${clean}.`;
  return `Suggested: ${clean.charAt(0).toLowerCase()}${clean.slice(1)}.`;
}

function getRecencyBoost(createdAt: string, nowMs: number) {
  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return 0;
  const days = Math.max(0, Math.floor((nowMs - createdMs) / 86_400_000));
  if (days <= 1) return 8;
  if (days <= 3) return 6;
  if (days <= 7) return 4;
  if (days <= 14) return 2;
  return 0;
}

export function getSimilarSignalCount(demand: DemandReport, allDemands: DemandReport[]) {
  return allDemands.filter(
    (row) =>
      row.id !== demand.id &&
      row.area_label === demand.area_label &&
      row.category === demand.category,
  ).length;
}

export function getCommunitySignalLabel(count: number, areaLabel: string) {
  if (count <= 0) return "No similar signals yet";
  return `${count} similar ${count === 1 ? "signal" : "signals"} in ${areaLabel}`;
}

export function computeCivicPriorityScore(
  demand: DemandReport,
  { similarSignalCount, nowMs }: CivicPriorityContext,
) {
  const urgencyBase = clamp(demand.urgency, 1, 5) * 10;
  const impactBoost = IMPACT_BOOST[demand.impact_priority];
  const signalBoost = Math.round(clamp(demand.signal_strength, 0, 100) * 0.12);
  const upvoteBoost = Math.min(8, Math.floor(Math.max(0, demand.upvotes) / 12));
  const recencyBoost = getRecencyBoost(demand.created_at, nowMs);
  const communityBoost = Math.min(10, similarSignalCount * 3);

  return clamp(
    Math.round(
      urgencyBase + impactBoost + signalBoost + upvoteBoost + recencyBoost + communityBoost,
    ),
    0,
    100,
  );
}

export function getCivicPriorityReason(demand: DemandReport, similarSignalCount: number) {
  const reasons: string[] = [];
  const impactRank = PRIORITY_RANK[demand.impact_priority];

  if (demand.urgency >= 4) reasons.push("high urgency");
  else if (demand.urgency >= 3) reasons.push("moderate urgency");

  if (impactRank >= 3) reasons.push(`${demand.impact_priority} impact`);

  if (similarSignalCount >= 2) reasons.push("repeated local signals");
  else if (demand.signal_strength >= 80) reasons.push("strong community signal");
  else if (demand.upvotes >= 36) reasons.push("visible community support");

  if (reasons.length === 0) reasons.push("clear local issue signal");

  return sentenceCase(reasons.slice(0, 2).join(" + "));
}

export function getWhyItMatters(demand: DemandReport) {
  const group = GROUP_LABEL[demand.affected_group].toLowerCase();
  const byCategory: Record<DemandCategory, string> = {
    roads_potholes: `Unsafe road conditions can increase crash risk and slow daily movement for ${group}.`,
    streetlights_safety: `Lighting and safety gaps can reduce safe access after dark, especially for ${group}.`,
    water_leakage: `Water and drainage issues can waste resources, block access, and create hygiene risks for ${group}.`,
    waste_cleanliness: `Waste buildup can affect neighborhood hygiene, walkability, and public health for ${group}.`,
    public_transport: `Transport gaps can increase commute time and reduce reliable access for ${group}.`,
    public_space: `Accessibility gaps can make shared public spaces harder to use for ${group}.`,
    study_space: `Study-space gaps can limit quiet, affordable access for ${group}.`,
    healthcare: `Healthcare access gaps can delay basic care and pharmacy access for ${group}.`,
    daily_essentials: `Essential-service gaps can add daily friction for ${group}.`,
    sports_recreation: `Recreation gaps can reduce safe shared spaces and healthy routines for ${group}.`,
    other: `This report points to a local civic friction that may need community review for ${group}.`,
  };
  return byCategory[demand.category];
}

export function buildCivicActionBrief(
  demand: DemandReport,
  allDemands: DemandReport[],
  nowMs: number,
): CivicActionBrief {
  const communitySignalCount = getSimilarSignalCount(demand, allDemands);
  const communitySignalLabel = getCommunitySignalLabel(communitySignalCount, demand.area_label);
  const civicPriorityScore = computeCivicPriorityScore(demand, {
    similarSignalCount: communitySignalCount,
    nowMs,
  });

  return {
    categoryLabel: CATEGORY_META[demand.category].label,
    urgencyLabel: `Urgency ${clamp(demand.urgency, 1, 5)}/5`,
    severityLabel: `${sentenceCase(demand.impact_priority)} impact`,
    affectedGroupLabel: GROUP_LABEL[demand.affected_group],
    responsibleStakeholder: ACTOR_LABEL[demand.recommended_actor],
    suggestedNextAction: softenAction(demand.suggested_action),
    whyItMatters: getWhyItMatters(demand),
    confidenceLabel: `${clamp(demand.confidence_score, 0, 100)}% confidence`,
    statusLabel: STATUS_LABEL[demand.status],
    civicPriorityScore,
    civicPriorityReason: getCivicPriorityReason(demand, communitySignalCount),
    communitySignalCount,
    communitySignalLabel,
    communitySignalStrength: clamp(demand.signal_strength, 0, 100),
  };
}
