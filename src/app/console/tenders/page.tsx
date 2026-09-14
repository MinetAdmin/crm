import Link from "next/link";

import { FormSheet } from "@/components/console/FormSheet";
import { SelectField, TextField } from "@/components/console/fields";
import { EmptyState } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/format";
import { BASIS_LABEL, daysUntil, totalsByBasis, type ValueBasis } from "@/lib/tender-rules";
import { listTenders } from "@/lib/tenders";
import { submitTender } from "./actions";

export default async function TendersPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ type?: string }> }>) {
  const { type } = await searchParams;
  const [tenders, units, sectors, prequals] = await Promise.all([
    listTenders(type),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().tender.findMany({
      where: { archived_at: null, tender_type: "prequalification" },
      orderBy: { title: "asc" },
    }),
  ]);
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
        <FormSheet
          trigger={<Button size="sm">New tender</Button>}
          title="New tender"
          action={submitTender}
          submitLabel="Create tender"
        >
          <TextField label="Title or reference" name="title" required />
          <TextField label="Issuing body" name="issuingBody" required />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Type"
              name="tenderType"
              emptyLabel="Tender"
              options={[
                { value: "tender", label: "Tender" },
                { value: "prequalification", label: "Prequalification" },
              ]}
            />
            <SelectField
              label="Parent prequalification"
              name="parentId"
              options={prequals.map((p) => ({ value: p.id.toString(), label: p.title }))}
            />
            <SelectField
              label="Unit"
              name="unitId"
              emptyLabel="Choose a unit"
              options={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
            />
            <SelectField
              label="Sector"
              name="sectorId"
              emptyLabel="Choose a sector"
              options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
            />
            <TextField label="Recorded value" name="recordedValue" inputMode="numeric" required />
            <SelectField
              label="Value basis"
              name="valueBasis"
              emptyLabel="Choose a basis"
              options={Object.entries(BASIS_LABEL).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <TextField label="Submission deadline" name="submissionDeadline" type="date" />
        </FormSheet>
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
        <div className="mt-4 rounded-md border border-(--c-line) bg-(--c-surface)">
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
