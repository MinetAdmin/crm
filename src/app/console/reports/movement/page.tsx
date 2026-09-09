import { BackLink, EmptyState, Notice, PrimaryButton } from "@/components/console/ui";
import { formatAmount } from "@/lib/format";
import { listSnapshots, movementBetween } from "@/lib/snapshots";
import { currentViewer } from "@/lib/viewer";
import { canAdminister } from "@/lib/visibility";
import { submitSnapshot } from "./actions";

export default async function MovementPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const [{ error }, snapshots, viewer] = await Promise.all([
    searchParams,
    listSnapshots(),
    currentViewer(),
  ]);

  const [closing, opening] = snapshots;
  const movement = opening && closing ? await movementBetween(opening.id, closing.id) : null;

  return (
    <div className="w-full max-w-3xl">
      <BackLink href="/console/reports">Reports</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">Forecast movement</h1>

      {error === "exists" && (
        <div className="mt-4">
          <Notice>A snapshot for that month already exists. A month is frozen once.</Notice>
        </div>
      )}

      {movement ? (
        <>
          <p className="mt-2 text-sm text-(--c-muted)">
            {opening.month} to {closing.month}
          </p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Line label={`Weighted at ${opening.month}`} value={movement.openingWeighted} />
            <Line label={`Weighted at ${closing.month}`} value={movement.closingWeighted} />
          </dl>

          <ul className="mt-5 grid gap-px overflow-hidden rounded-md border border-(--c-line) bg-(--c-surface)">
            {[
              ["Added", movement.buckets.added],
              ["Won", movement.buckets.won],
              ["Lost or withdrawn", movement.buckets.lost],
              ["Slipped to a later month", movement.buckets.slipped],
              ["Probability changed", movement.buckets.probabilityChange],
              ["Amount revised", movement.buckets.revised],
              ["Removed", movement.buckets.removed],
            ].map(([label, value]) => (
              <li
                key={label as string}
                className="flex items-baseline justify-between border-b border-(--c-line-soft) px-4 py-2.5 text-sm last:border-b-0"
              >
                <span>{label as string}</span>
                <span
                  className={`tabular-nums ${
                    (value as number) < 0 ? "text-(--c-brand)" : "text-(--c-good)"
                  }`}
                >
                  {(value as number) >= 0 ? "+" : ""}
                  {formatAmount(value as number)}
                </span>
              </li>
            ))}
          </ul>

          <p
            className={`mt-3 text-[13px] ${
              movement.reconciles ? "text-(--c-muted)" : "text-(--c-brand)"
            }`}
          >
            {movement.reconciles
              ? `The parts add back to the change exactly. ${movement.slippedCount} line${
                  movement.slippedCount === 1 ? "" : "s"
                } moved month.`
              : `Does not reconcile. Residual ${formatAmount(movement.residual)}, which is a defect worth reporting rather than hiding.`}
          </p>
        </>
      ) : (
        <div className="mt-5">
          <EmptyState>
            Insufficient data. Movement compares two snapshots, and there {snapshots.length === 1 ? "is 1" : `are ${snapshots.length}`}.
            It becomes meaningful after the second month end.
          </EmptyState>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Snapshots</h2>
        {snapshots.length === 0 ? (
          <div className="mt-3"><EmptyState>None taken.</EmptyState></div>
        ) : (
          <ul className="mt-3 grid gap-px overflow-hidden rounded-md border border-(--c-line) bg-(--c-surface)">
            {snapshots.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-(--c-line-soft) px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="font-medium tabular-nums">{s.month}</span>
                <span className="text-[13px] text-(--c-muted)">
                  {s.lines} lines · taken {s.takenAt.toISOString().slice(0, 10)}
                </span>
                <span className="tabular-nums">{formatAmount(s.weighted)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[13px] text-(--c-muted)">
          A snapshot is frozen once taken. The database refuses to change one.
        </p>

        {canAdminister(viewer) && (
          <form action={submitSnapshot} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="font-medium">Take a snapshot for</span>
              <input
                type="month"
                name="month"
                required
                className="mt-1 rounded-md border border-(--c-line) bg-(--c-surface) px-3 py-2 text-sm"
              />
            </label>
            <PrimaryButton>Take snapshot</PrimaryButton>
          </form>
        )}
      </section>
    </div>
  );
}

function Line({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{formatAmount(value)}</dd>
    </div>
  );
}
