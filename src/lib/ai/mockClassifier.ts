// CivicRadar — Demo classifier (deterministic, in-process).
// TODO: Replace with a real model provider for demo
// builds, or a hosted LLM in production. Keep `mockClassify`'s ClassifyInput/
// ClassifyOutput signature so a real provider can be dropped in behind
// `lib/ai/index.ts → classify()` with no UI/DB changes.

import type {
  AffectedGroup,
  ClassifyInput,
  ClassifyOutput,
  DemandCategory,
  ImpactPriority,
  RecommendedActor,
} from "@/domain/demand";

const KEYWORDS: Array<{ cat: DemandCategory; sub: string; words: string[] }> = [
  {
    cat: "study_space",
    sub: "Study & Work Space",
    words: ["study", "library", "quiet", "exam", "wifi", "coworking"],
  },
  {
    cat: "daily_essentials",
    sub: "Daily Essentials Access",
    words: ["food", "meal", "grocery", "supermarket", "creche", "daycare"],
  },
  {
    cat: "sports_recreation",
    sub: "Sports & Recreation",
    words: ["gym", "fitness", "workout", "yoga", "park", "sports", "playground"],
  },
  {
    cat: "healthcare",
    sub: "Healthcare Access",
    words: ["pharmacy", "medicine", "medical", "clinic", "therapy", "mental health", "counsell"],
  },
  {
    cat: "public_transport",
    sub: "Public Transport",
    words: ["bus", "auto", "metro", "transport", "shuttle", "commute", "last mile"],
  },
  {
    cat: "streetlights_safety",
    sub: "Streetlights & Safety",
    words: [
      "safety",
      "unsafe",
      "lighting",
      "dark street",
      "women",
      "patrol",
      "street light",
      "broken light",
    ],
  },
  {
    cat: "roads_potholes",
    sub: "Roads & Potholes",
    words: ["road", "pothole", "accident", "broken road", "tar", "asphalt"],
  },
  {
    cat: "water_leakage",
    sub: "Water & Leakage",
    words: ["water", "leak", "pipe", "overflow", "drain", "sewage", "flooding"],
  },
  {
    cat: "waste_cleanliness",
    sub: "Waste & Cleanliness",
    words: ["garbage", "trash", "waste", "dump", "clean", "sweep", "smell", "dustbin"],
  },
  {
    cat: "public_space",
    sub: "Public Space & Accessibility",
    words: [
      "pavement",
      "footpath",
      "wheelchair",
      "accessible",
      "pedestrian",
      "crossing",
      "toilet",
      "washroom",
    ],
  },
];

const REDACT_RE = /(\+?\d[\d\s-]{7,}\d|\b[\w.+-]+@[\w-]+\.[\w.-]+\b|\b\d{12}\b)/g;

function redact(text: string): { text: string; changed: boolean } {
  let changed = false;
  const out = text.replace(REDACT_RE, () => {
    changed = true;
    return "[redacted]";
  });
  return { text: out, changed };
}

function pickCategory(text: string): { cat: DemandCategory; sub: string; score: number } {
  const t = text.toLowerCase();
  let best = { cat: "other" as DemandCategory, sub: "Emerging civic issue", score: 0 };
  for (const k of KEYWORDS) {
    const hits = k.words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
    if (hits > best.score) best = { cat: k.cat, sub: k.sub, score: hits };
  }
  return best;
}

function pickAffectedGroup(text: string, cat: DemandCategory): AffectedGroup {
  const t = text.toLowerCase();
  if (/student|college|exam|hostel|pg/.test(t)) return "students";
  if (/women|girl|safety|harass/.test(t)) return "working_women";
  if (/senior|elder|old age|wheelchair|disabled/.test(t)) return "elderly";
  if (/child|kid|family|parent|creche/.test(t)) return "families";
  if (/commute|office|work|tech|it park|metro|bus/.test(t)) return "commuters";
  if (cat === "public_space" || cat === "healthcare") return "elderly";
  if (cat === "study_space") return "students";
  if (cat === "public_transport") return "commuters";
  return "general";
}

function pickActor(cat: DemandCategory): RecommendedActor {
  switch (cat) {
    case "public_transport":
      return "transport_planning";
    case "streetlights_safety":
      return "safety_volunteers";
    case "roads_potholes":
      return "road_maintenance";
    case "water_leakage":
      return "local_ward_team";
    case "waste_cleanliness":
      return "sanitation_team";
    case "healthcare":
      return "healthcare_partner";
    case "study_space":
      return "college_admin";
    case "public_space":
      return "local_ward_team";
    case "sports_recreation":
      return "rwa";
    case "daily_essentials":
      return "community_coordinator";
    default:
      return "rwa";
  }
}

