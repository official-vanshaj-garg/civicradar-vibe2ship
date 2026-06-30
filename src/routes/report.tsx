import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Sparkles,
} from "lucide-react";
import { classify } from "@/lib/ai";
import type {
  ApproximateLocation,
  ClassifyOutput,
  DemandReport,
  EvidenceMetadata,
  EvidenceType,
} from "@/domain/demand";
import {
  buildCivicActionBrief,
  buildGoogleMapsSearchUrl,
  CATEGORY_META,
  getApproximateLocationDetail,
  getApproximateLocationLabel,
  getIssueApproximateLocation,
} from "@/domain/demand";
import { BLR_ZONES, projectToCanvas, resolveLocation, roundCoord } from "@/lib/geo/bengaluru";
import { addDemand, getSessionId, useDemands } from "@/lib/data/store";
import {
  CivicPriorityBadge,
  ConfidenceBar,
  ImpactPriorityTag,
  SignalStrengthMeter,
  UrgencyChip,
} from "@/components/demand/Indicators";
import { AIBadge } from "@/components/layout/AIBadge";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report Issue · CivicRadar" },
      {
        name: "description",
        content:
          "Tell CivicRadar what your area is missing. We turn it into a structured Civic Issue Card in seconds.",
      },
    ],
  }),
  component: ReportPage,
});

const EXAMPLES = [
  "Large pothole near college gate causing bike skids",
  "Streetlights not working near hostel road",
  "Garbage overflowing near bus stop",
  "Water leakage blocking the footpath",
  "Unsafe crossing near metro exit",
];

const EVIDENCE_OPTIONS: Array<{ type: EvidenceType; label: string; hint: string }> = [
  { type: "none", label: "No evidence", hint: "Report can still be submitted." },
  { type: "photo", label: "Photo metadata", hint: "File upload is not enabled." },
  { type: "video", label: "Video metadata", hint: "File upload is not enabled." },
  { type: "witness_note", label: "Witness note", hint: "Short text note only." },
];

type GeoStatus =
  | "idle"
  | "requesting"
  | "captured"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className={"h-1.5 w-8 rounded-full " + (step >= n ? "bg-primary" : "bg-muted")}
        />
      ))}
    </div>
  );
}

function findNearestZoneKey(lat: number, lng: number) {
  return BLR_ZONES.reduce(
    (best, zone) => {
      const distance = (zone.lat - lat) ** 2 + (zone.lng - lng) ** 2;
      return distance < best.distance ? { key: zone.key, distance } : best;
    },
    { key: BLR_ZONES[0].key, distance: Number.POSITIVE_INFINITY },
  ).key;
}

