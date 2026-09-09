import Link from "next/link";

import { EmptyState, PrimaryLink } from "@/components/console/ui";
import { formatAmount } from "@/lib/format";
import { BASIS_LABEL, daysUntil, totalsByBasis, type ValueBasis } from "@/lib/tender-rules";
import { listTenders } from "@/lib/tenders";

export default async function TendersPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ type?: string }> }>) {
  const { type } = await searchParams;
  const tenders = await listTenders(type);
  const now = new Date();
  const totals = totalsByBasis(
    tenders.map((t) => ({ basis: t.value_basis as ValueBasis, amount: Number(t.recorded_value) })),
  );

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex min-w-0 flex-1 flex-wrap gap-1" aria-label="Filter by type">
          <Filter label="All" href="/console/tenders" active={!type} />
          <Filter
            label="Prequalifications"
            href="/console/tenders?type=prequalification"
            active={type === "prequalification"}
          />
          <Filter label="Tenders" href="/console/tenders?type=tender" active={type === "tender"} />
        </nav>
        <PrimaryLink href="/console/tenders/new">New tender</PrimaryLink>
      </div>

      {totals.length > 0 && (
        <dl className="mt-4 flex flex-wrap gap-3">
          {totals.map((total) => (
            <div
              key={total.basis}
              className="rounded-md border border-(--c-line) bg-(--c-surface) px-4 py-2.5"
            >
              <dt className="text-[12px] text-(--c-muted)">
                {BASIS_LABEL[total.basis]} · {total.count}
              </dt>
              <dd className="text-sm font-semibold tabular-nums">{formatAmount(total.total)}</dd>
            </div>
          ))}
          <p className="self-center text-[12px] text-(--c-muted)">
            Totalled per basis. Values on different bases are never added together.
          </p>
        </dl>
      )}

      {tenders.length === 0 ? (
        <div className="mt-4">
          <EmptyState>No tenders recorded.</EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Value</th>
                <th className="px-4 py-2.5 font-medium">Basis</th>
                <th className="px-4 py-2.5 text-right font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((t) => {
                const days = t.submission_deadline ? daysUntil(t.submission_deadline, now) : null;
                const urgent = days !== null && days >= 0 && days <= 14;
                return (
                  <tr key={t.id.toString()} className="border-b border-(--c-line-soft) last:border-b-0">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/console/tenders/${t.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {t.title}
                      </Link>
                      <span className="block text-[13px] text-(--c-muted)">{t.issuing_body}</span>
                    </td>
                    <td className="px-4 py-2.5 text-(--c-muted)">
                      {t.tender_type === "prequalification" ? "Prequal" : "Tender"}
                    </td>
                    <td className="px-4 py-2.5 text-(--c-muted)">
                      {t.status.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatAmount(Number(t.recorded_value))}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-(--c-muted)">
                      {BASIS_LABEL[t.value_basis as ValueBasis]}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums ${
                        urgent ? "text-(--c-warn)" : "text-(--c-muted)"
                      }`}
                    >
                      {days === null ? "—" : `${days}d`}
                    </td>
                  </tr>
                );
              })}
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
