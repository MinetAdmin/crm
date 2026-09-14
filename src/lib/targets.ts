import { db } from "./db";
import { writeAudit } from "./audit";
import { phasingBalances, reconcile, type Reconciliation } from "./target-rules";

export class TargetRuleError extends Error {}

export type TargetRow = {
  id: string;
  level: string;
  label: string;
  amount: number;
  phased: boolean;
  version: number;
};

export async function listTargets(year: number): Promise<TargetRow[]> {
  const rows = await db().target.findMany({
    where: { target_year: year, superseded_by: null },
    orderBy: [{ level: "asc" }, { id: "asc" }],
    include: {
      unit: { select: { code: true } },
      app_user_target_owner_idToapp_user: { select: { full_name: true } },
      strategic_initiative: { select: { name: true } },
      target_phasing: { select: { amount: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id.toString(),
    level: row.level,
    label:
      row.unit?.code ??
      row.app_user_target_owner_idToapp_user?.full_name ??
      row.strategic_initiative?.name ??
      "Company",
    amount: Number(row.amount),
    phased: row.target_phasing.length > 0,
    version: row.version,
  }));
}

export async function companyTarget(year: number): Promise<number> {
  const row = await db().target.findFirst({
    where: { target_year: year, level: "company", superseded_by: null },
  });
  return row ? Number(row.amount) : 0;
}

export async function unitReconciliation(year: number): Promise<Reconciliation> {
  const [company, units] = await Promise.all([
    companyTarget(year),
    db().target.findMany({
      where: { target_year: year, level: "unit", superseded_by: null },
      include: { unit: { select: { code: true } } },
    }),
  ]);
  return reconcile(
    company,
    units.map((u) => ({ label: u.unit?.code ?? "unit", amount: Number(u.amount) })),
  );
}

export type NewTarget = {
  year: number;
  level: "company" | "unit" | "owner" | "initiative";
  unitId?: string;
  ownerId?: string;
  initiativeId?: string;
  amount: number;
  months?: number[];
};

/**
 * Saves a target. A unit target is refused when the set would no longer add up
 * to the company target (BR-TGT-01), and a phasing must add up to its annual
 * figure.
 */
export async function setTarget(input: NewTarget, actorId: bigint): Promise<bigint> {
  if (input.months && !phasingBalances(input.amount, input.months)) {
    throw new TargetRuleError("The monthly phasing has to add up to the annual figure.");
  }

  if (input.level === "unit") {
    const [company, existing] = await Promise.all([
      companyTarget(input.year),
      db().target.findMany({
        where: { target_year: input.year, level: "unit", superseded_by: null },
        include: { unit: { select: { code: true } } },
      }),
    ]);
    if (company > 0) {
      const others = existing
        .filter((t) => t.unit_id?.toString() !== input.unitId)
        .map((t) => ({ label: t.unit?.code ?? "unit", amount: Number(t.amount) }));
      const check = reconcile(company, [...others, { label: "new", amount: input.amount }]);
      if (check.remainder < -0.005) {
        throw new TargetRuleError(
          `Unit targets would exceed the company target by ${Math.abs(check.remainder)}.`,
        );
      }
    }
  }

  return db().$transaction(async (tx) => {
    const target = await tx.target.create({
      data: {
        target_year: input.year,
        level: input.level,
        unit_id: input.unitId ? BigInt(input.unitId) : null,
        owner_id: input.ownerId ? BigInt(input.ownerId) : null,
        initiative_id: input.initiativeId ? BigInt(input.initiativeId) : null,
        amount: input.amount,
      },
    });

    if (input.months) {
      await tx.target_phasing.createMany({
        data: input.months.map((amount, index) => ({
          target_id: target.id,
          month: new Date(Date.UTC(input.year, index, 1)),
          amount,
        })),
      });
    }

    await writeAudit(tx, {
      entity: "target",
      entityId: target.id,
      changedBy: actorId,
      changes: [
        { field: "level", oldValue: null, newValue: input.level },
        { field: "amount", oldValue: null, newValue: String(input.amount) },
        { field: "target_year", oldValue: null, newValue: String(input.year) },
      ],
    });
    return target.id;
  });
}

/** A revision supersedes rather than overwrites, so the original stays readable. */
export async function reviseTarget(
  input: { targetId: string; amount: number },
  actorId: bigint,
): Promise<void> {
  const original = await db().target.findFirstOrThrow({ where: { id: BigInt(input.targetId) } });

  await db().$transaction(async (tx) => {
    const revision = await tx.target.create({
      data: {
        target_year: original.target_year,
        level: original.level,
        unit_id: original.unit_id,
        owner_id: original.owner_id,
        initiative_id: original.initiative_id,
        product_id: original.product_id,
        amount: input.amount,
        version: original.version + 1,
      },
    });
    await tx.target.update({
      where: { id: original.id },
      data: { superseded_by: revision.id },
    });
    await writeAudit(tx, {
      entity: "target",
      entityId: revision.id,
      changedBy: actorId,
      changes: [
        { field: "amount", oldValue: original.amount.toString(), newValue: String(input.amount) },
        { field: "version", oldValue: String(original.version), newValue: String(revision.version) },
      ],
    });
  });
}
