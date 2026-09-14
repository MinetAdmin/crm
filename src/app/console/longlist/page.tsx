import { Plus } from "lucide-react";
import Link from "next/link";

import { FlowStrip } from "@/components/console/FlowStrip";
import { FormSheet } from "@/components/console/FormSheet";
import { FormSection, SelectField, TextField, TextareaField } from "@/components/console/fields";
import { FilterMenu, type FilterMenuItem } from "@/components/console/FilterMenu";
import { EmptyState, pillClass, pillPrimaryClass } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { funnelCounts } from "@/lib/funnel";
import { LONGLIST_CAP, listLonglist, plannedCoverage } from "@/lib/longlist";
import type { LonglistStatus, LonglistTrack } from "@/lib/longlist-rules";
import { LonglistTable } from "./LonglistTable";
import { submitNames } from "./actions";

const TRACKS = ["planned", "anytime"] as const;
const STATUSES = ["unworked", "picked", "parked", "dropped"] as const;

type Search = { q?: string; track?: string; status?: string };

export default async function LonglistPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Search> }>) {
  const { q, track, status } = await searchParams;
  const trackFilter = TRACKS.find((t) => t === track) as LonglistTrack | undefined;
  const statusFilter = STATUSES.find((s) => s === status) as LonglistStatus | undefined;
  const year = new Date().getFullYear();

  const [counts, entries, coverage, units, sectors, owners, sources] = await Promise.all([
    funnelCounts(),
    listLonglist({ search: q, track: trackFilter, status: statusFilter }),
    plannedCoverage(year),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().app_user.findMany({ where: { active: true }, orderBy: { full_name: "asc" } }),
    db().ref_value.findMany({
      where: { active: true, ref_list: { code: "lead_source" } },
      orderBy: { sort_order: "asc" },
    }),
  ]);
  const filtered = Boolean(q || trackFilter || statusFilter);

  const trackItems: FilterMenuItem[] = [
    { label: "Both tracks", href: hrefWith({ q, status }, {}), active: !trackFilter },
    ...TRACKS.map((value) => ({
      label: value,
      href: hrefWith({ q, status }, { track: value }),
      active: trackFilter === value,
    })),
  ];
  const statusItems: FilterMenuItem[] = [
    { label: "All statuses", href: hrefWith({ q, track }, {}), active: !statusFilter },
    ...STATUSES.map((value) => ({
      label: value,
      href: hrefWith({ q, track }, { status: value }),
      active: statusFilter === value,
    })),
  ];

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col md:-mx-6">
      <div className="shrink-0 px-4 pt-4 md:px-6">
        <FlowStrip counts={counts} active="longlist" />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <form role="search" className="flex items-center">
            <Input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search the longlist"
              aria-label="Search the longlist by company name"
              className="h-[30px] w-52 rounded-full border-transparent bg-secondary px-3 text-xs shadow-(--pill-shadow) md:text-xs dark:bg-secondary"
            />
            {track && <input type="hidden" name="track" value={track} />}
            {status && <input type="hidden" name="status" value={status} />}
            <button type="submit" className="sr-only">
              Apply search
            </button>
          </form>
          <FilterMenu label="Track" value={trackFilter ?? "Both"} items={trackItems} />
          <FilterMenu label="Status" value={statusFilter ?? "All"} items={statusItems} />
          {filtered && (
            <Link
              href="/console/longlist"
              className="inline-flex h-[30px] items-center rounded-full px-3 text-xs text-(--subtle) transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              Clear
            </Link>
          )}
        </div>
        <FormSheet
          trigger={
            <Button size="sm" className={pillPrimaryClass}>
              <Plus className="size-3" aria-hidden />
              Add names
            </Button>
          }
          title="Add names"
          description="A deliberately dirty list. Paste freely; cleaning happens at promotion."
          action={submitNames}
          submitLabel="Add to longlist"
        >
          <FormSection title="Names">
            <TextareaField
              label="Company names, one per line"
              name="names"
              rows={8}
              placeholder={"Kampala Grain Works\nMbarara Motors\nPearl Route Freight"}
              required
            />
            <TextField label="Source" name="source" placeholder="Where the names came from" />
          </FormSection>
          <FormSection title="Classification">
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Track"
                name="track"
                emptyLabel="Anytime"
                options={[
                  { value: "anytime", label: "Anytime" },
                  { value: "planned", label: "Planned" },
                ]}
              />
              <TextField
                label="Budget year, if planned"
                name="planYear"
                inputMode="numeric"
                defaultValue={String(year)}
              />
              <SelectField
                label="Unit"
                name="unitId"
                options={units.map((u) => ({ value: u.id.toString(), label: u.code }))}
              />
              <SelectField
                label="Sector"
                name="sectorId"
                options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
              />
            </div>
          </FormSection>
        </FormSheet>
      </div>

      {coverage.planned > 0 && (
        <dl className="grid shrink-0 grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-5 md:px-6">
          <CoverageStat label={`Planned ${year}`} value={coverage.planned} />
          <CoverageStat label="Untouched" value={coverage.untouched} />
          <CoverageStat label="In play" value={coverage.inPlay} />
          <CoverageStat label="Won" value={coverage.won} good />
          <CoverageStat label="Out" value={coverage.out} />
        </dl>
      )}

      {entries.length === 0 ? (
        <div className="grid flex-1 px-4 pb-4 md:px-6">
          <EmptyState className="h-full">
            {filtered
              ? "No name matches these filters."
              : "Nothing on the longlist yet. Paste the first batch of names."}
          </EmptyState>
        </div>
      ) : (
        <LonglistTable
          entries={entries}
          options={{
            sources: sources.map((s) => ({ value: s.id.toString(), label: s.label })),
            owners: owners.map((o) => ({ value: o.id.toString(), label: o.full_name })),
            units: units.map((u) => ({ value: u.id.toString(), label: u.name })),
            sectors: sectors.map((s) => ({ value: s.id.toString(), label: s.code })),
          }}
        />
      )}

      {entries.length === LONGLIST_CAP && (
        <p className="px-4 py-2 text-xs text-(--c-muted) md:px-6">
          Showing the first {LONGLIST_CAP} names. Narrow with search or filters to see the rest.
        </p>
      )}
    </div>
  );
}

function hrefWith(
  search: Readonly<{ q?: string; track?: string; status?: string }>,
  overrides: Readonly<{ track?: string; status?: string }>,
): string {
  const merged = { ...search, ...overrides };
  const params = new URLSearchParams();
  for (const name of ["q", "track", "status"] as const) {
    const value = merged[name];
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return query ? `/console/longlist?${query}` : "/console/longlist";
}

function CoverageStat({
  label,
  value,
  good,
}: Readonly<{ label: string; value: number; good?: boolean }>) {
  return (
    <div className="grid content-start gap-1.5 rounded-lg border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`text-sm leading-none font-medium tabular-nums ${
          good ? "text-(--c-good)" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
