import Link from "next/link";

import { EmptyState, PrimaryLink } from "@/components/console/ui";
import { formatAmount } from "@/lib/format";
import { listInitiatives } from "@/lib/initiatives";

export default async function InitiativesPage() {
  const initiatives = await listInitiatives();

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1 text-sm text-(--c-muted)">
          Target is entered once. Delivered, expected and the gap are rolled up from the pursuits
          linked to each initiative.
        </span>
        <PrimaryLink href="/console/initiatives/new">New initiative</PrimaryLink>
      </div>

      {initiatives.length === 0 ? (
        <div className="mt-4">
          <EmptyState>No initiatives yet.</EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Initiative</th>
                <th className="px-4 py-2.5 font-medium">Champion</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Target</th>
                <th className="px-4 py-2.5 text-right font-medium">Delivered</th>
                <th className="px-4 py-2.5 text-right font-medium">Weighted</th>
                <th className="px-4 py-2.5 text-right font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {initiatives.map((i) => (
                <tr key={i.id} className="border-b border-(--c-line-soft) last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/console/initiatives/${i.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {i.name}
                    </Link>
                    <span className="block text-[13px] text-(--c-muted)">
                      {i.unit} · {i.sector}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{i.champion}</td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{i.status}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatAmount(i.target)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-(--c-good)">
                    {formatAmount(i.delivered)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-(--c-muted)">
                    {formatAmount(i.weightedExpected)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums ${
                      i.gap > 0 ? "text-(--c-brand)" : "text-(--c-good)"
                    }`}
                  >
                    {formatAmount(i.gap)}
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
