import Link from "next/link";

import { BackLink, EmptyState, Notice } from "@/components/console/ui";
import { formatAmount } from "@/lib/format";
import { currentViewer } from "@/lib/viewer";
import { concentration, unownedQueue, visibleTo, workload } from "@/lib/workload";

export default async function WorkloadPage() {
  const viewer = await currentViewer();
  const [all, unowned, conc] = await Promise.all([workload(), unownedQueue(), concentration()]);
  const rows = visibleTo(viewer, all);

  const median = (pick: (r: (typeof rows)[number]) => number | null) => {
    const values = all.map(pick).filter((v): v is number => v !== null).sort((a, b) => a - b);
    if (values.length === 0) return null;
    return values[Math.floor(values.length / 2)];
  };
  const medianOpen = median((r) => r.openCount);

  return (
    <div className="w-full max-w-5xl">
      <BackLink href="/console/reports">Reports</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">Workload</h1>
      <div className="mt-3">
        <Notice tone="warn">
          For rebalancing work, not for ranking people. Individual load is visible to the person
          and their unit head.
        </Notice>
      </div>

      {conc.share !== null && (
        <p className="mt-4 text-sm">
          Largest owner holds{" "}
          <span className={`font-semibold tabular-nums ${conc.share > 50 ? "text-(--c-warn)" : ""}`}>
            {conc.share.toFixed(0)}%
          </span>{" "}
          of committed value ({conc.owner}).
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-4"><EmptyState>No workload rows are visible to you.</EmptyState></div>
      ) : (
        <div className="mt-4 rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-3 py-2.5 font-medium">Owner</th>
                <th className="px-3 py-2.5 text-right font-medium">Open</th>
                <th className="px-3 py-2.5 text-right font-medium">Weighted held</th>
                <th className="px-3 py-2.5 text-right font-medium">Effort</th>
                <th className="px-3 py-2.5 text-right font-medium">Initiatives</th>
                <th className="px-3 py-2.5 text-right font-medium">Median days</th>
                <th className="px-3 py-2.5 text-right font-medium">Advances</th>
                <th className="px-3 py-2.5 text-right font-medium">Overdue</th>
                <th className="px-3 py-2.5 text-right font-medium">Accounts</th>
                <th className="px-3 py-2.5 text-right font-medium">Blocked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ownerId} className="border-b border-(--c-line-soft) last:border-b-0">
                  <td className="px-3 py-2.5 font-medium">
                    {r.owner}
                    {r.availability < 100 && (
                      <span className="block text-[12px] text-(--c-muted)">
                        {r.availability}% available
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {r.openCount}
                    {medianOpen !== null && (
                      <span className="block text-[12px] text-(--c-muted)">med {medianOpen}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(r.weightedHeld)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.effortWeighted}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.initiativesChampioned}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-(--c-muted)">
                    {r.medianDaysInStage ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-(--c-muted)">
                    {r.advancesThisMonth}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${r.actionsOverdue > 0 ? "text-(--c-warn)" : "text-(--c-muted)"}`}>
                    {r.actionsOverdue}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-(--c-muted)">{r.accountsTouched}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-(--c-muted)">{r.blocked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 text-[12px] text-(--c-muted)">
        Count and value are shown together because either alone misleads: three pursuits worth a
        great deal is not a lighter book than eight small ones. Median days in stage and advances
        per month need history, and say little before the second month.
      </p>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Unowned queue</h2>
        {unowned.length === 0 ? (
          <div className="mt-3">
            <EmptyState>
              Nothing unowned, which is where this should stay. An owner is required at save.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-3 grid gap-px overflow-hidden rounded-md border border-(--c-line) bg-(--c-surface)">
            {unowned.map((o) => (
              <li key={o.id} className="flex items-baseline justify-between border-b border-(--c-line-soft) px-4 py-2.5 text-sm last:border-b-0">
                <Link href={`/console/opportunities/${o.id}`} className="font-medium underline-offset-2 hover:underline">
                  {o.name}
                </Link>
                <span className="tabular-nums text-(--c-warn)">{formatAmount(o.weighted)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
