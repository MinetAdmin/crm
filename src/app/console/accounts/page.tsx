import Link from "next/link";

import { FilterMenu, type FilterMenuItem } from "@/components/console/FilterMenu";
import { EmptyState } from "@/components/console/ui";
import { Input } from "@/components/ui/input";
import {
  defaultDir,
  parseSort,
  sortAccounts,
  summarizeAccounts,
  type SortDir,
  type SortKey,
} from "@/lib/account-table";
import { ACCOUNT_LIST_CAP, listAccounts } from "@/lib/accounts";
import { db } from "@/lib/db";

import { AccountsTable } from "./AccountsTable";
import { NewAccountSheet } from "./NewAccountSheet";

type Search = { q?: string; unit?: string; sector?: string; sort?: string; dir?: string };

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  unit: "Unit",
  sector: "Sector",
  contacts: "Contacts",
  leads: "Open leads",
  pursuits: "Open pursuits",
  weighted: "Weighted",
  movement: "Last movement",
  created: "Created",
};

export default async function AccountsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Search> }>) {
  const { q, unit, sector, sort, dir } = await searchParams;
  const { key, dir: direction } = parseSort(sort, dir);

  const [rows, units, sectors] = await Promise.all([
    listAccounts({ search: q, unitId: unit, sectorId: sector }),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);
  const accounts = sortAccounts(rows, key, direction);
  const summary = summarizeAccounts(accounts);
  const search = { q, unit, sector, sort, dir };
  const filtered = Boolean(q || unit || sector);

  const unitItems: FilterMenuItem[] = [
    { label: "All units", href: hrefWith(search, { unit: undefined }), active: !unit },
    ...units.map((u) => ({
      label: u.code,
      href: hrefWith(search, { unit: u.id.toString() }),
      active: unit === u.id.toString(),
    })),
  ];
  const sectorItems: FilterMenuItem[] = [
    { label: "All sectors", href: hrefWith(search, { sector: undefined }), active: !sector },
    ...sectors.map((s) => ({
      label: s.code,
      href: hrefWith(search, { sector: s.id.toString() }),
      active: sector === s.id.toString(),
    })),
  ];
  const sortItems: FilterMenuItem[] = Object.entries(SORT_LABELS).map(([k, label]) => {
    const sortKey = k as SortKey;
    const active = sortKey === key;
    const nextDir: SortDir = active
      ? direction === "asc"
        ? "desc"
        : "asc"
      : defaultDir(sortKey);
    return {
      label: active ? `${label} (${direction === "asc" ? "ascending" : "descending"})` : label,
      href: hrefWith(search, { sort: sortKey, dir: nextDir }),
      active,
    };
  });

  return (
    <div className="-mx-4 -my-4 flex flex-col md:-mx-6">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <form role="search" className="flex items-center">
            <Input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search accounts"
              aria-label="Search accounts by name"
              className="h-[30px] w-52 rounded-full border-transparent bg-secondary px-3 text-xs shadow-(--pill-shadow) md:text-xs dark:bg-secondary"
            />
            {unit && <input type="hidden" name="unit" value={unit} />}
            {sector && <input type="hidden" name="sector" value={sector} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {dir && <input type="hidden" name="dir" value={dir} />}
            <button type="submit" className="sr-only">
              Apply search
            </button>
          </form>
          <FilterMenu label="Unit" value={codeFor(units, unit) ?? "All"} items={unitItems} />
          <FilterMenu label="Sector" value={codeFor(sectors, sector) ?? "All"} items={sectorItems} />
          <FilterMenu
            label="Sort by"
            value={`${SORT_LABELS[key]} ${direction === "asc" ? "↑" : "↓"}`}
            items={sortItems}
          />
          {filtered && (
            <Link
              href="/console/accounts"
              className="inline-flex h-[30px] items-center rounded-full px-3 text-xs text-(--subtle) transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              Clear
            </Link>
          )}
        </div>
        <NewAccountSheet
          units={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
          sectors={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
        />
      </div>

      {accounts.length === 0 ? (
        <div className="px-4 md:px-6">
          <EmptyState>
            {filtered
              ? "No account matches these filters."
              : "No accounts yet. The first one starts here."}
          </EmptyState>
        </div>
      ) : (
        <AccountsTable accounts={accounts} summary={summary} />
      )}

      {rows.length === ACCOUNT_LIST_CAP && (
        <p className="px-4 py-2 text-xs text-(--c-muted) md:px-6">
          Showing the first {ACCOUNT_LIST_CAP} accounts. Narrow with search or filters to see the
          rest.
        </p>
      )}
    </div>
  );
}

function hrefWith(
  search: Readonly<Search>,
  overrides: Readonly<Partial<Record<keyof Search, string | undefined>>>,
): string {
  const merged = { ...search, ...overrides };
  const params = new URLSearchParams();
  for (const name of ["q", "unit", "sector", "sort", "dir"] as const) {
    const value = merged[name];
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return query ? `/console/accounts?${query}` : "/console/accounts";
}

function codeFor(
  options: ReadonlyArray<{ id: bigint; code: string }>,
  id?: string,
): string | undefined {
  if (!id) return undefined;
  return options.find((option) => option.id.toString() === id)?.code;
}
