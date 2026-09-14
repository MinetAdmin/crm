import { Plus } from "lucide-react";
import Link from "next/link";

import { CountChip, FlowStrip } from "@/components/console/FlowStrip";
import { FormSheet } from "@/components/console/FormSheet";
import { CheckboxField, FormSection, SelectField, TextField } from "@/components/console/fields";
import { EmptyState, leadStatusTone, pillPrimaryClass, TagPill } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { funnelCounts } from "@/lib/funnel";
import { leadAgeDays } from "@/lib/lead-rules";
import { listLeads } from "@/lib/leads";
import { submitLead } from "./actions";

const STATUSES = ["new", "contacted", "qualifying", "qualified", "disqualified", "converted"];
const STALE_DAYS = 30;

export default async function LeadsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ status?: string; new?: string }> }>) {
  const { status, new: openNew } = await searchParams;
  const [counts, leads, statusCounts, units, sectors, owners, sources, products, accounts] =
    await Promise.all([
      funnelCounts(),
      listLeads(status),
      db().lead.groupBy({
        by: ["status"],
        where: { archived_at: null },
        _count: { _all: true },
      }),
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
  const countOf = new Map(statusCounts.map((row) => [row.status as string, row._count._all]));
  const total = statusCounts.reduce((sum, row) => sum + row._count._all, 0);
  const stale = leads.filter(
    (lead) =>
      leadAgeDays(lead.createdAt, now) >= STALE_DAYS &&
      !["disqualified", "converted"].includes(lead.status),
  ).length;

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col md:-mx-6">
      <div className="shrink-0 px-4 pt-4 md:px-6">
        <FlowStrip counts={counts} active="leads" />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-4 md:px-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-1" aria-label="Filter by status">
          <StatusPill label="All" count={total} active={!status} href="/console/leads" />
          {STATUSES.map((value) => (
            <StatusPill
              key={value}
              label={value}
              count={countOf.get(value) ?? 0}
              active={status === value}
              href={`/console/leads?status=${value}`}
            />
          ))}
        </nav>
        <NewLeadSheet
          defaultOpen={openNew === "1"}
          units={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
          sectors={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
          owners={owners.map((o) => ({ value: o.id.toString(), label: o.full_name }))}
          sources={sources.map((s) => ({ value: s.id.toString(), label: s.label }))}
          products={products.map((p) => ({ value: p.id.toString(), label: p.name }))}
          accounts={accounts.map((a) => ({ value: a.id.toString(), label: a.name }))}
        />
      </div>

      {leads.length === 0 ? (
        <div className="grid flex-1 px-4 pb-4 md:px-6">
          <EmptyState className="h-full">
            {status
              ? `No ${status} leads.`
              : "No leads yet. Unassigned leads are the ones that die."}
          </EmptyState>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto border-y border-border">
            <Table className="text-sm leading-none [&_td]:h-[42px] [&_td]:px-3 [&_td]:py-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:h-[38px] [&_th]:border-b [&_th]:border-border [&_th]:bg-background [&_th]:px-3">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <Head>Company</Head>
                  <Head>Status</Head>
                  <Head>Source</Head>
                  <Head>Owner</Head>
                  <Head>Unit</Head>
                  <Head align="right">Age</Head>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const age = leadAgeDays(lead.createdAt, now);
                  return (
                    <TableRow
                      key={lead.id}
                      className="transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60"
                    >
                      <TableCell>
                        <Link
                          href={`/console/leads/${lead.id}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {lead.companyName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <TagPill tone={leadStatusTone(lead.status)}>{lead.status}</TagPill>
                      </TableCell>
                      <TableCell className="text-(--c-muted)">{lead.source}</TableCell>
                      <TableCell className="text-(--c-muted)">{lead.owner}</TableCell>
                      <TableCell>
                        {lead.unit ? <TagPill>{lead.unit}</TagPill> : null}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${
                          age >= STALE_DAYS ? "text-(--c-warn)" : "text-(--c-muted)"
                        }`}
                      >
                        {age}d
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-px border-b border-border bg-background p-px text-xs sm:grid-cols-4">
            <SummaryCell value={String(leads.length)} label="leads in view" />
            <SummaryCell value={String(countOf.get("new") ?? 0)} label="new" />
            <SummaryCell value={String(countOf.get("qualified") ?? 0)} label="qualified" />
            <SummaryCell value={String(stale)} label={`stale, ${STALE_DAYS} days or more`} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({
  label,
  count,
  href,
  active,
}: Readonly<{ label: string; count: number; href: string; active: boolean }>) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-xs transition-[background-color,color,box-shadow] duration-150 ease-(--ease-out-strong) ${
        active
          ? "bg-secondary font-medium text-foreground shadow-(--pill-shadow)"
          : "text-(--subtle) hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
      <CountChip value={count} />
    </Link>
  );
}

const HEAD_ALIGN = { right: "text-right" } as const;

function Head({
  align,
  children,
}: Readonly<{ align?: keyof typeof HEAD_ALIGN; children: React.ReactNode }>) {
  return (
    <TableHead
      className={`text-xs font-normal whitespace-nowrap text-(--subtle) ${
        align ? HEAD_ALIGN[align] : ""
      }`}
    >
      {children}
    </TableHead>
  );
}

function SummaryCell({ value, label }: Readonly<{ value: string; label: string }>) {
  return (
    <div className="flex items-center gap-2 p-3 outline-1 outline-border">
      <span className="text-foreground tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

type Option = Readonly<{ value: string; label: string }>;

function NewLeadSheet({
  defaultOpen,
  units,
  sectors,
  owners,
  sources,
  products,
  accounts,
}: Readonly<{
  defaultOpen?: boolean;
  units: ReadonlyArray<Option>;
  sectors: ReadonlyArray<Option>;
  owners: ReadonlyArray<Option>;
  sources: ReadonlyArray<Option>;
  products: ReadonlyArray<Option>;
  accounts: ReadonlyArray<Option>;
}>) {
  return (
    <FormSheet
      trigger={
        <Button size="sm" className={pillPrimaryClass}>
          <Plus className="size-3" aria-hidden />
          New lead
        </Button>
      }
      title="New lead"
      description="Capture the conversation. Qualification needs an account and a decision maker."
      action={submitLead}
      submitLabel="Create lead"
      defaultOpen={defaultOpen}
      wide
    >
      <FormSection title="Company">
        <TextField label="Company" name="companyName" required />
        <SelectField
          label="Existing account"
          name="matchedAccountId"
          emptyLabel="Not matched yet"
          options={accounts}
        />
      </FormSection>
      <FormSection title="Routing">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Source"
            name="sourceId"
            emptyLabel="Choose a source"
            options={sources}
          />
          <SelectField
            label="Owner"
            name="ownerId"
            emptyLabel="Choose an owner"
            options={owners}
          />
          <SelectField label="Unit" name="unitId" emptyLabel="Choose a unit" options={units} />
          <SelectField label="Sector" name="sectorId" options={sectors} />
        </div>
      </FormSection>
      <FormSection title="Products of interest">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {products.map((product) => (
            <CheckboxField
              key={product.value}
              label={product.label}
              name="productIds"
              value={product.value}
            />
          ))}
        </div>
      </FormSection>
      <FormSection title="Contact">
        <TextField label="Contact name" name="contactName" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Email" name="contactEmail" type="email" />
          <TextField label="Phone" name="contactPhone" />
        </div>
      </FormSection>
      <FormSection title="Value">
        <TextField label="Estimated value (UGX)" name="estimatedValue" inputMode="numeric" />
      </FormSection>
    </FormSheet>
  );
}
