import { Prisma } from "@prisma/client";

import { db } from "./db";
import { withAudit, writeAudit } from "./audit";
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

export type AccountPursuit = {
  id: string;
  name: string;
  outcome: string;
  stageCode: string;
  stage: string;
  owner: string;
  expected: number;
  weighted: number;
  probability: number;
  lastMovement: string | null;
};

/** The account's opportunities with stage, owner, and money, open first. */
export async function accountPursuits(accountId: string): Promise<AccountPursuit[]> {
  const rows = await db().$queryRaw<
    {
      id: string;
      name: string;
      outcome: string;
      stage_code: string;
      stage: string;
      owner: string;
      expected: string;
      weighted: string;
      probability: number;
      last_movement: Date | null;
    }[]
  >`
    SELECT o.id::text AS id,
           o.name,
           o.outcome::text AS outcome,
           ps.code AS stage_code,
           ps.name AS stage,
           u.full_name AS owner,
           COALESCE(w.expected, 0)::text AS expected,
           COALESCE(w.weighted, 0)::text AS weighted,
           o.probability::float8 AS probability,
           m.last_move AS last_movement
    FROM opportunity o
    JOIN pipeline_stage ps ON ps.id = o.stage_id
    JOIN app_user u ON u.id = o.owner_id
    LEFT JOIN (SELECT opportunity_id, SUM(expected_amount) AS expected,
                      SUM(weighted_amount) AS weighted
               FROM v_schedule_line_weighted
               GROUP BY opportunity_id) w ON w.opportunity_id = o.id
    LEFT JOIN (SELECT opportunity_id, MAX(changed_at) AS last_move
               FROM stage_history
               GROUP BY opportunity_id) m ON m.opportunity_id = o.id
    WHERE o.archived_at IS NULL AND o.account_id = ${BigInt(accountId)}
    ORDER BY (o.outcome = 'open') DESC, COALESCE(w.weighted, 0) DESC, o.name ASC`;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    outcome: row.outcome,
    stageCode: row.stage_code,
    stage: row.stage,
    owner: row.owner,
    expected: Number(row.expected),
    weighted: Number(row.weighted),
    probability: Number(row.probability),
    lastMovement: row.last_movement?.toISOString().slice(0, 10) ?? null,
  }));
}

export type AccountLead = {
  id: string;
  name: string;
  status: string;
  owner: string;
  createdAt: string;
};

/** Matched leads still in play on this account. */
export async function accountLeads(accountId: string): Promise<AccountLead[]> {
  const rows = await db().$queryRaw<
    { id: string; company_name: string; status: string; owner: string; created_at: Date }[]
  >`
    SELECT l.id::text AS id, l.company_name, l.status::text AS status,
           u.full_name AS owner, l.created_at
    FROM lead l
    JOIN app_user u ON u.id = l.owner_id
    WHERE l.matched_account_id = ${BigInt(accountId)}
      AND l.archived_at IS NULL
      AND l.status NOT IN ('converted', 'disqualified')
    ORDER BY l.created_at DESC`;

  return rows.map((row) => ({
    id: row.id,
    name: row.company_name,
    status: row.status,
    owner: row.owner,
    createdAt: row.created_at.toISOString().slice(0, 10),
  }));
}

export type AccountMovement = {
  id: string;
  opportunity: string;
  stage: string;
  actor: string;
  changedAt: string;
};

/** Stage movement timeline for the account, newest first. */
export async function accountTimeline(accountId: string): Promise<AccountMovement[]> {
  const rows = await db().$queryRaw<
    { id: string; opportunity: string; stage: string; actor: string; changed_at: Date }[]
  >`
    SELECT sh.id::text AS id, o.name AS opportunity, ps.name AS stage,
           u.full_name AS actor, sh.changed_at
    FROM stage_history sh
    JOIN opportunity o ON o.id = sh.opportunity_id
    JOIN pipeline_stage ps ON ps.id = sh.to_stage_id
    JOIN app_user u ON u.id = sh.changed_by
    WHERE o.account_id = ${BigInt(accountId)} AND o.archived_at IS NULL
    ORDER BY sh.changed_at DESC
    LIMIT 12`;

  return rows.map((row) => ({
    id: row.id,
    opportunity: row.opportunity,
    stage: row.stage,
    actor: row.actor,
    changedAt: row.changed_at.toISOString().slice(0, 10),
  }));
}

