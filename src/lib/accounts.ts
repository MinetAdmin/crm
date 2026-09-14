import { Prisma } from "@prisma/client";

import { db } from "./db";
import { writeAudit } from "./audit";
import { findLikelyDuplicates, type AccountMatch } from "./account-name";
import { TREND_WEEKS, type AccountRow } from "./account-table";

export const ACCOUNT_LIST_CAP = 200;

export type AccountFilters = {
  search?: string;
  unitId?: string;
  sectorId?: string;
};

/** Active accounts with their contact, lead and pipeline standing at read time. */
export async function listAccounts(filters: AccountFilters = {}): Promise<AccountRow[]> {
  const rows = await db().account.findMany({
    where: {
      archived_at: null,
      ...(filters.search
        ? { name: { contains: filters.search, mode: "insensitive" as const } }
        : {}),
      ...(filters.unitId ? { unit_id: BigInt(filters.unitId) } : {}),
      ...(filters.sectorId ? { sector_id: BigInt(filters.sectorId) } : {}),
    },
    orderBy: { name: "asc" },
    take: ACCOUNT_LIST_CAP,
    include: {
      sector: { select: { code: true } },
      unit: { select: { code: true } },
      _count: { select: { contact: { where: { archived_at: null } } } },
      contact: {
        where: { archived_at: null, is_decision_maker: true },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [pipeline, leads, trends, owners] = await Promise.all([
    pipelineByAccountIds(ids),
    openLeadsByAccountIds(ids),
    movementTrendByAccountIds(ids),
    ownersByAccountIds(ids),
  ]);

  return rows.map((row) => {
    const id = row.id.toString();
    const agg = pipeline.get(id);
    return {
      id,
      name: row.name,
      sector: row.sector?.code ?? null,
      unit: row.unit?.code ?? null,
      contacts: row._count.contact,
      decisionMaker: row.contact.length > 0,
      openLeads: leads.get(id) ?? 0,
      openPursuits: agg?.openPursuits ?? 0,
      weighted: agg?.weighted ?? 0,
      openValue: agg?.openValue ?? 0,
      trend: trends.get(id) ?? [],
      owner: owners.get(id) ?? null,
      lastMovement: agg?.lastMovement?.toISOString().slice(0, 10) ?? null,
      createdAt: row.created_at.toISOString().slice(0, 10),
    };
  });
}

type PipelineAgg = {
  openPursuits: number;
  weighted: number;
  openValue: number;
  lastMovement: Date | null;
};

/** Open-pursuit count, weighted and expected pipeline and latest stage movement per account. */
async function pipelineByAccountIds(ids: bigint[]): Promise<Map<string, PipelineAgg>> {
  const rows = await db().$queryRaw<
    {
      account_id: string;
      open_pursuits: number;
      weighted: string;
      open_value: string;
      last_movement: Date | null;
    }[]
  >`
    SELECT o.account_id::text AS account_id,
           COUNT(*) FILTER (WHERE o.outcome = 'open')::int AS open_pursuits,
           COALESCE(SUM(w.weighted) FILTER (WHERE o.outcome = 'open'), 0)::text AS weighted,
           COALESCE(SUM(w.expected) FILTER (WHERE o.outcome = 'open'), 0)::text AS open_value,
           MAX(m.last_move) AS last_movement
    FROM opportunity o
    LEFT JOIN (SELECT opportunity_id, SUM(weighted_amount) AS weighted,
                      SUM(expected_amount) AS expected
               FROM v_schedule_line_weighted
               GROUP BY opportunity_id) w ON w.opportunity_id = o.id
    LEFT JOIN (SELECT opportunity_id, MAX(changed_at) AS last_move
               FROM stage_history
               GROUP BY opportunity_id) m ON m.opportunity_id = o.id
    WHERE o.archived_at IS NULL AND o.account_id IN (${Prisma.join(ids)})
    GROUP BY o.account_id`;

  return new Map(
    rows.map((row) => [
      row.account_id,
      {
        openPursuits: row.open_pursuits,
        weighted: Number(row.weighted),
        openValue: Number(row.open_value),
        lastMovement: row.last_movement,
      },
    ]),
  );
}

export type AccountOwner = { id: string; name: string };

/** The BD owner holding the most open pursuits on each account (D-30). */
async function ownersByAccountIds(ids: bigint[]): Promise<Map<string, AccountOwner>> {
  const rows = await db().$queryRaw<
    { account_id: string; owner_id: string; owner: string }[]
  >`
    SELECT DISTINCT ON (o.account_id)
           o.account_id::text AS account_id,
           u.id::text AS owner_id,
           u.full_name AS owner
    FROM opportunity o
    JOIN app_user u ON u.id = o.owner_id
    WHERE o.archived_at IS NULL
      AND o.outcome = 'open'
      AND o.account_id IN (${Prisma.join(ids)})
    GROUP BY o.account_id, u.id, u.full_name
    ORDER BY o.account_id, COUNT(*) DESC, MAX(o.created_at) DESC`;

  return new Map(rows.map((row) => [row.account_id, { id: row.owner_id, name: row.owner }]));
}

export type OwnerAccountRow = {
  id: string;
  name: string;
  sector: string | null;
  unit: string | null;
  openPursuits: number;
  weighted: number;
  openValue: number;
};

/** Accounts where the given user holds open pursuits, with their share of the pipeline. */
export async function ownerPipeline(userId: string): Promise<OwnerAccountRow[]> {
  const rows = await db().$queryRaw<
    {
      id: string;
      name: string;
      sector: string | null;
      unit: string | null;
      open_pursuits: number;
      weighted: string;
      expected: string;
    }[]
  >`
    SELECT a.id::text AS id,
           a.name,
           s.code AS sector,
           un.code AS unit,
           COUNT(*) FILTER (WHERE o.outcome = 'open')::int AS open_pursuits,
           COALESCE(SUM(w.weighted) FILTER (WHERE o.outcome = 'open'), 0)::text AS weighted,
           COALESCE(SUM(w.expected) FILTER (WHERE o.outcome = 'open'), 0)::text AS expected
    FROM opportunity o
    JOIN account a ON a.id = o.account_id AND a.archived_at IS NULL
    LEFT JOIN sector s ON s.id = a.sector_id
    LEFT JOIN unit un ON un.id = a.unit_id
    LEFT JOIN (SELECT opportunity_id, SUM(weighted_amount) AS weighted,
                      SUM(expected_amount) AS expected
               FROM v_schedule_line_weighted
               GROUP BY opportunity_id) w ON w.opportunity_id = o.id
    WHERE o.archived_at IS NULL AND o.owner_id = ${BigInt(userId)}
    GROUP BY a.id, a.name, s.code, un.code
    HAVING COUNT(*) FILTER (WHERE o.outcome = 'open') > 0`;

  return rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      sector: row.sector,
      unit: row.unit,
      openPursuits: row.open_pursuits,
      weighted: Number(row.weighted),
      openValue: Number(row.expected),
    }))
    .sort((a, b) => b.weighted - a.weighted);
}

/** Stage movements per week for the trend bars, oldest week first. */
async function movementTrendByAccountIds(ids: bigint[]): Promise<Map<string, number[]>> {
  const rows = await db().$queryRaw<
    { account_id: string; weeks_ago: number; moves: number }[]
  >`
    SELECT o.account_id::text AS account_id,
           floor(extract(epoch FROM (now() - sh.changed_at)) / 604800)::int AS weeks_ago,
           COUNT(*)::int AS moves
    FROM stage_history sh
    JOIN opportunity o ON o.id = sh.opportunity_id
    WHERE o.archived_at IS NULL
      AND o.account_id IN (${Prisma.join(ids)})
      AND sh.changed_at > now() - interval '14 weeks'
    GROUP BY o.account_id, weeks_ago`;

  const map = new Map<string, number[]>();
  for (const row of rows) {
    const trend = map.get(row.account_id) ?? new Array<number>(TREND_WEEKS).fill(0);
    const index = TREND_WEEKS - 1 - row.weeks_ago;
    if (index >= 0) trend[index] = row.moves;
    map.set(row.account_id, trend);
  }
  return map;
}

/** Matched leads still in play, per account. */
async function openLeadsByAccountIds(ids: bigint[]): Promise<Map<string, number>> {
  const rows = await db().lead.groupBy({
    by: ["matched_account_id"],
    where: {
      matched_account_id: { in: ids },
      archived_at: null,
      status: { notIn: ["converted", "disqualified"] },
    },
    _count: { _all: true },
  });
  return new Map(
    rows
      .filter((row) => row.matched_account_id !== null)
      .map((row) => [String(row.matched_account_id), row._count._all]),
  );
}

/** Candidates for the duplicate prompt, folded by comparisonKey. */
export async function duplicatesFor(name: string): Promise<AccountMatch[]> {
  const existing = await db().account.findMany({
    where: { archived_at: null },
    select: { id: true, name: true },
  });
  return findLikelyDuplicates(
    name,
    existing.map((a) => ({ id: a.id.toString(), name: a.name })),
  );
}

export type NewAccount = {
  name: string;
  sectorId?: string;
  unitId?: string;
  operationsRef?: string;
};

/** Creates an account and records the creation in the audit log. */
export async function createAccount(input: NewAccount, actorId: bigint): Promise<bigint> {
  return db().$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        name: input.name.trim(),
        sector_id: input.sectorId ? BigInt(input.sectorId) : null,
        unit_id: input.unitId ? BigInt(input.unitId) : null,
        operations_ref: input.operationsRef?.trim() || null,
      },
    });
    await writeAudit(tx, {
      entity: "account",
      entityId: account.id,
      changedBy: actorId,
      changes: [
        { field: "name", oldValue: null, newValue: account.name },
        { field: "sector_id", oldValue: null, newValue: account.sector_id?.toString() ?? null },
        { field: "unit_id", oldValue: null, newValue: account.unit_id?.toString() ?? null },
      ],
    });
    return account.id;
  });
}

