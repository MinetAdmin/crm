import { db } from "./db";
import { writeAudit } from "./audit";
import { checkClosure, checkStageMove, type RuleViolation } from "./opportunity-rules";

export class RuleError extends Error {
  constructor(readonly violations: RuleViolation[]) {
    super(violations.map((v) => `${v.rule}: ${v.message}`).join(" "));
    this.name = "RuleError";
  }
}

export type OpportunityRow = {
  id: string;
  name: string;
  account: { id: string; name: string };
  stage: string;
  stageCode: string;
  outcome: string;
  probability: number;
  owner: { id: string; name: string };
  expected: number;
  weighted: number;
  lastMovement: string | null;
  expectedCloseDate: string;
};

type WeightedRow = { opportunity_id: bigint; expected: string; weighted: string };

async function weightedByOpportunity(): Promise<Map<string, { expected: number; weighted: number }>> {
  const rows = await db().$queryRaw<WeightedRow[]>`
    SELECT opportunity_id,
           COALESCE(SUM(expected_amount), 0)::text AS expected,
           COALESCE(SUM(weighted_amount), 0)::text AS weighted
    FROM v_schedule_line_weighted
    GROUP BY opportunity_id`;
  return new Map(
    rows.map((r) => [
      r.opportunity_id.toString(),
      { expected: Number(r.expected), weighted: Number(r.weighted) },
    ]),
  );
}

async function lastMoveByOpportunity(): Promise<Map<string, Date>> {
  const rows = await db().$queryRaw<{ opportunity_id: bigint; last_move: Date }[]>`
    SELECT opportunity_id, MAX(changed_at) AS last_move
    FROM stage_history
    GROUP BY opportunity_id`;
  return new Map(rows.map((r) => [r.opportunity_id.toString(), r.last_move]));
}

export const OPPORTUNITY_LIST_CAP = 200;

export type OpportunityFilters = { search?: string; outcome?: string; stageId?: string };

