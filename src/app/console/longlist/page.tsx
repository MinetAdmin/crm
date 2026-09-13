import Link from "next/link";

import { FlowStrip } from "@/components/console/FlowStrip";
import { FormSheet } from "@/components/console/FormSheet";
import { SelectField, TextField, TextareaField } from "@/components/console/fields";
import { EmptyState } from "@/components/console/ui";
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

  return (
    <div className="w-full">
      <FlowStrip counts={counts} active="longlist" />

      <div className="flex flex-wrap items-center gap-2">
        <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" role="search">
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search the longlist"
            aria-label="Search the longlist by company name"
            className="w-56"
          />
          <div className="w-40">
            <SelectField
              label="Track"
              labelHidden
              name="track"
              defaultValue={trackFilter}
              emptyLabel="Both tracks"
              options={[
                { value: "planned", label: `Planned` },
                { value: "anytime", label: "Anytime" },
              ]}
            />
          </div>
          <div className="w-40">
            <SelectField
              label="Status"
              labelHidden
              name="status"
              defaultValue={statusFilter}
              emptyLabel="All statuses"
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
          {filtered && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/console/longlist">Clear</Link>
            </Button>
          )}
        </form>
        <span className="text-sm tabular-nums text-(--c-muted)">
          {entries.length} {entries.length === 1 ? "name" : "names"}
        </span>
        <FormSheet
          trigger={<Button size="sm">Add names</Button>}
          title="Add names"
          description="A deliberately dirty list. Paste freely; cleaning happens at promotion."
          action={submitNames}
          submitLabel="Add to longlist"
        >
          <TextareaField
            label="Company names, one per line"
            name="names"
            rows={8}
            placeholder={"Kampala Grain Works\nMbarara Motors\nPearl Route Freight"}
            required
          />
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
          </div>
          <TextField label="Source" name="source" placeholder="Where the names came from" />
          <div className="grid grid-cols-2 gap-3">
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
        </FormSheet>
      </div>

      {coverage.planned > 0 && (
        <dl className="mt-4 flex flex-wrap gap-3 text-sm">
          <CoverageStat label={`Planned ${year}`} value={coverage.planned} />
          <CoverageStat label="Untouched" value={coverage.untouched} />
          <CoverageStat label="In play" value={coverage.inPlay} />
          <CoverageStat label="Won" value={coverage.won} good />
          <CoverageStat label="Out" value={coverage.out} />
        </dl>
      )}

      {entries.length === 0 ? (
        <div className="mt-4">
          <EmptyState>
            {filtered
              ? "No name matches these filters."
              : "Nothing on the longlist yet. Paste the first batch of names."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4">
          <LonglistTable
            entries={entries}
            options={{
              sources: sources.map((s) => ({ value: s.id.toString(), label: s.label })),
              owners: owners.map((o) => ({ value: o.id.toString(), label: o.full_name })),
              units: units.map((u) => ({ value: u.id.toString(), label: u.name })),
              sectors: sectors.map((s) => ({ value: s.id.toString(), label: s.code })),
            }}
          />
        </div>
      )}

      {entries.length === LONGLIST_CAP && (
        <p className="mt-2 text-[13px] text-(--c-muted)">
          Showing the first {LONGLIST_CAP} names. Narrow with search or filters to see the rest.
        </p>
      )}
    </div>
  );
}

function CoverageStat({
  label,
  value,
  good,
}: Readonly<{ label: string; value: number; good?: boolean }>) {
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) px-4 py-2.5">
      <dt className="text-[12px] text-(--c-muted)">{label}</dt>
      <dd className={`mt-0.5 font-semibold tabular-nums ${good ? "text-(--c-good)" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
