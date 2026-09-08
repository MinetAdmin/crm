/**
 * Field-level audit (FR-AUD-01, doc 06 §4).
 *
 * Rule of the codebase: every mutation of a business entity goes through
 * `withAudit`, in the same transaction as the change. There is no second way
 * to write to the database from the app (doc 03 §3.1).
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

export type AuditableValue = string | number | boolean | Date | null | undefined;
export type AuditableRecord = Record<string, AuditableValue>;

export interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

function serialize(v: AuditableValue): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/**
 * Diff two shallow records into audit rows. Fields present in either side are
 * compared by serialized value; unchanged fields produce nothing. `ignore`
 * defaults to bookkeeping columns that would only add noise.
 */
export function diffForAudit(
  before: AuditableRecord,
  after: AuditableRecord,
  ignore: string[] = ["updated_at", "created_at"],
): FieldChange[] {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: FieldChange[] = [];
  for (const field of fields) {
    if (ignore.includes(field)) continue;
    const oldValue = serialize(before[field]);
    const newValue = serialize(after[field]);
    if (oldValue !== newValue) changes.push({ field, oldValue, newValue });
  }
  return changes;
}

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Write audit rows for a change, inside the caller's transaction.
 * `requestId` groups every row of one save (doc 04: audit_log.request_id).
 */
export async function writeAudit(
  tx: Tx,
  params: {
    entity: string;
    entityId: bigint | number;
    changes: FieldChange[];
    changedBy: bigint | number;
    requestId?: string;
  },
): Promise<void> {
  if (params.changes.length === 0) return;
  const requestId = params.requestId ?? randomUUID();
  await tx.audit_log.createMany({
    data: params.changes.map((c) => ({
      entity: params.entity,
      entity_id: BigInt(params.entityId),
      field: c.field,
      old_value: c.oldValue,
      new_value: c.newValue,
      changed_by: BigInt(params.changedBy),
      request_id: requestId,
    })),
  });
}

/**
 * Convenience wrapper: run `mutate` in a transaction, then diff and record.
 * Callers fetch `before` themselves (they usually already have it for the
 * optimistic-lock check, NFR-DATA-03).
 */
export async function withAudit<T extends AuditableRecord>(
  prisma: PrismaClient,
  params: {
    entity: string;
    entityId: bigint | number;
    changedBy: bigint | number;
    before: AuditableRecord;
    mutate: (tx: Prisma.TransactionClient) => Promise<T>;
  },
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const after = await params.mutate(tx);
    await writeAudit(tx, {
      entity: params.entity,
      entityId: params.entityId,
      changes: diffForAudit(params.before, after),
      changedBy: params.changedBy,
    });
    return after;
  });
}
