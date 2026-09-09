import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink, Notice, PrimaryButton, SelectField } from "@/components/console/ui";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/format";
import { getOpportunity, opportunityTotals } from "@/lib/opportunities";
import { submitOpportunityLink } from "../../initiatives/actions";
import { submitClosure, submitScheduleLine, submitStageChange } from "../actions";

const FIELD = "mt-1 w-full rounded-md border border-(--c-line) bg-(--c-surface) px-3 py-2 text-sm";

export default async function OpportunityPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ blocked?: string }>;
}>) {
  const [{ id }, { blocked }] = await Promise.all([params, searchParams]);
  const opportunity = await getOpportunity(id);
  if (!opportunity) notFound();

  const [totals, stages, products, reasons, initiatives] = await Promise.all([
    opportunityTotals(id),
    db().pipeline_stage.findMany({ where: { active: true }, orderBy: { sort_order: "asc" } }),
    db().product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db().ref_value.findMany({
      where: { active: true, ref_list: { code: { in: ["loss_reason", "hold_reason"] } } },
      orderBy: { sort_order: "asc" },
    }),
    db().strategic_initiative.findMany({ where: { archived_at: null }, orderBy: { name: "asc" } }),
  ]);
  const open = opportunity.outcome === "open";

  return (
    <div className="w-full max-w-4xl">
      <BackLink href="/console/opportunities">Opportunities</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">{opportunity.name}</h1>
      <p className="mt-1 text-sm text-(--c-muted)">
        <Link href={`/console/accounts/${opportunity.account.id}`} className="underline underline-offset-2">
          {opportunity.account.name}
        </Link>{" "}
        · {opportunity.pipeline_stage.name} · {Number(opportunity.probability)}% ·{" "}
        {opportunity.app_user_opportunity_owner_idToapp_user.full_name} ·{" "}
        {opportunity.outcome.replace("_", " ")}
      </p>

      {blocked && (
        <div className="mt-4">
          <Notice>
            Refused by {blocked}. A stage past Quotation prepared needs a schedule line, a
            probability away from the stage default needs a note, and a lost or held deal needs a
            reason.
          </Notice>
        </div>
      )}

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <Figure label="Expected" value={formatAmount(totals.expected)} />
        <Figure label="Weighted, calculated" value={formatAmount(totals.weighted)} highlight />
        <Figure
          label="Expected close"
          value={opportunity.expected_close_date.toISOString().slice(0, 10)}
        />
      </dl>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Revenue schedule</h2>
        {opportunity.revenue_schedule_line.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-(--c-line) p-5 text-center text-sm text-(--c-muted)">
            No lines yet. The money lives here, and the stage cannot pass Quotation prepared
            without one.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                  <th className="px-4 py-2.5 font-medium">Month</th>
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 text-right font-medium">Expected</th>
                </tr>
              </thead>
              <tbody>
                {opportunity.revenue_schedule_line.map((line) => (
                  <tr key={line.id.toString()} className="border-b border-(--c-line-soft) last:border-b-0">
                    <td className="px-4 py-2.5 tabular-nums">
                      {line.effective_month.toISOString().slice(0, 7)}
                    </td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{line.product.name}</td>
                    <td className="px-4 py-2.5 text-(--c-muted)">
                      {line.revenue_type.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatAmount(Number(line.expected_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {open && (
          <form
            action={submitScheduleLine}
            className="mt-3 grid gap-3 rounded-md border border-(--c-line) bg-(--c-surface) p-4 sm:grid-cols-5 sm:items-end"
          >
            <input type="hidden" name="opportunityId" value={opportunity.id.toString()} />
            <label className="block text-sm">
              <span className="font-medium">Month</span>
              <input type="month" name="effectiveMonth" required className={FIELD} />
            </label>
            <SelectField
              label="Product"
              name="productId"
              emptyLabel="Choose"
              options={products.map((p) => ({ value: p.id.toString(), label: p.name }))}
            />
            <SelectField
              label="Type"
              name="revenueType"
              emptyLabel="New business"
              options={[
                { value: "new_business", label: "New business" },
                { value: "renewal", label: "Renewal" },
                { value: "cross_sell", label: "Cross-sell" },
                { value: "upsell", label: "Upsell" },
              ]}
            />
            <label className="block text-sm">
              <span className="font-medium">Expected</span>
              <input name="expectedAmount" required inputMode="numeric" className={FIELD} />
            </label>
            <PrimaryButton>Add line</PrimaryButton>
          </form>
        )}
      </section>

      {open && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <form
            action={submitStageChange}
            className="grid gap-3 rounded-md border border-(--c-line) bg-(--c-surface) p-4"
          >
            <input type="hidden" name="opportunityId" value={opportunity.id.toString()} />
            <h2 className="text-[15px] font-semibold">Move stage</h2>
            <p className="text-[13px] text-(--c-muted)">
              {opportunity.pipeline_stage.exit_criterion}
            </p>
            <SelectField
              label="To stage"
              name="toStageId"
              emptyLabel="Choose a stage"
              options={stages.map((s) => ({
                value: s.id.toString(),
                label: `${s.name} · ${Number(s.default_probability)}%`,
              }))}
            />
            <label className="block text-sm">
              <span className="font-medium">Probability override</span>
              <input name="probability" inputMode="numeric" placeholder="Stage default" className={FIELD} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Note, if overriding</span>
              <input name="note" className={FIELD} />
            </label>
            <div>
              <PrimaryButton>Move stage</PrimaryButton>
            </div>
          </form>

          <form
            action={submitClosure}
            className="grid gap-3 rounded-md border border-(--c-line) bg-(--c-surface) p-4"
          >
            <input type="hidden" name="opportunityId" value={opportunity.id.toString()} />
            <h2 className="text-[15px] font-semibold">Close</h2>
            <p className="text-[13px] text-(--c-muted)">
              The stage is kept, so it stays visible where a deal was lost.
            </p>
            <SelectField
              label="Outcome"
              name="outcome"
              emptyLabel="Choose an outcome"
              options={[
                { value: "won", label: "Won" },
                { value: "lost", label: "Lost" },
                { value: "on_hold", label: "On hold" },
                { value: "withdrawn", label: "Withdrawn" },
              ]}
            />
            <SelectField
              label="Reason, for lost or on hold"
              name="reasonId"
              options={reasons.map((r) => ({ value: r.id.toString(), label: r.label }))}
            />
            <div>
              <PrimaryButton>Close</PrimaryButton>
            </div>
          </form>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Strategic initiative</h2>
        <form action={submitOpportunityLink} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="opportunityId" value={opportunity.id.toString()} />
          <div className="min-w-64 flex-1">
            <SelectField
              label="Contributes to"
              name="initiativeId"
              defaultValue={opportunity.initiative_id?.toString()}
              emptyLabel="Not linked"
              options={initiatives.map((i) => ({ value: i.id.toString(), label: i.name }))}
            />
          </div>
          <PrimaryButton>Save link</PrimaryButton>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Stage history</h2>
        <ol className="mt-3 grid gap-2">
          {opportunity.stage_history.map((entry) => (
            <li key={entry.id.toString()} className="flex flex-wrap gap-x-3 text-sm">
              <span className="tabular-nums text-(--c-muted)">
                {entry.changed_at.toISOString().slice(0, 10)}
              </span>
              <span>
                {entry.pipeline_stage_stage_history_from_stage_idTopipeline_stage?.name ?? "Created"}{" "}
                → {entry.pipeline_stage_stage_history_to_stage_idTopipeline_stage.name}
              </span>
              <span className="text-(--c-muted)">{entry.app_user.full_name}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Figure({
  label,
  value,
  highlight,
}: Readonly<{ label: string; value: string; highlight?: boolean }>) {
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd
        className={`mt-1 text-lg font-semibold tabular-nums ${highlight ? "text-(--c-good)" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
