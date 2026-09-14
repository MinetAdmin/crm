import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAdminister, canWrite, type RecordOwnership, type Viewer } from "./visibility";
import { db } from "./db";

export class ForbiddenError extends Error {
  constructor(message = "Not permitted") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** The signed-in person, or the sign-in page. */
export async function currentViewer(): Promise<Viewer> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return {
    id: session.user.id,
    role: session.user.role || "unknown",
    unitId: session.user.unitId,
  };
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await currentViewer();
  if (!canAdminister(viewer)) throw new ForbiddenError("Administration is restricted.");
  return viewer;
}

/** Refuses a write the viewer's scope does not cover (doc 06 §3). */
export function assertCanWrite(viewer: Viewer, record: RecordOwnership): void {
  if (!canWrite(viewer, record)) {
    throw new ForbiddenError("That record belongs to another owner or unit.");
  }
}

export async function assertCanWriteOpportunity(viewer: Viewer, id: string): Promise<void> {
  const opportunity = await db().opportunity.findFirstOrThrow({
    where: { id: BigInt(id) },
    select: { owner_id: true, unit_id: true },
  });
  assertCanWrite(viewer, {
    ownerId: opportunity.owner_id.toString(),
    unitId: opportunity.unit_id.toString(),
  });
}

export async function assertCanWriteLead(viewer: Viewer, id: string): Promise<void> {
  const lead = await db().lead.findFirstOrThrow({
    where: { id: BigInt(id) },
    select: { owner_id: true, unit_id: true },
  });
  assertCanWrite(viewer, { ownerId: lead.owner_id.toString(), unitId: lead.unit_id.toString() });
}
