import Link from "next/link";

import { EmptyState } from "@/components/console/ui";
import { forecastBases, forecastByMonth, gapByUnit, pipelineByStage } from "@/lib/forecast";
import { formatAmount } from "@/lib/format";
import { funnelBySource, hygieneExceptions, lossReasons, ownerPerformance } from "@/lib/reports";

const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(0)}%`);

export default async function ReportsPage() {
  const year = new Date().getFullYear();
  const [bases, months, stages, gaps, owners, exceptions, losses, funnel] = await Promise.all([
    forecastBases(),
    forecastByMonth(),
    pipelineByStage(),
    gapByUnit(year),
    ownerPerformance(),
    hygieneExceptions(),
    lossReasons(),
    funnelBySource(),
  ]);

  const peak = Math.max(1, ...months.map((m) => m.expected));

  return (
    <div className="grid w-full gap-8">
      <section>
        <H2>Forecast</H2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Won" value={formatAmount(bases.won)} tone="good" />
          <Stat label={`Committed, ${bases.threshold}% and above`} value={formatAmount(bases.committed)} />
          <Stat label="Weighted pipeline" value={formatAmount(bases.weighted)} />
          <Stat label="Best case" value={formatAmount(bases.bestCase)} />
        </dl>
      </section>

      <section>
        <H2>Weighted forecast by month</H2>
        {months.length === 0 ? (
          <div className="mt-3"><EmptyState>No priced work to phase yet.</EmptyState></div>
        ) : (
          <ul className="mt-3 grid gap-2">
            {months.map((m) => (
              <li key={m.month} className="grid grid-cols-[5rem_1fr_7rem] items-center gap-3 text-sm">
                <span className="tabular-nums text-(--c-muted)">{m.month}</span>
                <span className="flex h-5 items-center gap-px" aria-hidden>
                  <span
                    className="h-full rounded-l-sm bg-(--c-brand)"
                    style={{ width: `${(m.weighted / peak) * 100}%` }}
                  />
                  <span
                    className="h-full rounded-r-sm bg-(--c-wash)"
                    style={{ width: `${((m.expected - m.weighted) / peak) * 100}%` }}
                  />
                </span>
                <span className="text-right tabular-nums">{formatAmount(m.weighted)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[12px] text-(--c-muted)">
          Solid is weighted, pale is the rest of the expected amount. Phased by the effective month
          on each line.
        </p>
      </section>

      <section>
        <H2>Pipeline by stage</H2>
        <Table
          head={["Stage", "Count", "Weighted"]}
          rows={stages.map((s) => [s.stage, String(s.count), formatAmount(s.weighted)])}
          empty="Nothing open."
        />
      </section>

      <section>
        <H2>Gap to target by unit</H2>
        <Table
          head={["Unit", "Target", "Won", "Weighted", "Gap", "Coverage"]}
          rows={gaps.map((g) => [
            g.label,
            formatAmount(g.target),
            formatAmount(g.won),
            formatAmount(g.weighted),
            formatAmount(g.gap),
            g.coverage === null ? "—" : `${g.coverage.toFixed(1)}x`,
          ])}
          empty="No targets set for this year."
        />
        <p className="mt-2 text-[12px] text-(--c-muted)">
          Coverage is open pipeline over what is still to be found. Below roughly three times, the
          target is not reachable on current win rates.
        </p>
      </section>

      <section>
        <H2>Owner performance</H2>
        <Table
          head={["Owner", "Open", "Weighted", "Won", "Win rate by count", "by value"]}
          rows={owners.map((o) => [
            o.owner,
            String(o.open),
            formatAmount(o.weighted),
            formatAmount(o.won),
            pct(o.winRateByCount),
            pct(o.winRateByValue),
          ])}
          empty="No owners."
        />
        <p className="mt-2 text-[12px] text-(--c-muted)">
          Win rate is shown by count and by value together, because they disagree.
        </p>
      </section>

      <section>
        <H2>Ageing and hygiene</H2>
        {exceptions.length === 0 ? (
          <div className="mt-3"><EmptyState>Nothing needs attention.</EmptyState></div>
        ) : (
          <ul className="mt-3 grid gap-px overflow-hidden rounded-md border border-(--c-line) bg-(--c-surface)">
            {exceptions.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-(--c-line-soft) px-4 py-2.5 last:border-b-0">
                <Link href={`/console/opportunities/${e.id}`} className="text-sm font-medium underline-offset-2 hover:underline">
                  {e.name}
                </Link>
                <span className="text-[13px] text-(--c-warn)">{e.reasons.join(" · ")}</span>
                <span className="text-[13px] text-(--c-muted)">{e.owner}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <H2>Win and loss</H2>
        <Table
          head={["Loss reason", "Count", "Value"]}
          rows={losses.map((l) => [l.reason, String(l.count), formatAmount(l.value)])}
          empty="Nothing lost yet."
        />
      </section>

      <section>
        <H2>Funnel by source</H2>
        <Table
          head={["Source", "Leads", "Qualified", "Converted"]}
          rows={funnel.map((f) => [f.source, String(f.leads), String(f.qualified), String(f.converted)])}
          empty="No leads recorded."
        />
        <p className="mt-2 text-[12px] text-(--c-muted)">
          Not answerable from the workbooks at all, because they never held a lead.
        </p>
      </section>

      <p className="text-[13px] text-(--c-muted)">
        Trend views (forecast movement, stage throughput, bogged-down exceptions) need history to
        accumulate. See <Link href="/console/reports/movement" className="underline underline-offset-2">forecast movement</Link>.
      </p>
    </div>
  );
}

function H2({ children }: Readonly<{ children: React.ReactNode }>) {
  return <h2 className="text-[15px] font-semibold">{children}</h2>;
}

function Stat({ label, value, tone }: Readonly<{ label: string; value: string; tone?: "good" }>) {
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tabular-nums ${tone === "good" ? "text-(--c-good)" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function Table({
  head,
  rows,
  empty,
}: Readonly<{ head: string[]; rows: string[][]; empty: string }>) {
  if (rows.length === 0) return <div className="mt-3"><EmptyState>{empty}</EmptyState></div>;
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-2.5 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-b border-(--c-line-soft) last:border-b-0">
              {row.map((cell, i) => (
                <td
                  key={`${row[0]}-${head[i]}`}
                  className={`px-4 py-2.5 ${i > 0 ? "text-right tabular-nums" : "font-medium"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