function ReportPage() {
  const { all, contributionScore } = useDemands();
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [zoneKey, setZoneKey] = useState<string | null>(null);
  const [locText, setLocText] = useState<string>("");
  const [approximateLocation, setApproximateLocation] = useState<ApproximateLocation | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("none");
  const [witnessNote, setWitnessNote] = useState("");
  const [running, setRunning] = useState(false);
  const [card, setCard] = useState<ClassifyOutput | null>(null);
  const [submitted, setSubmitted] = useState<DemandReport | null>(null);
  const nowMs = useMemo(() => Date.now(), []);

  const zone = useMemo(
    () => (zoneKey ? (BLR_ZONES.find((z) => z.key === zoneKey) ?? null) : null),
    [zoneKey],
  );

  function pickZone(key: string) {
    if (key !== zoneKey) {
      setZoneKey(key);
      // Invalidate any stale Civic Issue Card built against the previous zone.
      if (card) setCard(null);
    }
  }

  // Deterministic jitter so user submissions don't stack on the exact zone centroid.
  function jitter(n: number, seed: string, salt: number) {
    let h = salt;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const r = (h % 10000) / 10000 - 0.5; // -0.5..0.5
    return n + r * 0.018; // ~±1km
  }

  function requestApproximateLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      setGeoMessage("Location permission was not available. Zone selection still works.");
      return;
    }

    setGeoStatus("requesting");
    setGeoMessage("Requesting approximate browser location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const captured: ApproximateLocation = {
          lat: roundCoord(position.coords.latitude),
          lng: roundCoord(position.coords.longitude),
          accuracyMeters: Number.isFinite(position.coords.accuracy)
            ? Math.round(position.coords.accuracy)
            : undefined,
          source: "browser_geolocation",
          capturedAt: new Date().toISOString(),
        };

        setApproximateLocation(captured);
        setGeoStatus("captured");
        setGeoMessage("Approximate browser location captured. You can still adjust the zone.");
        if (!zoneKey) setZoneKey(findNearestZoneKey(captured.lat, captured.lng));
        if (!locText.trim()) setLocText("Approximate browser location");
        if (card) setCard(null);
      },
      (error) => {
        setApproximateLocation(null);
        if (error.code === 1) {
          setGeoStatus("denied");
          setGeoMessage("Location permission was not available. Zone selection still works.");
        } else if (error.code === 3) {
          setGeoStatus("timeout");
          setGeoMessage("Approximate location timed out. Zone selection still works.");
        } else {
          setGeoStatus("error");
          setGeoMessage("Approximate location was unavailable. Zone selection still works.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 60000,
      },
    );
  }

  async function runClassify() {
    if (!zone) return;
    setRunning(true);
    try {
      const out = await classify({
        raw_text: text,
        area_label: zone.label,
        location_text: locText || zone.label,
        latitude: approximateLocation?.lat ?? zone.lat,
        longitude: approximateLocation?.lng ?? zone.lng,
      });
      setCard(out);
      setStep(3);
    } finally {
      setRunning(false);
    }
  }

  function submit() {
    if (!card || !zone) return;
    const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const evidence = buildEvidenceMetadata(evidenceType, witnessNote);
    const fallbackLocation: ApproximateLocation = {
      lat: jitter(zone.lat, id, 1),
      lng: jitter(zone.lng, id, 7),
      source: "zone",
    };
    const locationAssist = approximateLocation ?? fallbackLocation;
    // Resolve location from the user's selection — single source of truth.
    // resolveLocation guarantees: zone-derived centroid fallback if no coords,
    // and "Unknown Bengaluru Area" instead of any real zone if area is unknown.
    const loc = resolveLocation({
      zone_key: zone.key,
      area_label: zone.label,
      location_text: locText,
      latitude: locationAssist.lat,
      longitude: locationAssist.lng,
    });
    const storedApproximateLocation: ApproximateLocation = {
      lat: loc.latitude,
      lng: loc.longitude,
      accuracyMeters: locationAssist.accuracyMeters,
      source: locationAssist.source,
      capturedAt: locationAssist.capturedAt,
    };
    // IMPORTANT: spread `card` FIRST, then location fields LAST so the AI
    // output can never overwrite area_label / location_text / lat / lng.
    const report: DemandReport = {
      id,
      created_at: new Date().toISOString(),
      reporter_session: getSessionId(),
      raw_text: text,
      status: "new",
      upvotes: 1,
      evidence,
      approximateLocation: storedApproximateLocation,
      ...card,
      location_text: loc.location_text,
      area_label: loc.area_label,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
    addDemand(report);
    setSubmitted(report);
    setStep(4);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Report Issue
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Report a local issue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Anonymous · privacy-safe · no login.</p>
        </div>
        <AIBadge />
      </div>

      <div className="mb-6 flex items-center gap-3">
        <StepDots step={step} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Step {step} of 4
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-glass p-6 glass">
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-semibold">1. Describe the issue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Plain language is fine. Phone numbers and emails are auto-redacted.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="e.g. Streetlights have been off near the hostel road for three nights, making the area unsafe after 8 PM."
                className="mt-4 w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-sm outline-none focus:border-primary/60"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setText(ex)}
                    className="rounded-full border border-border bg-surface/40 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
                  >
                    {ex.slice(0, 38)}…
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  disabled={text.trim().length < 12}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Next: Location <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-semibold">2. Where in Bengaluru?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Coordinates are rounded to ~110m for privacy.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BLR_ZONES.map((z) => (
                  <button
                    key={z.key}
                    onClick={() => pickZone(z.key)}
                    className={
                      "rounded-xl border px-3 py-2 text-left text-sm transition " +
                      (zoneKey === z.key
                        ? "border-primary bg-primary/10 text-foreground glow-teal"
                        : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-primary" />{" "}
                      <span className="font-medium text-foreground">{z.label}</span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {z.lat.toFixed(3)}, {z.lng.toFixed(3)}
                    </div>
                  </button>
                ))}
              </div>
              <ApproximateLocationAssist
                status={geoStatus}
                message={geoMessage}
                location={approximateLocation}
                onRequest={requestApproximateLocation}
              />
              <div className="mt-4">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Specific landmark (optional)
                </label>
                <input
                  value={locText}
                  onChange={(e) => setLocText(e.target.value)}
                  placeholder={`e.g. Near landmark in ${zone?.label ?? "your area"}`}
                  className="mt-1 w-full rounded-md border border-border bg-background/50 p-2.5 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <EvidenceMetadataPicker
                evidenceType={evidenceType}
                setEvidenceType={setEvidenceType}
                witnessNote={witnessNote}
                setWitnessNote={setWitnessNote}
              />
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={runClassify}
                  disabled={running || !zone}
                  title={!zone ? "Pick a zone first" : undefined}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate Civic Issue Card
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && card && zone && (
            <div>
              <h2 className="font-display text-xl font-semibold">3. Preview Civic Issue Card</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Structured by the CivicRadar intelligence layer · demo mode.
              </p>
              <DemandPreview
                card={card}
                area={zone.label}
                location={locText || zone.label}
                evidence={buildEvidenceMetadata(evidenceType, witnessNote)}
                approximateLocation={
                  approximateLocation ?? {
                    lat: roundCoord(zone.lat),
                    lng: roundCoord(zone.lng),
                    source: "zone",
                  }
                }
                allDemands={all}
                nowMs={nowMs}
              />
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={submit}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Check className="h-4 w-4" /> Submit Signal
                </button>
              </div>
            </div>
          )}

          {step === 4 && submitted && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary glow-teal">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                Signal received in {submitted.area_label}.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your Civic Issue Card is now live on the CivicRadar Bengaluru pilot — visible on the
                dashboard, map and insights in real time.
              </p>
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-primary/30 bg-primary/5 p-4 text-left">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  {CATEGORY_META[submitted.category].label}
                </div>
                <div className="mt-1 text-sm font-semibold">{submitted.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {submitted.area_label} · signal {submitted.signal_strength} ·{" "}
                  {submitted.impact_priority} impact
                </div>
              </div>
              <ReportLocationHandoff demand={submitted} />
              <div className="mx-auto mt-3 max-w-md rounded-xl border border-border bg-surface/40 p-4 text-left">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Community contribution
                </div>
                <div className="mt-1 font-display text-2xl font-semibold">{contributionScore}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  +10 for this report
                  {submitted.evidence?.type && submitted.evidence.type !== "none"
                    ? " + 3 for evidence metadata"
                    : ""}
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  to="/dashboard"
                  className="rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  View dashboard
                </Link>
                <Link to="/map" className="rounded-md border border-border px-4 py-2 text-sm">
                  See on map
                </Link>
                <button
                  onClick={() => {
                    setStep(1);
                    setText("");
                    setCard(null);
                    setSubmitted(null);
                    setEvidenceType("none");
                    setWitnessNote("");
                    setApproximateLocation(null);
                    setGeoStatus("idle");
                    setGeoMessage("");
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Report another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side context panel */}
        <aside className="rounded-2xl border border-border bg-glass p-5 glass">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pilot zone
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold">
            {zone?.label ?? "Pick a zone"}
          </h3>
          <div className="mt-3 aspect-square rounded-xl border border-border bg-[oklch(0.14_0.025_250)] p-2">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              {BLR_ZONES.map((z) => {
                const active = z.key === zoneKey;
                const p = projectToCanvas(z.lat, z.lng);
                return (
                  <g key={z.key}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={active ? 3.6 : 1.8}
                      fill={active ? "oklch(0.82 0.16 195)" : "oklch(0.7 0.04 240 / 0.5)"}
                      style={{
                        filter: active ? "drop-shadow(0 0 3px oklch(0.82 0.16 195))" : undefined,
                      }}
                    />
                    {active && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={3.6}
                        fill="none"
                        stroke="oklch(0.82 0.16 195)"
                        strokeWidth="0.4"
                        className="anim-radar-pulse"
                        style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
            <li>· Anonymous reporting (no login)</li>
            <li>· Coordinates rounded for privacy</li>
            <li>· Phone / email auto-redacted</li>
            <li>· Responsible stakeholder recommended from category</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function buildEvidenceMetadata(type: EvidenceType, note: string): EvidenceMetadata {
  const cleanNote = note.trim().slice(0, 160);
  return {
    type,
    note: type === "witness_note" && cleanNote ? cleanNote : undefined,
    recordedAt: new Date().toISOString(),
  };
}

function ApproximateLocationAssist({
  status,
  message,
  location,
  onRequest,
}: {
  status: GeoStatus;
  message: string;
  location: ApproximateLocation | null;
  onRequest: () => void;
}) {
  const requesting = status === "requesting";
  const captured = status === "captured" && location;

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Browser-local assist
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional approximate location. Zone fallback remains available.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequest}
          disabled={requesting}
          className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/15 disabled:opacity-60"
        >
          <LocateFixed className={"h-3.5 w-3.5 " + (requesting ? "animate-spin" : "")} />
          {requesting ? "Checking location..." : "Use approximate current location"}
        </button>
      </div>
      {message && (
        <p className={"mt-3 text-xs " + (captured ? "text-primary" : "text-muted-foreground")}>
          {message}
        </p>
      )}
      {location && (
        <div className="mt-3 rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          <div className="font-mono uppercase tracking-widest text-foreground">
            {getApproximateLocationLabel(location)}
          </div>
          <div className="mt-1">{getApproximateLocationDetail(location)}</div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Approximate location only - no official dispatch is performed.
      </p>
    </div>
  );
}

function ReportLocationHandoff({ demand }: { demand: DemandReport }) {
  const location = getIssueApproximateLocation(demand);
  if (!location) return null;

  return (
    <div className="mx-auto mt-3 max-w-md rounded-xl border border-border bg-surface/40 p-4 text-left">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Approximate location
      </div>
      <div className="mt-1 text-sm font-medium">{getApproximateLocationLabel(location)}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {getApproximateLocationDetail(location)}
      </div>
      <a
        href={buildGoogleMapsSearchUrl(location)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        Open approximate location in Google Maps <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <p className="mt-2 text-[11px] text-muted-foreground">
        External map handoff only. Zone fallback remains available.
      </p>
    </div>
  );
}

function EvidenceMetadataPicker({
  evidenceType,
  setEvidenceType,
  witnessNote,
  setWitnessNote,
}: {
  evidenceType: EvidenceType;
  setEvidenceType: (type: EvidenceType) => void;
  witnessNote: string;
  setWitnessNote: (note: string) => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-border bg-surface/30 p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Evidence metadata
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Evidence metadata only - no files are uploaded in this demo.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {EVIDENCE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => setEvidenceType(option.type)}
            className={
              "rounded-lg border p-3 text-left transition " +
              (evidenceType === option.type
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border bg-background/35 text-muted-foreground hover:border-primary/40 hover:text-foreground")
            }
          >
            <div className="text-sm font-medium">{option.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{option.hint}</div>
          </button>
        ))}
      </div>
      {evidenceType === "witness_note" && (
        <div className="mt-3">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Witness note
          </label>
          <textarea
            value={witnessNote}
            onChange={(e) => setWitnessNote(e.target.value.slice(0, 160))}
            rows={3}
            placeholder="Short note from someone who observed the issue."
            className="mt-1 w-full resize-none rounded-md border border-border bg-background/50 p-2.5 text-sm outline-none focus:border-primary/60"
          />
          <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
            {witnessNote.length}/160
          </div>
        </div>
      )}
    </div>
  );
}

function DemandPreview({
  card,
  area,
  location,
  evidence,
  approximateLocation,
  allDemands,
  nowMs,
}: {
  card: ClassifyOutput;
  area: string;
  location: string;
  evidence: EvidenceMetadata;
  approximateLocation: ApproximateLocation;
  allDemands: DemandReport[];
  nowMs: number;
}) {
  const meta = CATEGORY_META[card.category];
  const previewDemand: DemandReport = {
    id: "preview",
    created_at: new Date(nowMs).toISOString(),
    reporter_session: "preview",
    raw_text: card.clean_text,
    location_text: location,
    area_label: area,
    latitude: approximateLocation.lat,
    longitude: approximateLocation.lng,
    status: "new",
    upvotes: 1,
    evidence,
    approximateLocation,
    ...card,
  };
  const brief = buildCivicActionBrief(previewDemand, allDemands, nowMs);
  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: meta.color }}
          >
            {meta.label} · {card.sub_category}
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{card.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{card.need_summary}</p>
        </div>
        <SignalStrengthMeter value={card.signal_strength} size={76} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <UrgencyChip value={card.urgency} />
        <ImpactPriorityTag value={card.impact_priority} />
        <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
          Affected: {brief.affectedGroupLabel}
        </span>
        <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
          Privacy: {card.privacy_status}
        </span>
      </div>
      <div className="mt-4">
        <ConfidenceBar value={card.confidence_score} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Field label="Location">
          {location} · {area}
        </Field>
        <Field label="Approximate location">
          {getApproximateLocationLabel(approximateLocation)} -{" "}
          {getApproximateLocationDetail(approximateLocation)}
        </Field>
        <Field label="Civic Priority">
          <CivicPriorityBadge score={brief.civicPriorityScore} reason={brief.civicPriorityReason} />
        </Field>
        <Field label="Responsible stakeholder">{brief.responsibleStakeholder}</Field>
        <Field label="Evidence metadata">{formatEvidence(evidence)}</Field>
        <Field label="Community signal strength">{brief.communitySignalLabel}</Field>
        <Field label="Suggested next action">{brief.suggestedNextAction}</Field>
        <Field label="Why it matters">{brief.whyItMatters}</Field>
      </div>
    </div>
  );
}

function formatEvidence(evidence: EvidenceMetadata) {
  if (evidence.type === "none") return "No evidence metadata";
  if (evidence.type === "photo") return "Photo metadata noted";
  if (evidence.type === "video") return "Video metadata noted";
  return evidence.note ? `Witness note: ${evidence.note}` : "Witness note metadata noted";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}
