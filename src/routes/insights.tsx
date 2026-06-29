import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useDemands } from "@/lib/data/store";
import {
  ACTOR_LABEL,
  buildCivicActionBrief,
  CATEGORY_META,
  type CivicActionBrief,
  type DemandReport,
} from "@/domain/demand";
import { BLR_ZONES } from "@/lib/geo/bengaluru";
import { Lightbulb, Target, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · CivicRadar" },
      {
        name: "description",
        content:
          "Community signal groups, Civic Priority scores, responsible stakeholder breakdown and recommended actions for the Bengaluru pilot.",
      },
    ],
  }),
  component: Insights,
});

interface SignalGroup {
  area: string;
  category: keyof typeof CATEGORY_META;
  count: number;
  avgSignal: number;
  avgPriority: number;
  sample: DemandReport;
  sampleBrief: CivicActionBrief;
}

function Insights() {
  const { all } = useDemands();
  const nowMs = useMemo(() => Date.now(), []);

  const signalGroups = useMemo<SignalGroup[]>(() => {
    const map = new Map<string, DemandReport[]>();
    all.forEach((d) => {
      const k = `${d.area_label}__${d.category}`;
      const arr = map.get(k) || [];
      arr.push(d);
      map.set(k, arr);
    });
    const out: SignalGroup[] = [];
    map.forEach((rows, k) => {
      if (rows.length < 2) return;
      const [area, category] = k.split("__") as [string, keyof typeof CATEGORY_META];
      const avgSignal = Math.round(rows.reduce((s, d) => s + d.signal_strength, 0) / rows.length);
      const withBriefs = rows
        .map((d) => ({ demand: d, brief: buildCivicActionBrief(d, all, nowMs) }))
        .sort((a, b) => b.brief.civicPriorityScore - a.brief.civicPriorityScore);
      const worst = withBriefs[0];
      const avgPriority = Math.round(
        withBriefs.reduce((sum, row) => sum + row.brief.civicPriorityScore, 0) / withBriefs.length,
      );
      out.push({
        area,
        category,
        count: rows.length,
        avgSignal,
        avgPriority,
        sample: worst.demand,
        sampleBrief: worst.brief,
      });
    });
    return out.sort((a, b) => b.avgPriority * b.count - a.avgPriority * a.count).slice(0, 6);
  }, [all, nowMs]);

  const actorBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((d) => m.set(d.recommended_actor, (m.get(d.recommended_actor) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const studentAreas = useMemo(() => {
    const m = new Map<string, number>();
    all
      .filter((d) => d.affected_group === "students")
      .forEach((d) => m.set(d.area_label, (m.get(d.area_label) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [all]);

  const actionScorecards = useMemo(() => {
    return signalGroups.slice(0, 4).map((c) => {
      const score = c.avgPriority;
      return { ...c, score };
    });
  }, [signalGroups]);

  const underservedZones = useMemo(() => {
    const m = new Map<string, { areas: Set<string>; total: number }>();
    BLR_ZONES.forEach((z) => m.set(z.label, { areas: new Set(), total: 0 }));
    all.forEach((d) => {
      const e = m.get(d.area_label);
      if (!e) return;
      e.areas.add(d.category);
      e.total += 1;
    });
    return [...m.entries()]
      .map(([area, v]) => ({ area, categories: v.areas.size, total: v.total }))
      .sort((a, b) => b.categories - a.categories)
      .slice(0, 5);
  }, [all]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Insights</div>
      <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
        Civic intelligence · Bengaluru
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        From scattered civic issue signals to ranked, actionable civic priorities. Signal groups are
        generated deterministically by area and category in demo mode; no official escalation is
        implied.
      </p>

      {/* Community signal groups */}
      <section className="mt-8">
        <SectionTitle icon={Sparkles}>Community signal groups</SectionTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {signalGroups.map((c) => {
            const m = CATEGORY_META[c.category];
            return (
              <div
                key={`${c.area}-${c.category}`}
                className="rounded-2xl border border-border bg-glass p-5 glass"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: m.color }}
                  >
                    {m.label}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {c.area}
                  </div>
                </div>
                <div className="mt-2 font-display text-base font-semibold leading-snug">
                  {c.count} signals - avg Civic Priority {c.avgPriority}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  "{c.sample.raw_text}"
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {c.sampleBrief.communitySignalLabel} - {c.sampleBrief.civicPriorityReason}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.avgPriority}%`, background: m.color }}
                  />
                </div>
              </div>
            );
          })}
          {signalGroups.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Not enough repeated local signals yet to form a group.
            </div>
          )}
        </div>
      </section>

      {/* Responsible stakeholder routing */}
      <section className="mt-12">
        <SectionTitle icon={Lightbulb}>Responsible stakeholder routing</SectionTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {signalGroups.slice(0, 6).map((c) => (
            <div
              key={`act-${c.area}-${c.category}`}
              className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  Responsible stakeholder: {ACTOR_LABEL[c.sample.recommended_actor]}
                </div>
                <div className="mt-0.5 text-sm font-medium">
                  {c.sampleBrief.suggestedNextAction}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.area} - {c.count} signals - Civic Priority {c.avgPriority}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <SectionTitle icon={Users}>Responsible stakeholder breakdown</SectionTitle>
          <ul className="mt-4 space-y-2">
            {actorBreakdown.map(([a, n]) => {
              const max = Math.max(...actorBreakdown.map(([, v]) => v));
              return (
                <li key={a} className="flex items-center gap-3">
                  <span className="w-44 truncate text-sm">
                    {ACTOR_LABEL[a as keyof typeof ACTOR_LABEL] ?? a}
                  </span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-secondary to-primary"
                      style={{ width: `${(n / max) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <SectionTitle icon={Users}>Student-area insights</SectionTitle>
          <p className="mt-2 text-xs text-muted-foreground">
            Where students are flagging the most unmet needs.
          </p>
          <ul className="mt-3 space-y-2">
            {studentAreas.map(([a, n], i) => (
              <li
                key={a}
                className="flex items-center justify-between rounded-md border border-border bg-surface/30 px-3 py-2 text-sm"
              >
                <span>
                  <span className="mr-2 font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                  {a}
                </span>
                <span className="font-mono text-xs text-primary">{n} signals</span>
              </li>
            ))}
            {studentAreas.length === 0 && (
              <li className="text-sm text-muted-foreground">No student signals yet.</li>
            )}
          </ul>
        </div>
      </section>

      {/* Civic priority scorecards */}
      <section className="mt-12">
        <SectionTitle icon={Target}>Civic priority scorecards</SectionTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {actionScorecards.map((o) => {
            const m = CATEGORY_META[o.category];
            return (
              <div
                key={`opp-${o.area}-${o.category}`}
                className="relative overflow-hidden rounded-2xl border border-border bg-glass p-5 glass"
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: m.color }}
                >
                  {m.label}
                </div>
                <div className="mt-1 text-sm">{o.area}</div>
                <div className="mt-3 font-display text-4xl font-semibold text-gradient">
                  {o.score}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Civic Priority
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {o.count} local signals - avg strength {o.avgSignal}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Underserved */}
      <section className="mt-12">
        <SectionTitle icon={Sparkles}>Most underserved zones</SectionTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {underservedZones.map((u) => (
            <div key={u.area} className="rounded-xl border border-border bg-glass p-4 glass">
              <div className="font-display text-base font-semibold">{u.area}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Issues across {u.categories} categories · {u.total} signals
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-warm to-destructive"
                  style={{ width: `${Math.min(100, u.categories * 14)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Before/After */}
      <section className="mt-12 rounded-3xl border border-primary/30 bg-gradient-to-br from-secondary/10 via-background to-primary/10 p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
          Intelligence transformation
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          Before CivicRadar vs. after
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Before
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Hundreds of WhatsApp messages, Reddit threads, Google reviews. No structure. No actor.
              No priority. Civic issues stay invisible to people who could actually fix it.
            </p>
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/[0.05] p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              After
            </div>
            <p className="mt-2 text-sm">
              {all.length} structured Civic Issue Cards - {signalGroups.length} active community
              signal groups - ranked by Civic Priority - routed to responsible stakeholders with
              suggested actions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest">{children}</h2>
    </div>
  );
}
