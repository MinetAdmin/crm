"use server";

import { auth } from "@/auth";
import { sortAccounts, summarizeAccounts, winProbability } from "@/lib/account-table";
import { listAccounts } from "@/lib/accounts";

export type ProfilePanel = {
  accounts: number;
  openPursuits: number;
  weighted: number;
  avgWin: number | null;
  top: Array<{
    id: string;
    name: string;
    sector: string | null;
    unit: string | null;
    openPursuits: number;
    weighted: number;
    probability: number | null;
  }>;
};

/** Pipeline figures for the profile drawer, from the shared account list. */
export async function getProfilePanel(): Promise<ProfilePanel> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const rows = await listAccounts({});
  const summary = summarizeAccounts(rows);
  const openValue = rows.reduce((sum, row) => sum + row.openValue, 0);
  const top = sortAccounts(rows, "weighted", "desc")
    .filter((row) => row.weighted > 0 || row.openPursuits > 0)
    .slice(0, 6)
    .map((row) => ({
      id: row.id,
      name: row.name,
      sector: row.sector,
      unit: row.unit,
      openPursuits: row.openPursuits,
      weighted: row.weighted,
      probability: winProbability(row.weighted, row.openValue),
    }));

  return {
    accounts: summary.accounts,
    openPursuits: summary.openPursuits,
    weighted: summary.weighted,
    avgWin: winProbability(summary.weighted, openValue),
    top,
  };
}