function urgencyFromText(text: string, cat: DemandCategory): number {
  const t = text.toLowerCase();
  let u = 2;
  if (/urgent|asap|immediately|critical|emergency|dangerous|unsafe|accident/.test(t)) u += 2;
  if (/no\s+\w+\s+nearby|nothing nearby|no\s+\w+\s+available/.test(t)) u += 1;
  if (cat === "streetlights_safety" || cat === "healthcare" || cat === "roads_potholes") u += 1;
  return Math.max(1, Math.min(5, u));
}

function priorityFromUrgency(u: number, cat: DemandCategory): ImpactPriority {
  if (cat === "streetlights_safety" && u >= 3) return "critical";
  if (u >= 5) return "critical";
  if (u >= 4) return "high";
  if (u >= 3) return "medium";
  return "low";
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function makeTitle(cat: DemandCategory, sub: string, area?: string): string {
  const base = titleCase(sub);
  return area ? `${base} issue in ${area}` : `${base} reported nearby`;
}

function makeSummary(cat: DemandCategory, sub: string, area?: string): string {
  const where = area ? ` in ${area}` : "";
  return `Citizens are flagging issues regarding ${sub.toLowerCase()}${where}. Multiple signals indicate a community gap worth investigating.`;
}

function makeAction(cat: DemandCategory, actor: RecommendedActor, area?: string): string {
  const where = area ? ` near ${area}` : "";
  if (cat === "study_space") return `Coordinate with local admin to open a study space${where}.`;
  if (cat === "daily_essentials")
    return `Support community access to essentials and childcare${where}.`;
  if (cat === "sports_recreation")
    return `Revitalize or maintain public parks and recreation areas${where}.`;
  if (cat === "healthcare") return `Improve local healthcare and pharmacy access${where}.`;
  if (cat === "public_transport")
    return `Review last-mile connectivity and transport frequency${where}.`;
  if (cat === "streetlights_safety")
    return `Repair streetlights and increase safety patrols${where}.`;
  if (cat === "roads_potholes") return `Dispatch road maintenance team to fix potholes${where}.`;
  if (cat === "water_leakage") return `Inspect and repair broken pipes or drainage issues${where}.`;
  if (cat === "waste_cleanliness")
    return `Organize a cleanup drive or clear overflowing garbage${where}.`;
  if (cat === "public_space") return `Fix broken pavements and improve accessibility${where}.`;
  return `Investigate the community signal${where} and route to the ${actor.replace(/_/g, " ")}.`;
}

// Deterministic small hash → 0..1 (so signal_strength/confidence vary but are stable)
function h(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
  return (n % 1000) / 1000;
}

export function mockClassify(input: ClassifyInput): ClassifyOutput {
  const raw = input.raw_text || "";
  const { text: clean, changed } = redact(raw.trim().replace(/\s+/g, " "));
  const { cat, sub, score } = pickCategory(clean);
  const affected = pickAffectedGroup(clean, cat);
  const actor = pickActor(cat);
  const urgency = urgencyFromText(clean, cat);
  const priority = priorityFromUrgency(urgency, cat);

  const lengthBoost = Math.min(20, Math.floor(clean.length / 20));
  const keywordBoost = Math.min(25, score * 8);
  const noiseSeed = h(clean + (input.area_label || ""));
  const signal = Math.max(
    35,
    Math.min(95, 50 + lengthBoost + keywordBoost + Math.floor(noiseSeed * 15)),
  );
  const confidence = Math.max(
    55,
    Math.min(96, 70 + keywordBoost + Math.floor(noiseSeed * 10) - (cat === "other" ? 15 : 0)),
  );
  const similar = Math.max(1, Math.min(28, Math.floor(2 + noiseSeed * 18 + (signal - 50) / 6)));

  const area = input.area_label;
  return {
    clean_text: clean,
    title: makeTitle(cat, sub, area),
    need_summary: makeSummary(cat, sub, area),
    category: cat,
    sub_category: sub,
    affected_group: affected,
    urgency,
    signal_strength: signal,
    impact_priority: priority,
    privacy_status: changed ? "redacted" : "clean",
    confidence_score: confidence,
    recommended_actor: actor,
    suggested_action: makeAction(cat, actor, area),
    similar_reports_count: similar,
  };
}
