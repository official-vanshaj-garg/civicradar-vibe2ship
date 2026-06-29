import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Radar, Map, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Â· CivicRadar" },
      {
        name: "description",
        content:
          "CivicRadar is a civic intelligence layer for hyperlocal India, starting with Bengaluru.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">About</div>
      <h1 className="mt-1 font-display text-4xl font-semibold leading-tight sm:text-5xl">
        We're building the <span className="text-gradient">civic intelligence graph</span> for
        hyperlocal India.
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        CivicRadar turns scattered local frustrations into structured, privacy-safe Civic Issue
        Cards - and surfaces them on a map and dashboard so the right actors can respond before the
        gap turns into a crisis.
      </p>

      <Section title="What CivicRadar is" icon={Radar}>
        <p>
          An intelligence layer between residents, RWAs, NGOs, campus teams, and civic stakeholders.
          Every report becomes a typed Civic Issue Card with category, urgency, signal strength,
          confidence, and a recommended actor.
        </p>
      </Section>

      <Section title="Why this is civic intelligence" icon={Sparkles}>
        <p>
          Traditional local feedback stays scattered and hard to act on. CivicRadar does the
          opposite: it converts unmet needs into{" "}
          <span className="text-foreground">civic intelligence</span> - ranked, geo-tagged,
          clustered, and routed. Residents see visibility. Community groups see patterns. Civic
          stakeholders see priority.
        </p>
      </Section>

      <Section title="How it works" icon={Map}>
        <ol className="space-y-2 text-muted-foreground">
          <li>
            <span className="text-primary font-mono">01</span> &nbsp;Anyone reports a missing
            service in plain language. No login. No PII.
          </li>
          <li>
            <span className="text-primary font-mono">02</span> &nbsp;The intelligence layer
            structures the report into a typed Civic Issue Card.
          </li>
          <li>
            <span className="text-primary font-mono">03</span> &nbsp;Cards stream into the live
            feed, plot on the map, cluster by area + category.
          </li>
          <li>
            <span className="text-primary font-mono">04</span> &nbsp;The Insights page surfaces
            action scores and recommended actions per cluster.
          </li>
        </ol>
      </Section>

      <Section title="Privacy-first design" icon={ShieldCheck}>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Anonymous reporting - only an opaque session id is stored locally.</li>
          <li>Coordinates rounded to ~110m before storage.</li>
          <li>Phone numbers, emails and long ID-like numbers are auto-redacted from raw text.</li>
          <li>No tracking pixels, no third-party analytics in the MVP.</li>
        </ul>
      </Section>

      <Section title="Model-ready AI architecture" icon={Sparkles}>
        <p>
          Today, the intelligence layer runs a deterministic demo classifier so the experience is
          fast and reproducible. The contract -{" "}
          <span className="font-mono text-primary">classify(input) -&gt; ClassifyOutput</span> - is
          the only swap point. When a production model is wired into the adapter, the UI, schema,
          dashboard, and map don't move. Future model integration will run server-side and stream
          sharper categorisation, urgency calibration, and cluster naming.
        </p>
      </Section>

      <Section title="Future civic vision" icon={Radar}>
        <p>
          Future civic vision: every campus, ward, and neighborhood can maintain a live issue
          intelligence layer that helps communities surface problems earlier, prioritize limited
          resources, and coordinate action transparently.
        </p>
      </Section>

      <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/[0.05] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Pilot CivicRadar
            </div>
            <div className="mt-1 font-display text-xl">Bring it to your area.</div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/report"
              className="rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Report Issue
            </Link>
            <Link
              to="/dashboard"
              className="rounded-md border border-border-strong bg-glass px-4 py-2 text-sm glass"
            >
              See dashboard <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
