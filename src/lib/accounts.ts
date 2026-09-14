import { Prisma } from "@prisma/client";

import { db } from "./db";
import { writeAudit } from "./audit";
import { findLikelyDuplicates, type AccountMatch } from "./account-name";
import type { AccountRow } from "./account-table";

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
  const [pipeline, leads] = await Promise.all([
    pipelineByAccountIds(ids),
    openLeadsByAccountIds(ids),
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
