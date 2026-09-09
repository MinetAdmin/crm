import { db } from "./db";
import { writeAudit } from "./audit";
import { findLikelyDuplicates, type AccountMatch } from "./account-name";

export type AccountRow = {
  id: string;
  name: string;
  sector: string | null;
  unit: string | null;
  contacts: number;
};

/** Active accounts, optionally narrowed by a name fragment. */
export async function listAccounts(search?: string): Promise<AccountRow[]> {
  const rows = await db().account.findMany({
    where: {
      archived_at: null,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    },
    orderBy: { name: "asc" },
    take: 200,
    include: {
      sector: { select: { code: true } },
      unit: { select: { code: true } },
      _count: { select: { contact: { where: { archived_at: null } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id.toString(),
    name: row.name,
    sector: row.sector?.code ?? null,
    unit: row.unit?.code ?? null,
    contacts: row._count.contact,
  }));
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
