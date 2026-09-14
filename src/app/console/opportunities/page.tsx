import { Upload } from "lucide-react";
import Link from "next/link";

import { FilterMenu, type FilterMenuItem } from "@/components/console/FilterMenu";
import { FlowStrip } from "@/components/console/FlowStrip";
import { EmptyState, pillClass } from "@/components/console/ui";
import { Input } from "@/components/ui/input";
import { winProbability } from "@/lib/account-table";
import { db } from "@/lib/db";
import { funnelCounts } from "@/lib/funnel";
import {
  listOpportunities,
  OPPORTUNITY_LIST_CAP,
  type OpportunityRow,
} from "@/lib/opportunities";

import { OpportunitiesTable, type OpportunitySummary } from "./OpportunitiesTable";

const OUTCOMES = ["open", "won", "lost", "on_hold", "withdrawn"] as const;

type Search = {
  q?: string;
  outcome?: string;
  stage?: string;
  sort?: string;
  dir?: string;
};

const SORT_LABELS = {
  close: "Close date",
  name: "Name",
  account: "Account",
  stage: "Stage",
  owner: "Owner",
  expected: "Expected",
  weighted: "Weighted",
} as const;

type SortKey = keyof typeof SORT_LABELS;
type SortDir = "asc" | "desc";

export default async function OpportunitiesPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Search> }>) {
  const { q, outcome, stage, sort, dir } = await searchParams;
  const key: SortKey = sort && sort in SORT_LABELS ? (sort as SortKey) : "close";
  const direction: SortDir = dir === "desc" ? "desc" : dir === "asc" ? "asc" : defaultDir(key);

  const [rows, counts, stages] = await Promise.all([
    listOpportunities({ search: q, outcome, stageId: stage }),
    funnelCounts(),
    db().pipeline_stage.findMany({ where: { active: true }, orderBy: { sort_order: "asc" } }),
  ]);
  const opportunities = sortOpportunities(rows, key, direction);
  const summary = summarize(opportunities);
  const search = { q, outcome, stage, sort, dir };
  const filtered = Boolean(q || outcome || stage);

  const outcomeItems: FilterMenuItem[] = [
    { label: "All", href: hrefWith(search, { outcome: undefined }), active: !outcome },
    ...OUTCOMES.map((value) => ({
      label: value.replaceAll("_", " "),
      href: hrefWith(search, { outcome: value }),
      active: outcome === value,
    })),
  ];
  const stageItems: FilterMenuItem[] = [
    { label: "All stages", href: hrefWith(search, { stage: undefined }), active: !stage },
    ...stages.map((s) => ({
      label: s.name,
      href: hrefWith(search, { stage: s.id.toString() }),
      active: stage === s.id.toString(),
    })),
  ];
  const sortItems: FilterMenuItem[] = (
    Object.entries(SORT_LABELS) as Array<[SortKey, string]>
  ).map(([k, label]) => {
    const active = k === key;
    const nextDir: SortDir = active
      ? direction === "asc"
        ? "desc"
        : "asc"
      : defaultDir(k);
    return {
      label: active ? `${label} (${direction === "asc" ? "ascending" : "descending"})` : label,
      href: hrefWith(search, { sort: k, dir: nextDir }),
      active,
    };
  });

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col md:-mx-6">
      <FlowStrip counts={counts} active="pipeline" />
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 pb-4 md:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <form role="search" className="flex items-center">
            <Input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search pursuits"
              aria-label="Search pursuits by name"
              className="h-[30px] w-52 rounded-full border-transparent bg-secondary px-3 text-xs shadow-(--pill-shadow) md:text-xs dark:bg-secondary"
            />
            {outcome && <input type="hidden" name="outcome" value={outcome} />}
            {stage && <input type="hidden" name="stage" value={stage} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {dir && <input type="hidden" name="dir" value={dir} />}
            <button type="submit" className="sr-only">
              Apply search
            </button>
          </form>
          <FilterMenu
            label="Outcome"
            value={outcome ? outcome.replaceAll("_", " ") : "All"}
            items={outcomeItems}
          />
          <FilterMenu
            label="Stage"
            value={stages.find((s) => s.id.toString() === stage)?.code ?? "All"}
            items={stageItems}
          />
          <FilterMenu
            label="Sort by"
            value={`${SORT_LABELS[key]} ${direction === "asc" ? "↑" : "↓"}`}
            items={sortItems}
          />
          {filtered && (
            <Link
              href="/console/opportunities"
              className="inline-flex h-[30px] items-center rounded-full px-3 text-xs text-(--subtle) transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              Clear
            </Link>
          )}
        </div>
        <a
          href={hrefWith(search, {}, "/console/opportunities/export")}
          download
          className={`inline-flex items-center justify-center gap-1.5 ${pillClass}`}
        >
          <Upload className="size-3" aria-hidden />
          Export
        </a>
      </div>

      {opportunities.length === 0 ? (
        <div className="grid flex-1 px-4 pb-4 md:px-6">
          <EmptyState className="h-full">
            {filtered
              ? "No pursuit matches these filters."
              : "No opportunities here. They arrive by converting a lead."}
          </EmptyState>
        </div>
      ) : (
        <OpportunitiesTable opportunities={opportunities} summary={summary} />
      )}

      {rows.length === OPPORTUNITY_LIST_CAP && (
        <p className="px-4 py-2 text-xs text-(--c-muted) md:px-6">
          Showing the first {OPPORTUNITY_LIST_CAP} pursuits. Narrow with search or filters to see
          the rest.
        </p>
      )}
    </div>
  );
}

function summarize(rows: ReadonlyArray<OpportunityRow>): OpportunitySummary {
  const expected = rows.reduce((sum, row) => sum + row.expected, 0);
  const weighted = rows.reduce((sum, row) => sum + row.weighted, 0);
  return {
    count: rows.length,
    expected,
    weighted,
    avgWin: winProbability(weighted, expected),
  };
}

function defaultDir(key: SortKey): SortDir {
  return key === "expected" || key === "weighted" ? "desc" : "asc";
}

function sortValueOf(key: SortKey, row: OpportunityRow): string | number {
  switch (key) {
    case "name":
      return row.name.toLowerCase();
    case "account":
      return row.account.name.toLowerCase();
    case "stage":
      return row.stage.toLowerCase();
    case "owner":
      return row.owner.name.toLowerCase();
    case "expected":
      return row.expected;
    case "weighted":
      return row.weighted;
    default:
      return row.expectedCloseDate;
  }
}

function sortOpportunities(
  rows: ReadonlyArray<OpportunityRow>,
  key: SortKey,
  dir: SortDir,
): OpportunityRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = sortValueOf(key, a);
    const right = sortValueOf(key, b);
    if (left < right) return -sign;
    if (left > right) return sign;
    return a.name.localeCompare(b.name);
  });
}

function hrefWith(
  search: Readonly<Search>,
  overrides: Readonly<Partial<Record<keyof Search, string | undefined>>>,
  path = "/console/opportunities",
): string {
  const merged = { ...search, ...overrides };
  const params = new URLSearchParams();
  for (const name of ["q", "outcome", "stage", "sort", "dir"] as const) {
    const value = merged[name];
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
