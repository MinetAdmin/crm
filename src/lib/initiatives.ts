import { db } from "./db";
import { writeAudit } from "./audit";

export type InitiativeRow = {
  id: string;
  name: string;
  unit: string;
  sector: string;
  champion: string;
  status: string;
  target: number;
  delivered: number;
  weightedExpected: number;
  gap: number;
};

type RollupRow = {
  initiative_id: bigint;
  annual_target: string;
  revenue_delivered: string;
  weighted_expected: string;
  gap_to_target: string;
};

/** Target, delivered, expected and gap, read from v_initiative_rollup. */
async function rollups(): Promise<Map<string, RollupRow>> {
  const rows = await db().$queryRaw<RollupRow[]>`
    SELECT initiative_id,
           annual_target::text,
           revenue_delivered::text,
           weighted_expected::text,
           gap_to_target::text
    FROM v_initiative_rollup`;
  return new Map(rows.map((r) => [r.initiative_id.toString(), r]));
}

export async function listInitiatives(): Promise<InitiativeRow[]> {
  const [rows, byId] = await Promise.all([
    db().strategic_initiative.findMany({
      where: { archived_at: null },
      orderBy: { name: "asc" },
      include: {
        unit: { select: { code: true } },
        sector: { select: { code: true } },
        app_user: { select: { full_name: true } },
        ref_value: { select: { label: true } },
      },
    }),
    rollups(),
  ]);

  return rows.map((row) => {
    const rollup = byId.get(row.id.toString());
    return {
      id: row.id.toString(),
      name: row.name,
      unit: row.unit.code,
      sector: row.sector.code,
      champion: row.app_user.full_name,
      status: row.ref_value.label,
      target: Number(row.annual_target),
      delivered: Number(rollup?.revenue_delivered ?? 0),
      weightedExpected: Number(rollup?.weighted_expected ?? 0),
      gap: Number(rollup?.gap_to_target ?? row.annual_target),
    };
  });
}

export async function getInitiative(id: string) {
  return db().strategic_initiative.findFirst({
    where: { id: BigInt(id), archived_at: null },
    include: {
      unit: { select: { code: true, name: true } },
      sector: { select: { code: true } },
      app_user: { select: { full_name: true } },
      ref_value: { select: { label: true } },
      initiative_note: {
        orderBy: { created_at: "desc" },
        include: { app_user: { select: { full_name: true } } },
      },
      opportunity: {
        where: { archived_at: null },
        orderBy: { expected_close_date: "asc" },
        include: { account: { select: { name: true } }, pipeline_stage: { select: { name: true } } },
      },
    },
  });
}

export async function initiativeRollup(id: string) {
  const rows = await db().$queryRaw<RollupRow[]>`
    SELECT initiative_id, annual_target::text, revenue_delivered::text,
           weighted_expected::text, gap_to_target::text
    FROM v_initiative_rollup WHERE initiative_id = ${BigInt(id)}`;
  const row = rows[0];
  return {
    target: Number(row?.annual_target ?? 0),
    delivered: Number(row?.revenue_delivered ?? 0),
    weightedExpected: Number(row?.weighted_expected ?? 0),
    gap: Number(row?.gap_to_target ?? 0),
  };
}

export type NewInitiative = {
  name: string;
  unitId: string;
  sectorId: string;
  championId: string;
  statusId: string;
  annualTarget: number;
  targetYear: number;
};

export async function createInitiative(input: NewInitiative, actorId: bigint): Promise<bigint> {
  return db().$transaction(async (tx) => {
    const initiative = await tx.strategic_initiative.create({
      data: {
        name: input.name.trim(),
        unit_id: BigInt(input.unitId),
        sector_id: BigInt(input.sectorId),
        champion_id: BigInt(input.championId),
        status_id: BigInt(input.statusId),
        annual_target: input.annualTarget,
        target_year: input.targetYear,
      },
    });
    await writeAudit(tx, {
      entity: "strategic_initiative",
      entityId: initiative.id,
      changedBy: actorId,
      changes: [
        { field: "name", oldValue: null, newValue: initiative.name },
        { field: "annual_target", oldValue: null, newValue: String(input.annualTarget) },
      ],
    });
    return initiative.id;
  });
}

/** Evidence notes are append-only, with author and time kept. */
export async function addInitiativeNote(
  input: { initiativeId: string; body: string },
  actorId: bigint,
): Promise<void> {
  await db().initiative_note.create({
    data: {
      initiative_id: BigInt(input.initiativeId),
      author_id: actorId,
      body: input.body.trim(),
    },
  });
}

/** Links an opportunity to an initiative, so the rollup includes it. */
export async function linkOpportunity(
  input: { opportunityId: string; initiativeId: string | null },
  actorId: bigint,
): Promise<void> {
  const opportunity = await db().opportunity.findFirstOrThrow({
    where: { id: BigInt(input.opportunityId) },
  });
  await db().$transaction(async (tx) => {
    await tx.opportunity.update({
      where: { id: opportunity.id },
      data: {
        initiative_id: input.initiativeId ? BigInt(input.initiativeId) : null,
        updated_by: actorId,
        updated_at: new Date(),
      },
    });
    await writeAudit(tx, {
      entity: "opportunity",
      entityId: opportunity.id,
      changedBy: actorId,
      changes: [
        {
          field: "initiative_id",
          oldValue: opportunity.initiative_id?.toString() ?? null,
          newValue: input.initiativeId,
        },
      ],
    });
  });
}
