export type AccountRow = {
  id: string;
  name: string;
  unit: string | null;
  sector: string | null;
  contacts: number;
  decisionMaker: boolean;
  openLeads: number;
  openPursuits: number;
  weighted: number;
  openValue: number;
  lastMovement: string | null;
  createdAt: string;
};

export const SORT_KEYS = [
  "name",
  "unit",
  "sector",
  "contacts",
  "leads",
  "pursuits",
  "weighted",
  "movement",
  "created",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export function parseSort(sort?: string, dir?: string): { key: SortKey; dir: SortDir } {
  const key = (SORT_KEYS as readonly string[]).includes(sort ?? "") ? (sort as SortKey) : "name";
  const parsed = dir === "asc" || dir === "desc" ? dir : defaultDir(key);
  return { key, dir: parsed };
}

/** Text columns start ascending; counts, money and dates start with the largest or newest. */
export function defaultDir(key: SortKey): SortDir {
  return key === "name" || key === "unit" || key === "sector" ? "asc" : "desc";
}

function sortValueOf(key: SortKey, row: AccountRow): string | number | null {
  switch (key) {
    case "name":
      return row.name.toLowerCase();
    case "unit":
      return row.unit?.toLowerCase() ?? null;
    case "sector":
      return row.sector?.toLowerCase() ?? null;
    case "contacts":
      return row.contacts;
    case "leads":
      return row.openLeads;
    case "pursuits":
      return row.openPursuits;
    case "weighted":
      return row.weighted;
    case "movement":
      return row.lastMovement;
    case "created":
      return row.createdAt;
  }
}

/** Sorts a copy; empty values sink to the bottom in either direction, name breaks ties. */
export function sortAccounts(
  rows: ReadonlyArray<AccountRow>,
  key: SortKey,
  dir: SortDir,
): AccountRow[] {
  const sign = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = sortValueOf(key, a);
    const vb = sortValueOf(key, b);
    if (va === null && vb === null) return a.name.localeCompare(b.name);
    if (va === null) return 1;
    if (vb === null) return -1;
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
    return cmp !== 0 ? sign * cmp : a.name.localeCompare(b.name);
  });
}

export type AccountSummary = {
  accounts: number;
  contacts: number;
  openLeads: number;
  openPursuits: number;
  weighted: number;
};

export function summarizeAccounts(rows: ReadonlyArray<AccountRow>): AccountSummary {
  return rows.reduce<AccountSummary>(
    (sum, row) => ({
      accounts: sum.accounts + 1,
      contacts: sum.contacts + row.contacts,
      openLeads: sum.openLeads + row.openLeads,
      openPursuits: sum.openPursuits + row.openPursuits,
      weighted: sum.weighted + row.weighted,
    }),
    { accounts: 0, contacts: 0, openLeads: 0, openPursuits: 0, weighted: 0 },
  );
}
