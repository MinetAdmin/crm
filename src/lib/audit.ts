/** Field-level audit (FR-AUD-01, doc 06 §4). */
import type { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

export type AuditableValue = string | number | bigint | boolean | Date | null | undefined;
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

/** Diffs two shallow records into field changes, compared by serialized value. */
export function diffForAudit(
  before: AuditableRecord,
  after: AuditableRecord,
  ignore: string[] = ["updated_at", "created_at", "last_login_at"],
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

/** Writes audit rows inside the caller's transaction, grouped by `requestId`. */
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

/** Runs `mutate` in a transaction, then records the diff against `before`. */
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
