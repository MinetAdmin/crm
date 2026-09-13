import Link from "next/link";

import { FlowStrip } from "@/components/console/FlowStrip";
import { FormSheet } from "@/components/console/FormSheet";
import { CheckboxField, SelectField, TextField } from "@/components/console/fields";
import { EmptyState } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { funnelCounts } from "@/lib/funnel";
import { leadAgeDays } from "@/lib/lead-rules";
import { listLeads } from "@/lib/leads";
import { submitLead } from "./actions";

const STATUSES = ["new", "contacted", "qualifying", "qualified", "disqualified", "converted"];

export default async function LeadsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ status?: string; new?: string }> }>) {
  const { status, new: openNew } = await searchParams;
  const [counts, leads, units, sectors, owners, sources, products, accounts] = await Promise.all([
    funnelCounts(),
    listLeads(status),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().app_user.findMany({ where: { active: true }, orderBy: { full_name: "asc" } }),
    db().ref_value.findMany({
      where: { active: true, ref_list: { code: "lead_source" } },
      orderBy: { sort_order: "asc" },
    }),
    db().product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db().account.findMany({ where: { archived_at: null }, orderBy: { name: "asc" } }),
  ]);
  const now = new Date();

  return (
    <div className="w-full">
      <FlowStrip counts={counts} active="leads" />
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex min-w-0 flex-1 flex-wrap gap-1" aria-label="Filter by status">
          <FilterLink label="All" active={!status} href="/console/leads" />
          {STATUSES.map((value) => (
            <FilterLink
              key={value}
              label={value}
              active={status === value}
              href={`/console/leads?status=${value}`}
            />
          ))}
        </nav>
        <span className="text-sm tabular-nums text-(--c-muted)">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </span>
        <FormSheet
          trigger={<Button size="sm">New lead</Button>}
          title="New lead"
          action={submitLead}
          submitLabel="Create lead"
          defaultOpen={openNew === "1"}
          wide
        >
          <TextField label="Company" name="companyName" required />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Source"
              name="sourceId"
              emptyLabel="Choose a source"
              options={sources.map((s) => ({ value: s.id.toString(), label: s.label }))}
            />
            <SelectField
              label="Owner"
              name="ownerId"
              emptyLabel="Choose an owner"
              options={owners.map((o) => ({ value: o.id.toString(), label: o.full_name }))}
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
              options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
            />
          </div>
          <SelectField
            label="Existing account"
            name="matchedAccountId"
            emptyLabel="Not matched yet"
            options={accounts.map((a) => ({ value: a.id.toString(), label: a.name }))}
          />
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-medium">Products of interest</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {products.map((product) => (
                <CheckboxField
                  key={product.id.toString()}
                  label={product.name}
                  name="productIds"
                  value={product.id.toString()}
                />
              ))}
            </div>
          </fieldset>
          <TextField label="Contact name" name="contactName" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Email" name="contactEmail" type="email" />
            <TextField label="Phone" name="contactPhone" />
          </div>
          <TextField label="Estimated value (UGX)" name="estimatedValue" inputMode="numeric" />
        </FormSheet>
      </div>

      {leads.length === 0 ? (
        <div className="mt-4">
          <EmptyState>
            {status ? `No ${status} leads.` : "No leads yet. Unassigned leads are the ones that die."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 text-right font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const age = leadAgeDays(lead.createdAt, now);
                return (
                  <tr key={lead.id} className="border-b border-(--c-line-soft) last:border-b-0">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/console/leads/${lead.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {lead.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.status}</td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.source}</td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.owner}</td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.unit}</td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums ${
                        age >= 30 ? "text-(--c-warn)" : "text-(--c-muted)"
                      }`}
                    >
                      {age}d
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

function FilterLink({
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
