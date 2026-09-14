import { db } from "./db";
import { writeAudit } from "./audit";
import { DECIDED_STATUSES, decisionNeedsReason, type ValueBasis } from "./tender-rules";

export class TenderRuleError extends Error {}

export async function listTenders(type?: string) {
  return db().tender.findMany({
    where: { archived_at: null, ...(type ? { tender_type: type as never } : {}) },
    orderBy: [{ submission_deadline: "asc" }, { id: "desc" }],
    take: 200,
    include: {
      sector: { select: { code: true } },
      unit: { select: { code: true } },
      opportunity: { select: { id: true, name: true } },
      tender: { select: { id: true, title: true } },
    },
  });
}

export async function getTender(id: string) {
  return db().tender.findFirst({
    where: { id: BigInt(id), archived_at: null },
    include: {
      sector: { select: { code: true } },
      unit: { select: { code: true } },
      opportunity: { select: { id: true, name: true } },
      tender: { select: { id: true, title: true } },
      other_tender: { select: { id: true, title: true, status: true } },
      ref_value: { select: { label: true } },
    },
  });
}

export type NewTender = {
  tenderType: "prequalification" | "tender";
  issuingBody: string;
  title: string;
  sectorId: string;
  unitId: string;
  recordedValue: number;
  valueBasis: ValueBasis;
  submissionDeadline?: string;
  parentId?: string;
};

export async function createTender(input: NewTender, actorId: bigint): Promise<bigint> {
  return db().$transaction(async (tx) => {
    const tender = await tx.tender.create({
      data: {
        tender_type: input.tenderType,
        issuing_body: input.issuingBody.trim(),
        title: input.title.trim(),
        sector_id: BigInt(input.sectorId),
        unit_id: BigInt(input.unitId),
        recorded_value: input.recordedValue,
        value_basis: input.valueBasis,
        submission_deadline: input.submissionDeadline
          ? new Date(input.submissionDeadline)
          : null,
        parent_prequalification_id: input.parentId ? BigInt(input.parentId) : null,
        owner_id: actorId,
      },
    });
    await writeAudit(tx, {
      entity: "tender",
      entityId: tender.id,
      changedBy: actorId,
      changes: [
        { field: "title", oldValue: null, newValue: tender.title },
        { field: "recorded_value", oldValue: null, newValue: String(input.recordedValue) },
        { field: "value_basis", oldValue: null, newValue: input.valueBasis },
      ],
    });
    return tender.id;
  });
}

/** Moves a tender through its lifecycle, refusing a decision with no reason. */
export async function changeTenderStatus(
  input: { tenderId: string; status: string; outcomeReasonId?: string },
  actorId: bigint,
): Promise<void> {
  if (decisionNeedsReason(input.status, input.outcomeReasonId ?? null)) {
    throw new TenderRuleError(
      "BR-TEN-02: a won or lost tender needs a recorded outcome reason.",
    );
  }

  const tender = await db().tender.findFirstOrThrow({
    where: { id: BigInt(input.tenderId), archived_at: null },
  });

  await db().$transaction(async (tx) => {
    await tx.tender.update({
      where: { id: tender.id },
      data: {
        status: input.status as never,
        outcome_reason_id: input.outcomeReasonId ? BigInt(input.outcomeReasonId) : null,
        decision_date: DECIDED_STATUSES.has(input.status) ? new Date() : null,
        submitted_date:
          input.status === "submitted" ? (tender.submitted_date ?? new Date()) : tender.submitted_date,
        updated_at: new Date(),
      },
    });
    await writeAudit(tx, {
      entity: "tender",
      entityId: tender.id,
      changedBy: actorId,
      changes: [{ field: "status", oldValue: tender.status, newValue: input.status }],
    });
  });
}
