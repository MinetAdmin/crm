import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink, EmptyState, PrimaryButton } from "@/components/console/ui";
import { formatAmount } from "@/lib/format";
import { getInitiative, initiativeRollup } from "@/lib/initiatives";
import { submitNote } from "../actions";

export default async function InitiativePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const [initiative, rollup] = await Promise.all([getInitiative(id), initiativeRollup(id)]);
  if (!initiative) notFound();

  return (
    <div className="w-full max-w-4xl">
      <BackLink href="/console/initiatives">Initiatives</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">{initiative.name}</h1>
      <p className="mt-1 text-sm text-(--c-muted)">
        {initiative.unit.code} · {initiative.sector.code} · {initiative.app_user.full_name} ·{" "}
        {initiative.ref_value.label} · {initiative.target_year}
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-4">
        <Figure label="Target, entered" value={formatAmount(rollup.target)} />
        <Figure label="Delivered" value={formatAmount(rollup.delivered)} tone="good" />
        <Figure label="Weighted expected" value={formatAmount(rollup.weightedExpected)} />
        <Figure
          label="Gap to target"
          value={formatAmount(rollup.gap)}
          tone={rollup.gap > 0 ? "brand" : "good"}
        />
      </dl>
      <p className="mt-2 text-[13px] text-(--c-muted)">
        Everything except the target is derived from the linked pursuits.
      </p>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Linked pursuits</h2>
        {initiative.opportunity.length === 0 ? (
          <div className="mt-3">
            <EmptyState>
              Nothing linked yet. Link a pursuit from its own screen and it counts here.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-3 grid gap-px overflow-hidden rounded-md border border-(--c-line) bg-(--c-surface)">
            {initiative.opportunity.map((o) => (
              <li
                key={o.id.toString()}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-(--c-line-soft) px-4 py-3 last:border-b-0"
              >
                <Link
                  href={`/console/opportunities/${o.id}`}
                  className="text-sm font-medium underline-offset-2 hover:underline"
                >
                  {o.name}
                </Link>
                <span className="text-[13px] text-(--c-muted)">
                  {o.account.name} · {o.pipeline_stage.name} · {Number(o.probability)}% ·{" "}
                  {o.outcome.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Evidence</h2>
        <form action={submitNote} className="mt-3 grid gap-3">
          <input type="hidden" name="initiativeId" value={initiative.id.toString()} />
          <label className="block text-sm">
            <span className="sr-only">Note</span>
            <textarea
              name="body"
              required
              rows={2}
              placeholder="What happened, and what it means for the target"
              className="mt-1 w-full rounded-md border border-(--c-line) bg-(--c-surface) px-3 py-2 text-sm"
            />
          </label>
          <div>
            <PrimaryButton>Add note</PrimaryButton>
          </div>
        </form>

        {initiative.initiative_note.length > 0 && (
          <ol className="mt-4 grid gap-3">
            {initiative.initiative_note.map((note) => (
              <li key={note.id.toString()} className="border-l-2 border-(--c-line) pl-3">
                <p className="text-sm">{note.body}</p>
                <p className="mt-0.5 text-[12px] text-(--c-muted)">
                  {note.app_user.full_name} · {note.created_at.toISOString().slice(0, 10)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Figure({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: string; tone?: "good" | "brand" }>) {
  const colour = tone === "good" ? "text-(--c-good)" : tone === "brand" ? "text-(--c-brand)" : "";
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tabular-nums ${colour}`}>{value}</dd>
    </div>
  );
}
