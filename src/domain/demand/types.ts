// CivicRadar AI types — shared between the demo classifier and any future
// model provider plugged into `lib/ai/index.ts → classify()`.

export type DemandCategory =
  | "study_space"
  | "daily_essentials"
  | "sports_recreation"
  | "healthcare"
  | "public_transport"
  | "streetlights_safety"
  | "roads_potholes"
  | "water_leakage"
  | "waste_cleanliness"
  | "public_space"
  | "other";

export type AffectedGroup =
  | "students"
  | "working_women"
  | "elderly"
  | "families"
  | "commuters"
  | "disabled_citizens"
  | "general";

export type RecommendedActor =
  | "local_ward_team"
  | "rwa"
  | "sanitation_team"
  | "transport_planning"
  | "safety_volunteers"
  | "college_admin"
  | "community_coordinator"
  | "road_maintenance"
  | "healthcare_partner";

export type ImpactPriority = "low" | "medium" | "high" | "critical";
export type PrivacyStatus = "clean" | "redacted";
export type DemandStatus = "new" | "reviewing" | "acknowledged";
export type EvidenceType = "none" | "photo" | "video" | "witness_note";
export type ApproximateLocationSource = "browser_geolocation" | "zone";

export interface EvidenceMetadata {
  type: EvidenceType;
  note?: string;
  recordedAt?: string;
}

export interface ApproximateLocation {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  source: ApproximateLocationSource;
  capturedAt?: string;
}

export interface ClassifyInput {
  raw_text: string;
  location_text?: string;
  area_label?: string;
  latitude?: number;
  longitude?: number;
}

export interface ClassifyOutput {
  clean_text: string;
  title: string;
  need_summary: string;
  category: DemandCategory;
  sub_category: string;
  affected_group: AffectedGroup;
  urgency: number; // 1-5
  signal_strength: number; // 0-100
  impact_priority: ImpactPriority;
  privacy_status: PrivacyStatus;
  confidence_score: number; // 0-100
  recommended_actor: RecommendedActor;
  suggested_action: string;
  similar_reports_count: number;
}

export interface DemandReport extends ClassifyOutput {
  id: string;
  created_at: string;
  reporter_session: string;
  raw_text: string;
  location_text: string;
  area_label: string;
  latitude: number;
  longitude: number;
  status: DemandStatus;
  upvotes: number;
  evidence?: EvidenceMetadata;
  approximateLocation?: ApproximateLocation;
  verificationCount?: number;
  resolvedInDemo?: boolean;
}

export const CATEGORY_META: Record<DemandCategory, { label: string; icon: string; color: string }> =
  {
    roads_potholes: {
      label: "Roads & Potholes",
      icon: "Construction",
      color: "oklch(0.65 0.18 35)",
    },
    streetlights_safety: {
      label: "Streetlights & Safety",
      icon: "Lightbulb",
      color: "oklch(0.70 0.22 15)",
    },
    water_leakage: { label: "Water & Leakage", icon: "Droplets", color: "oklch(0.65 0.20 250)" },
    waste_cleanliness: {
      label: "Waste & Cleanliness",
      icon: "Trash2",
      color: "oklch(0.68 0.13 110)",
    },
    public_transport: {
      label: "Public Transport Access",
      icon: "Bus",
      color: "oklch(0.75 0.18 220)",
    },
    public_space: {
      label: "Public Space & Accessibility",
      icon: "Map",
      color: "oklch(0.72 0.13 280)",
    },
    sports_recreation: {
      label: "Sports & Recreation Gaps",
      icon: "Dumbbell",
      color: "oklch(0.75 0.16 145)",
    },
    study_space: { label: "Study & Work Spaces", icon: "BookOpen", color: "oklch(0.82 0.16 195)" },
    healthcare: {
      label: "Healthcare & Pharmacy",
      icon: "HeartPulse",
      color: "oklch(0.68 0.22 25)",
    },
    daily_essentials: {
      label: "Daily Essentials Access",
      icon: "ShoppingBasket",
      color: "oklch(0.80 0.17 70)",
    },
    other: { label: "Other", icon: "Sparkles", color: "oklch(0.70 0.04 250)" },
  };

export const ACTOR_LABEL: Record<RecommendedActor, string> = {
  local_ward_team: "Local Ward Team",
  rwa: "Residents Welfare Association (RWA)",
  sanitation_team: "Sanitation & Waste Team",
  transport_planning: "Transport Planning Team",
  safety_volunteers: "Public Safety Volunteers",
  college_admin: "College/Community Admin",
  community_coordinator: "Community Coordinator",
  road_maintenance: "Road Maintenance Team",
  healthcare_partner: "Healthcare Access Partner",
};

export const PRIORITY_RANK: Record<ImpactPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
