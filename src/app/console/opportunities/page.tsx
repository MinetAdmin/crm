import Link from "next/link";

import { FlowStrip } from "@/components/console/FlowStrip";
import { EmptyState } from "@/components/console/ui";
import { formatAmount } from "@/lib/format";
import { funnelCounts } from "@/lib/funnel";
import { listOpportunities } from "@/lib/opportunities";

const OUTCOMES = ["open", "won", "lost", "on_hold", "withdrawn"];

export default async function OpportunitiesPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ outcome?: string }> }>) {
  const { outcome } = await searchParams;
  const [opportunities, counts] = await Promise.all([listOpportunities(outcome), funnelCounts()]);
  const weighted = opportunities.reduce((sum, o) => sum + o.weighted, 0);

  return (
    <div className="w-full">
      <FlowStrip counts={counts} active="pipeline" />
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex min-w-0 flex-1 flex-wrap gap-1" aria-label="Filter by outcome">
          <Filter label="All" href="/console/opportunities" active={!outcome} />
          {OUTCOMES.map((value) => (
            <Filter
              key={value}
              label={value.replace("_", " ")}
              href={`/console/opportunities?outcome=${value}`}
              active={outcome === value}
            />
          ))}
        </nav>
        <span className="text-sm tabular-nums text-(--c-muted)">
          {opportunities.length} · weighted {formatAmount(weighted)}
        </span>
      </div>

      {opportunities.length === 0 ? (
        <div className="mt-4">
          <EmptyState>No opportunities here. They arrive by converting a lead.</EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 text-right font-medium">Prob.</th>
                <th className="px-4 py-2.5 text-right font-medium">Weighted</th>
                <th className="px-4 py-2.5 text-right font-medium">Close</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id} className="border-b border-(--c-line-soft) last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/console/opportunities/${o.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {o.name}
                    </Link>
                    <span className="block text-[13px] text-(--c-muted)">{o.account}</span>
                  </td>
                  <td className="px-4 py-2.5 text-(--c-muted)">
                    {o.stage}
                    {o.outcome !== "open" && (
                      <span className="block text-[13px]">{o.outcome.replace("_", " ")}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{o.owner}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-(--c-muted)">
                    {o.probability}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    {formatAmount(o.weighted)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-(--c-muted)">
                    {o.expectedCloseDate.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Filter({
  label,
  href,
  active,
}: Readonly<{ label: string; href: string; active: boolean }>) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2.5 py-1.5 text-sm ${
        active ? "bg-(--c-wash) font-medium" : "text-(--c-muted) hover:bg-(--c-wash)"
      }`}
    >
      {label}
    </Link>
  );
}
