import { describe, expect, it } from "vitest";

import {
  type AccountRow,
  defaultDir,
  parseSort,
  sortAccounts,
  summarizeAccounts,
} from "./account-table";

function row(overrides: Partial<AccountRow>): AccountRow {
  return {
    id: "1",
    name: "Acme",
    unit: null,
    sector: null,
    contacts: 0,
    decisionMaker: false,
    openLeads: 0,
    openPursuits: 0,
    weighted: 0,
    openValue: 0,
    lastMovement: null,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

describe("parseSort", () => {
  it("falls back to name ascending on unknown input", () => {
    expect(parseSort("bogus", "sideways")).toEqual({ key: "name", dir: "asc" });
    expect(parseSort(undefined, undefined)).toEqual({ key: "name", dir: "asc" });
  });

  it("applies the key's default direction when none is given", () => {
    expect(parseSort("weighted", undefined)).toEqual({ key: "weighted", dir: "desc" });
    expect(parseSort("unit", undefined)).toEqual({ key: "unit", dir: "asc" });
  });

  it("keeps an explicit direction", () => {
    expect(parseSort("weighted", "asc")).toEqual({ key: "weighted", dir: "asc" });
  });
});

describe("defaultDir", () => {
  it("is ascending for text and descending for measures", () => {
    expect(defaultDir("name")).toBe("asc");
    expect(defaultDir("sector")).toBe("asc");
    expect(defaultDir("contacts")).toBe("desc");
    expect(defaultDir("movement")).toBe("desc");
  });
});

describe("sortAccounts", () => {
  const rows = [
    row({ id: "1", name: "Beta", weighted: 50, unit: "MED", lastMovement: "2026-02-01" }),
    row({ id: "2", name: "Alpha", weighted: 200, unit: null, lastMovement: null }),
    row({ id: "3", name: "Gamma", weighted: 50, unit: "AGR", lastMovement: "2026-03-05" }),
  ];

  it("sorts numbers descending with name as tiebreak", () => {
    expect(sortAccounts(rows, "weighted", "desc").map((r) => r.id)).toEqual(["2", "1", "3"]);
  });

  it("sinks empty values to the bottom in either direction", () => {
    expect(sortAccounts(rows, "unit", "asc").map((r) => r.id)).toEqual(["3", "1", "2"]);
    expect(sortAccounts(rows, "unit", "desc").map((r) => r.id)).toEqual(["1", "3", "2"]);
    expect(sortAccounts(rows, "movement", "desc").map((r) => r.id)).toEqual(["3", "1", "2"]);
  });

  it("does not mutate its input", () => {
    const before = rows.map((r) => r.id);
    sortAccounts(rows, "weighted", "desc");
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});

describe("summarizeAccounts", () => {
  it("totals counts and weighted pipeline", () => {
    const summary = summarizeAccounts([
      row({ contacts: 2, openLeads: 1, openPursuits: 3, weighted: 100 }),
      row({ contacts: 1, openLeads: 0, openPursuits: 1, weighted: 40.5 }),
    ]);
    expect(summary).toEqual({
      accounts: 2,
      contacts: 3,
      openLeads: 1,
      openPursuits: 4,
      weighted: 140.5,
    });
  });
});
