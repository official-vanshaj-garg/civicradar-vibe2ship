import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDemands } from "@/lib/data/store";
import {
  buildCivicActionBrief,
  CATEGORY_META,
  type CivicActionBrief,
  type DemandCategory,
  type DemandReport,
} from "@/domain/demand";
import { CivicRadarMap } from "@/components/map/CivicRadarMap";
import { DemandCardDrawer } from "@/components/demand/DemandCardDrawer";
import { CivicPriorityBadge } from "@/components/demand/Indicators";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Civic Issue Map · CivicRadar" },
      {
        name: "description",
        content:
          "Live hyperlocal civic issues map for Bengaluru. Filter by category and urgency, click any signal to open the Civic Issue Card.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { all, ready } = useDemands();
  const [cat, setCat] = useState<DemandCategory | "all">("all");
  const [minUrgency, setMinUrgency] = useState(1);
  const [open, setOpen] = useState<DemandReport | null>(null);
  const nowMs = useMemo(() => Date.now(), []);

  const filtered = useMemo(
    () => all.filter((d) => (cat === "all" || d.category === cat) && d.urgency >= minUrgency),
    [all, cat, minUrgency],
  );
  const sidebar = useMemo(() => {
    return filtered
      .map((d) => ({ demand: d, brief: buildCivicActionBrief(d, all, nowMs) }))
      .sort(
        (a, b) =>
          b.brief.civicPriorityScore - a.brief.civicPriorityScore ||
          b.demand.signal_strength - a.demand.signal_strength,
      )
      .slice(0, 30);
  }, [all, filtered, nowMs]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Civic Issue Map
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Bengaluru civic grid
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready ? `${filtered.length} of ${all.length} signals` : "Loading signals…"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Min urgency
            <select
              value={minUrgency}
              onChange={(e) => setMinUrgency(Number(e.target.value))}
              className="rounded-md border border-border bg-background/60 px-2 py-1 text-foreground"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
        <Chip active={cat === "all"} onClick={() => setCat("all")} color="oklch(0.82 0.16 195)">
          All ({all.length})
        </Chip>
        {(Object.keys(CATEGORY_META) as DemandCategory[]).map((c) => {
          const m = CATEGORY_META[c];
          const n = all.filter((d) => d.category === c).length;
          if (n === 0) return null;
          return (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)} color={m.color}>
              {m.label} ({n})
            </Chip>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <CivicRadarMap demands={filtered} selectedCategory={cat} onSelectDemand={setOpen} />

        <aside className="rounded-2xl border border-border bg-glass glass max-h-[640px] overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Signals in view
            </div>
          </div>
          <ul className="divide-y divide-border">
            {sidebar.map(({ demand, brief }) => {
              const m = CATEGORY_META[demand.category];
              return (
                <li key={demand.id}>
                  <button
                    onClick={() => setOpen(demand)}
                    className="block w-full px-4 py-3 text-left transition hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest"
                        style={{ color: m.color }}
                      >
                        {m.label}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        sig {demand.signal_strength}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm">{demand.title}</div>
                    <MapBrief brief={brief} area={demand.area_label} />
                  </button>
                </li>
              );
            })}
            {sidebar.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                No signals match these filters.
              </li>
            )}
          </ul>
        </aside>
      </div>

      <DemandCardDrawer
        demand={open}
        allDemands={all}
        nowMs={nowMs}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

function MapBrief({ brief, area }: { brief: CivicActionBrief; area: string }) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <CivicPriorityBadge
          score={brief.civicPriorityScore}
          reason={brief.civicPriorityReason}
          compact
        />
        <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
          {brief.statusLabel} - {brief.urgencyLabel}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {area} - {brief.responsibleStakeholder}
      </div>
      <div className="text-[11px] text-muted-foreground">{brief.communitySignalLabel}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition " +
        (active
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-border bg-surface/30 text-muted-foreground hover:text-foreground")
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </button>
  );
}
