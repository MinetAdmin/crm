import { db } from "./db";
import { writeAudit } from "./audit";

export type NextAction = {
  id: string;
  subject: string;
  dueDate: Date | null;
  overdue: boolean;
};

/** The open next action on an opportunity, if it has one (BR-OPP-02). */
export async function nextActionFor(opportunityId: string): Promise<NextAction | null> {
  const action = await db().activity.findFirst({
    where: {
      opportunity_id: BigInt(opportunityId),
      activity_type: "next_action",
      completed_at: null,
    },
    orderBy: { due_date: "asc" },
  });
  if (!action) return null;
  return {
    id: action.id.toString(),
    subject: action.subject,
    dueDate: action.due_date,
    overdue: action.due_date !== null && action.due_date < new Date(),
  };
}

export async function setNextAction(
  input: { opportunityId: string; subject: string; dueDate: string },
  actorId: bigint,
): Promise<void> {
  await db().$transaction(async (tx) => {
    const action = await tx.activity.create({
      data: {
        activity_type: "next_action",
        subject: input.subject.trim(),
        opportunity_id: BigInt(input.opportunityId),
        owner_id: actorId,
        due_date: new Date(input.dueDate),
      },
    });
    await writeAudit(tx, {
      entity: "activity",
      entityId: action.id,
      changedBy: actorId,
      changes: [
        { field: "subject", oldValue: null, newValue: action.subject },
        { field: "due_date", oldValue: null, newValue: input.dueDate },
      ],
    });
  });
}

/** Completing an action records when, so overdue and done stay distinguishable. */
export async function completeAction(id: string, actorId: bigint): Promise<void> {
  const action = await db().activity.findFirstOrThrow({ where: { id: BigInt(id) } });
  await db().$transaction(async (tx) => {
    await tx.activity.update({
      where: { id: action.id },
      data: { completed_at: new Date(), updated_at: new Date() },
    });
    await writeAudit(tx, {
      entity: "activity",
      entityId: action.id,
      changedBy: actorId,
      changes: [{ field: "completed_at", oldValue: null, newValue: new Date().toISOString() }],
    });
  });
}