export async function listOpportunities(
  filters: OpportunityFilters = {},
): Promise<OpportunityRow[]> {
  const [rows, money, moves] = await Promise.all([
    db().opportunity.findMany({
      where: {
        archived_at: null,
        ...(filters.outcome ? { outcome: filters.outcome as never } : {}),
        ...(filters.stageId ? { stage_id: BigInt(filters.stageId) } : {}),
        ...(filters.search
          ? { name: { contains: filters.search, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: { expected_close_date: "asc" },
      take: OPPORTUNITY_LIST_CAP,
      include: {
        account: { select: { id: true, name: true } },
        pipeline_stage: { select: { code: true, name: true } },
        app_user_opportunity_owner_idToapp_user: { select: { id: true, full_name: true } },
      },
    }),
    weightedByOpportunity(),
    lastMoveByOpportunity(),
  ]);

  return rows.map((row) => {
    const id = row.id.toString();
    const totals = money.get(id);
    return {
      id,
      name: row.name,
      account: { id: row.account.id.toString(), name: row.account.name },
      stage: row.pipeline_stage.name,
      stageCode: row.pipeline_stage.code,
      outcome: row.outcome,
      probability: Number(row.probability),
      owner: {
        id: row.app_user_opportunity_owner_idToapp_user.id.toString(),
        name: row.app_user_opportunity_owner_idToapp_user.full_name,
      },
      expected: totals?.expected ?? 0,
      weighted: totals?.weighted ?? 0,
      lastMovement: moves.get(id)?.toISOString().slice(0, 10) ?? null,
      expectedCloseDate: row.expected_close_date.toISOString().slice(0, 10),
    };
  });
}

export async function getOpportunity(id: string) {
  return db().opportunity.findFirst({
    where: { id: BigInt(id), archived_at: null },
    include: {
      account: { select: { id: true, name: true } },
      pipeline_stage: true,
      sector: { select: { code: true } },
      unit: { select: { code: true } },
      app_user_opportunity_owner_idToapp_user: { select: { full_name: true } },
      revenue_schedule_line: {
        where: { archived_at: null },
        orderBy: { effective_month: "asc" },
        include: { product: { select: { name: true } } },
      },
      stage_history: {
        orderBy: { changed_at: "desc" },
        include: {
          pipeline_stage_stage_history_to_stage_idTopipeline_stage: { select: { name: true } },
          pipeline_stage_stage_history_from_stage_idTopipeline_stage: { select: { name: true } },
          app_user: { select: { full_name: true } },
        },
      },
    },
  });
}

/**
 * The only path a stage change may take. Applies the stage default
 * probability unless overridden with a note, writes the stage_history row and
 * the audit entry, and refuses a move the rules reject.
 */
export async function changeStage(
  input: { opportunityId: string; toStageId: string; probability?: number; note?: string },
  actorId: bigint,
): Promise<void> {
  const [opportunity, toStage, lineCount] = await Promise.all([
    db().opportunity.findFirstOrThrow({
      where: { id: BigInt(input.opportunityId), archived_at: null },
      include: { pipeline_stage: true },
    }),
    db().pipeline_stage.findUniqueOrThrow({ where: { id: BigInt(input.toStageId) } }),
    db().revenue_schedule_line.count({
      where: { opportunity_id: BigInt(input.opportunityId), archived_at: null },
    }),
  ]);

  const defaultProbability = Number(toStage.default_probability);
  const probability = input.probability ?? defaultProbability;
  const note = input.note?.trim() || null;

  const violations = checkStageMove({
    toSortOrder: toStage.sort_order,
    scheduleLineCount: lineCount,
    defaultProbability,
    probability,
    overrideNote: note,
  });
  if (violations.length > 0) throw new RuleError(violations);

  await db().$transaction(async (tx) => {
    await tx.opportunity.update({
      where: { id: opportunity.id },
      data: {
        stage_id: toStage.id,
        probability,
        probability_override_note: probability === defaultProbability ? null : note,
        stage_entered_at: new Date(),
        updated_by: actorId,
        updated_at: new Date(),
      },
    });
    await tx.stage_history.create({
      data: {
        opportunity_id: opportunity.id,
        from_stage_id: opportunity.stage_id,
        to_stage_id: toStage.id,
        changed_by: actorId,
      },
    });
    await writeAudit(tx, {
      entity: "opportunity",
      entityId: opportunity.id,
      changedBy: actorId,
      changes: [
        {
          field: "stage_id",
          oldValue: opportunity.pipeline_stage.code,
          newValue: toStage.code,
        },
        {
          field: "probability",
          oldValue: opportunity.probability.toString(),
          newValue: String(probability),
        },
      ],
    });
  });
}

export async function addScheduleLine(
  input: {
    opportunityId: string;
    productId: string;
    effectiveMonth: string;
    expectedAmount: number;
    revenueType: string;
  },
  actorId: bigint,
): Promise<void> {
  await db().$transaction(async (tx) => {
    const line = await tx.revenue_schedule_line.create({
      data: {
        opportunity_id: BigInt(input.opportunityId),
        product_id: BigInt(input.productId),
        effective_month: new Date(`${input.effectiveMonth}-01T00:00:00Z`),
        expected_amount: input.expectedAmount,
        revenue_type: input.revenueType as never,
      },
    });
    await writeAudit(tx, {
      entity: "revenue_schedule_line",
      entityId: line.id,
      changedBy: actorId,
      changes: [
        { field: "opportunity_id", oldValue: null, newValue: input.opportunityId },
        { field: "expected_amount", oldValue: null, newValue: String(input.expectedAmount) },
        { field: "effective_month", oldValue: null, newValue: input.effectiveMonth },
      ],
    });
  });
}

export async function closeOpportunity(
  input: {
    opportunityId: string;
    outcome: "won" | "lost" | "on_hold" | "withdrawn";
    reasonId?: string;
  },
  actorId: bigint,
): Promise<void> {
  const violations = checkClosure({ outcome: input.outcome, reasonId: input.reasonId ?? null });
  if (violations.length > 0) throw new RuleError(violations);

  const opportunity = await db().opportunity.findFirstOrThrow({
    where: { id: BigInt(input.opportunityId), archived_at: null },
  });

  await db().$transaction(async (tx) => {
    await tx.opportunity.update({
      where: { id: opportunity.id },
      data: {
        outcome: input.outcome,
        loss_reason_id:
          input.outcome === "lost" && input.reasonId ? BigInt(input.reasonId) : null,
        hold_reason_id:
          input.outcome === "on_hold" && input.reasonId ? BigInt(input.reasonId) : null,
        updated_by: actorId,
        updated_at: new Date(),
      },
    });
    await writeAudit(tx, {
      entity: "opportunity",
      entityId: opportunity.id,
      changedBy: actorId,
      changes: [
        { field: "outcome", oldValue: opportunity.outcome, newValue: input.outcome },
      ],
    });
  });
}

/** Totals for one opportunity, read from the same view the reports use. */
export async function opportunityTotals(id: string): Promise<{ expected: number; weighted: number }> {
  const rows = await db().$queryRaw<{ expected: string; weighted: string }[]>`
    SELECT COALESCE(SUM(expected_amount), 0)::text AS expected,
           COALESCE(SUM(weighted_amount), 0)::text AS weighted
    FROM v_schedule_line_weighted
    WHERE opportunity_id = ${BigInt(id)}`;
  return { expected: Number(rows[0]?.expected ?? 0), weighted: Number(rows[0]?.weighted ?? 0) };
}