export async function getAccount(id: string) {
  return db().account.findFirst({
    where: { id: BigInt(id), archived_at: null },
    include: {
      sector: { select: { code: true, name: true } },
      unit: { select: { code: true, name: true } },
      contact: { where: { archived_at: null }, orderBy: { full_name: "asc" } },
    },
  });
}

export type AccountPanelStats = {
  openPursuits: number;
  weighted: number;
  openValue: number;
  openLeads: number;
  trend: number[];
  lastMovement: string | null;
};

/** Pipeline numbers for the account detail drawer. */
export async function accountPanelStats(id: string): Promise<AccountPanelStats> {
  const ids = [BigInt(id)];
  const [pipeline, leads, trends] = await Promise.all([
    pipelineByAccountIds(ids),
    openLeadsByAccountIds(ids),
    movementTrendByAccountIds(ids),
  ]);
  const agg = pipeline.get(id);
  return {
    openPursuits: agg?.openPursuits ?? 0,
    weighted: agg?.weighted ?? 0,
    openValue: agg?.openValue ?? 0,
    openLeads: leads.get(id) ?? 0,
    trend: trends.get(id) ?? [],
    lastMovement: agg?.lastMovement?.toISOString().slice(0, 10) ?? null,
  };
}

export type NewContact = {
  accountId: string;
  fullName: string;
  roleTitle?: string;
  email?: string;
  phone?: string;
  isDecisionMaker: boolean;
};

/** Adds a contact to an account and records it in the audit log. */
export async function createContact(input: NewContact, actorId: bigint): Promise<void> {
  await db().$transaction(async (tx) => {
    const contact = await tx.contact.create({
      data: {
        account_id: BigInt(input.accountId),
        full_name: input.fullName.trim(),
        role_title: input.roleTitle?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        is_decision_maker: input.isDecisionMaker,
      },
    });
    await writeAudit(tx, {
      entity: "contact",
      entityId: contact.id,
      changedBy: actorId,
      changes: [
        { field: "account_id", oldValue: null, newValue: input.accountId },
        { field: "full_name", oldValue: null, newValue: contact.full_name },
        { field: "is_decision_maker", oldValue: null, newValue: String(contact.is_decision_maker) },
      ],
    });
  });
}
