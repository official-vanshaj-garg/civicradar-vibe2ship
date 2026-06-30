import type { DemandReport } from "@/domain/demand";
import {
  buildCivicActionBrief,
  buildCivicLifecycle,
  buildGoogleMapsSearchUrl,
  CATEGORY_META,
  getApproximateLocationDetail,
  getApproximateLocationLabel,
  getEvidenceSummary,
  getIssueApproximateLocation,
  getVerificationLabel,
} from "@/domain/demand";
import {
  X,
  MapPin,
  Users,
  ShieldCheck,
  Lightbulb,
  Activity,
  Hash,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  CivicPriorityBadge,
  CivicPriorityMeter,
  ConfidenceBar,
  ImpactPriorityTag,
  SignalStrengthMeter,
  UrgencyChip,
} from "./Indicators";

export function DemandCardDrawer({
  demand,
  allDemands,
  nowMs,
  verifiedByYou = false,
  onVerify,
  onMarkResolvedInDemo,
  onClose,
}: {
  demand: DemandReport | null;
  allDemands: DemandReport[];
  nowMs: number;
  verifiedByYou?: boolean;
  onVerify?: (id: string) => void;
  onMarkResolvedInDemo?: (id: string) => void;
  onClose: () => void;
}) {
  if (!demand) return null;
  const meta = CATEGORY_META[demand.category];
  const brief = buildCivicActionBrief(demand, allDemands, nowMs);
  const lifecycle = buildCivicLifecycle(demand, brief.responsibleStakeholder);
  const verificationCount = demand.verificationCount ?? 0;
  const approximateLocation = getIssueApproximateLocation(demand);
  const googleMapsUrl = approximateLocation ? buildGoogleMapsSearchUrl(approximateLocation) : null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm anim-float-up"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background/95 shadow-elevated glass-strong anim-float-up">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full anim-signal-blink"
              style={{ background: meta.color }}
            />
            Civic Issue Card · {demand.id.slice(0, 8)}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-12 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="text-[11px] font-mono uppercase tracking-[0.18em]"
                style={{ color: meta.color }}
              >
                {meta.label} · {demand.sub_category}
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
                {demand.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CivicPriorityMeter score={brief.civicPriorityScore} size={84} />
              <SignalStrengthMeter value={demand.signal_strength} size={64} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <UrgencyChip value={demand.urgency} />
            <ImpactPriorityTag value={demand.impact_priority} />
            <CivicPriorityBadge
              score={brief.civicPriorityScore}
              reason={brief.civicPriorityReason}
            />
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Privacy: {demand.privacy_status}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              {brief.communitySignalLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <ClipboardCheck className="h-3 w-3" />
              {getVerificationLabel(verificationCount)}
            </span>
          </div>

          <div className="mt-6 grid gap-4 rounded-xl border border-border bg-surface/60 p-4">
            <Field label="Need summary">{demand.need_summary}</Field>
            <Field label="Civic Priority">
              {brief.civicPriorityScore}/100 - {brief.civicPriorityReason}
            </Field>
            <Field label="Evidence metadata">{getEvidenceSummary(demand.evidence)}</Field>
            <Field label="Approximate location">
              {getApproximateLocationLabel(approximateLocation)} -{" "}
              {getApproximateLocationDetail(approximateLocation)}
            </Field>
            <Field label="Community signal strength">
              {brief.communitySignalLabel} - signal strength {brief.communitySignalStrength}/100
            </Field>
            <Field label="Why it matters">{brief.whyItMatters}</Field>
            <ConfidenceBar value={demand.confidence_score} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat icon={Users} label="Affected group" value={brief.affectedGroupLabel} />
            <Stat icon={MapPin} label="Location" value={demand.location_text} />
            <Stat icon={Activity} label="Status" value={brief.statusLabel} />
            <Stat
              icon={Lightbulb}
              label="Responsible stakeholder"
              value={brief.responsibleStakeholder}
            />
          </div>

          {googleMapsUrl && (
            <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Approximate location
              </div>
              <p className="mt-1 text-sm text-foreground">
                {getApproximateLocationLabel(approximateLocation)} -{" "}
                {getApproximateLocationDetail(approximateLocation)}
              </p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Open approximate location in Google Maps <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                External map handoff only. No Google Maps script, API key, or official dispatch is
                used.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-primary">
              Suggested next action
            </div>
            <p className="mt-1 text-sm">{brief.suggestedNextAction}</p>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  Community verification
                </div>
                <p className="mt-1 text-sm text-foreground">
                  {getVerificationLabel(verificationCount)}
                </p>
              </div>
              <button
                onClick={() => onVerify?.(demand.id)}
                disabled={verifiedByYou}
                className={
                  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition " +
                  (verifiedByYou
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-foreground hover:border-primary/50 hover:text-primary")
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {verifiedByYou ? "Verified by you" : "Verify this issue"}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Local browser/device verification only. No official dispatch is performed.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Civic lifecycle
            </div>
            <div className="mt-3 space-y-3">
              {lifecycle.map((stage) => (
                <div key={stage.label} className="flex gap-3">
                  {stage.complete ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{stage.label}</div>
                    <div className="text-xs text-muted-foreground">{stage.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground">
                Transparent demo workflow - no official dispatch is performed.
              </p>
              <button
                onClick={() => onMarkResolvedInDemo?.(demand.id)}
                disabled={demand.resolvedInDemo === true}
                className={
                  "rounded-md border px-3 py-1.5 text-xs transition " +
                  (demand.resolvedInDemo
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/50 hover:text-primary")
                }
              >
                {demand.resolvedInDemo ? "Resolved in demo" : "Mark resolved in demo"}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              Original report
            </div>
            <p className="mt-1 text-sm italic text-muted-foreground">"{demand.raw_text}"</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <div>lat</div>
              <div className="mt-0.5 text-foreground">{demand.latitude.toFixed(3)}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <div>lng</div>
              <div className="mt-0.5 text-foreground">{demand.longitude.toFixed(3)}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <div>area</div>
              <div className="mt-0.5 text-foreground">{demand.area_label}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 truncate text-sm capitalize text-foreground">{value}</div>
      </div>
    </div>
  );
}
