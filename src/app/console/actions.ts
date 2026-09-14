"use server";

import { auth } from "@/auth";
import { sortAccounts, summarizeAccounts, winProbability } from "@/lib/account-table";
import {
  accountPanelStats,
  getAccount,
  listAccounts,
  ownerPipeline,
  type AccountPanelStats,
} from "@/lib/accounts";
import { db } from "@/lib/db";

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

export type UserPanel = {
  identity: { name: string; role: string; email: string };
  panel: ProfilePanel;
};

/** Another user's identity and owned pipeline, for the owner drawer. */
export async function getUserPanel(userId: string): Promise<UserPanel | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const user = await db().app_user.findUnique({
    where: { id: BigInt(userId) },
    select: { full_name: true, email: true, role: true },
  });
  if (!user) return null;

  const rows = await ownerPipeline(userId);
  const weighted = rows.reduce((sum, row) => sum + row.weighted, 0);
  const openValue = rows.reduce((sum, row) => sum + row.openValue, 0);

  return {
    identity: { name: user.full_name, role: user.role, email: user.email },
    panel: {
      accounts: rows.length,
      openPursuits: rows.reduce((sum, row) => sum + row.openPursuits, 0),
      weighted,
      avgWin: winProbability(weighted, openValue),
      top: rows.slice(0, 6).map((row) => ({
        id: row.id,
        name: row.name,
        sector: row.sector,
        unit: row.unit,
        openPursuits: row.openPursuits,
        weighted: row.weighted,
        probability: winProbability(row.weighted, row.openValue),
      })),
    },
  };
}

export type AccountPanel = {
  id: string;
  name: string;
  unit: string | null;
  sector: string | null;
  country: string;
  createdAt: string;
  contacts: Array<{
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    decisionMaker: boolean;
  }>;
};

/** Account summary and pipeline stats for the detail drawer. */
export async function getAccountPanel(
  id: string,
): Promise<{ account: AccountPanel; stats: AccountPanelStats } | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const [account, stats] = await Promise.all([getAccount(id), accountPanelStats(id)]);
  if (!account) return null;

  return {
    account: {
      id: account.id.toString(),
      name: account.name,
      unit: account.unit?.code ?? null,
      sector: account.sector?.code ?? null,
      country: account.country,
      createdAt: account.created_at.toISOString().slice(0, 10),
      contacts: account.contact.map((contact) => ({
        id: contact.id.toString(),
        name: contact.full_name,
        role: contact.role_title,
        email: contact.email,
        phone: contact.phone,
        decisionMaker: contact.is_decision_maker,
      })),
    },
    stats,
  };
}

export type ActivityItem = {
  id: string;
  accountId: string;
  account: string;
  stage: string;
  actor: string;
  changedAt: string;
};

/** Latest stage movements across the pipeline, for the notifications menu. */
export async function getRecentActivity(): Promise<ActivityItem[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const rows = await db().$queryRaw<
    {
      id: string;
      account_id: string;
      account: string;
      stage: string;
      actor: string;
      changed_at: Date;
    }[]
  >`
    SELECT sh.id::text AS id,
           a.id::text AS account_id,
           a.name AS account,
           ps.name AS stage,
           u.full_name AS actor,
           sh.changed_at
    FROM stage_history sh
    JOIN opportunity o ON o.id = sh.opportunity_id
    JOIN account a ON a.id = o.account_id
    JOIN pipeline_stage ps ON ps.id = sh.to_stage_id
    JOIN app_user u ON u.id = sh.changed_by
    WHERE o.archived_at IS NULL
    ORDER BY sh.changed_at DESC
    LIMIT 8`;

  return rows.map((row) => ({
    id: row.id,
    accountId: row.account_id,
    account: row.account,
    stage: row.stage,
    actor: row.actor,
    changedAt: row.changed_at.toISOString().slice(0, 10),
  }));
}
