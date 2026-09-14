import { FormSheet } from "@/components/console/FormSheet";
import { SelectField, TextField } from "@/components/console/fields";
import { EmptyState } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/format";
import { listTargets, unitReconciliation } from "@/lib/targets";
import { currentViewer } from "@/lib/viewer";
import { canWrite } from "@/lib/visibility";
import { submitTarget } from "./actions";

export default async function TargetsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ year?: string }> }>) {
  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();
  const [targets, reconciliation, units, owners, initiatives, viewer] = await Promise.all([
    listTargets(year),
    unitReconciliation(year),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().app_user.findMany({ where: { active: true }, orderBy: { full_name: "asc" } }),
    db().strategic_initiative.findMany({ where: { archived_at: null }, orderBy: { name: "asc" } }),
    currentViewer(),
  ]);
  const maySet = canWrite(viewer, { ownerId: viewer.id, unitId: null });

  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1 text-sm text-(--c-muted)">
          Targets for {year}. Unit targets have to add up to the company target.
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Company target" value={formatAmount(reconciliation.companyTarget)} />
        <Stat label="Allocated to units" value={formatAmount(reconciliation.allocated)} />
        <Stat
          label={reconciliation.reconciled ? "Reconciled" : "Unallocated remainder"}
          value={formatAmount(reconciliation.remainder)}
          tone={reconciliation.reconciled ? "good" : "warn"}
        />
      </dl>

      {targets.length === 0 ? (
        <div className="mt-4"><EmptyState>No targets set for {year}.</EmptyState></div>
      ) : (
        <div className="mt-4 rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Level</th>
                <th className="px-4 py-2.5 font-medium">Applies to</th>
                <th className="px-4 py-2.5 font-medium">Phased</th>
                <th className="px-4 py-2.5 text-right font-medium">Version</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id} className="border-b border-(--c-line-soft) last:border-b-0">
                  <td className="px-4 py-2.5 text-(--c-muted)">{t.level}</td>
                  <td className="px-4 py-2.5 font-medium">{t.label}</td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{t.phased ? "Monthly" : "Annual only"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-(--c-muted)">v{t.version}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatAmount(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {maySet && (
        <div className="mt-6">
          <FormSheet
            trigger={<Button size="sm">Set a target</Button>}
            title={`Set a target for ${year}`}
            description="An even phasing is a starting point. The real monthly shape is entered once the finance phasing is confirmed."
            action={submitTarget}
            submitLabel="Save target"
          >
            <input type="hidden" name="year" value={year} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Level"
                name="level"
                emptyLabel="Company"
                options={[
                  { value: "company", label: "Company" },
                  { value: "unit", label: "Unit" },
                  { value: "owner", label: "Owner" },
                  { value: "initiative", label: "Initiative" },
                ]}
              />
              <TextField label="Amount (UGX)" name="amount" inputMode="numeric" required />
            </div>
            <SelectField
              label="Unit, for a unit target"
              name="unitId"
              options={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
            />
            <SelectField
              label="Owner, for an owner target"
              name="ownerId"
              options={owners.map((o) => ({ value: o.id.toString(), label: o.full_name }))}
            />
            <SelectField
              label="Initiative, for an initiative target"
              name="initiativeId"
              options={initiatives.map((i) => ({ value: i.id.toString(), label: i.name }))}
            />
            <SelectField
              label="Phasing"
              name="phase"
              emptyLabel="Annual only"
              options={[{ value: "even", label: "Even across twelve months" }]}
            />
          </FormSheet>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: string; tone?: "good" | "warn" }>) {
  const colour = tone === "good" ? "text-(--c-good)" : tone === "warn" ? "text-(--c-warn)" : "";
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tabular-nums ${colour}`}>{value}</dd>
    </div>
  );
}