export type AccountEngagement = {
  total: number;
  meetings: number;
  calls: number;
  submissions: number;
};

/** Activity counts on the account over the last 30 days. */
export async function accountEngagement(accountId: string): Promise<AccountEngagement> {
  const id = BigInt(accountId);
  const rows = await db().$queryRaw<{ type: string; count: number }[]>`
    SELECT act.activity_type::text AS type, COUNT(*)::int AS count
    FROM activity act
    LEFT JOIN opportunity o ON o.id = act.opportunity_id
    LEFT JOIN lead l ON l.id = act.lead_id
    WHERE act.created_at > now() - interval '30 days'
      AND (act.account_id = ${id} OR o.account_id = ${id} OR l.matched_account_id = ${id})
    GROUP BY act.activity_type`;

  const byType = new Map(rows.map((row) => [row.type, row.count]));
  return {
    total: rows.reduce((sum, row) => sum + row.count, 0),
    meetings: byType.get("meeting") ?? 0,
    calls: byType.get("call") ?? 0,
    submissions: byType.get("submission") ?? 0,
  };
}

export type AccountEdit = { name: string; sectorId?: string; unitId?: string };

/** Updates the account's name and classification inside the audit transaction. */
export async function updateAccount(
  id: string,
  input: AccountEdit,
  actorId: bigint,
): Promise<void> {
  const accountId = BigInt(id);
  const before = await db().account.findUniqueOrThrow({
    where: { id: accountId },
    select: { name: true, sector_id: true, unit_id: true },
  });
  await withAudit(db(), {
    entity: "account",
    entityId: accountId,
    changedBy: actorId,
    before,
    mutate: (tx) =>
      tx.account.update({
        where: { id: accountId },
        data: {
          name: input.name.trim(),
          sector_id: input.sectorId ? BigInt(input.sectorId) : null,
          unit_id: input.unitId ? BigInt(input.unitId) : null,
        },
        select: { name: true, sector_id: true, unit_id: true },
      }),
  });
}

/**
 * Merges one account into a survivor (FR-ACC-04). Every child record moves to
 * the survivor, the source is archived, and both sides are audited in the
 * same transaction.
 */
export async function mergeAccounts(
  sourceId: string,
  survivorId: string,
  actorId: bigint,
): Promise<void> {
  if (sourceId === survivorId) throw new Error("An account cannot merge into itself.");
  const src = BigInt(sourceId);
  const dst = BigInt(survivorId);

  await db().$transaction(async (tx) => {
    const source = await tx.account.findFirstOrThrow({
      where: { id: src, archived_at: null },
      select: { name: true },
    });
    const survivor = await tx.account.findFirstOrThrow({
      where: { id: dst, archived_at: null },
      select: { name: true },
    });

    await tx.contact.updateMany({ where: { account_id: src }, data: { account_id: dst } });
    await tx.opportunity.updateMany({ where: { account_id: src }, data: { account_id: dst } });
    await tx.activity.updateMany({ where: { account_id: src }, data: { account_id: dst } });
    await tx.lead.updateMany({
      where: { matched_account_id: src },
      data: { matched_account_id: dst },
    });
    await tx.longlist_entry.updateMany({
      where: { matched_account_id: src },
      data: { matched_account_id: dst },
    });
    await tx.account.update({ where: { id: src }, data: { archived_at: new Date() } });

    await writeAudit(tx, {
      entity: "account",
      entityId: src,
      changedBy: actorId,
      changes: [
        { field: "merged_into", oldValue: null, newValue: `${survivorId} (${survivor.name})` },
        { field: "archived_at", oldValue: null, newValue: new Date().toISOString() },
      ],
    });
    await writeAudit(tx, {
      entity: "account",
      entityId: dst,
      changedBy: actorId,
      changes: [
        { field: "merged_from", oldValue: null, newValue: `${sourceId} (${source.name})` },
      ],
    });
  });
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
