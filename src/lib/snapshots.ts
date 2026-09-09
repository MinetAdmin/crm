import { db } from "./db";
import { decomposeMovement, type Movement, type SnapshotLine } from "./movement";

export type SnapshotSummary = {
  id: string;
  month: string;
  takenAt: Date;
  lines: number;
  weighted: number;
};

export async function listSnapshots(): Promise<SnapshotSummary[]> {
  const rows = await db().$queryRaw<
    { id: bigint; snapshot_month: Date; taken_at: Date; lines: number; weighted: string }[]
  >`
    SELECT s.id, s.snapshot_month, s.taken_at,
           COUNT(l.id)::int AS lines,
           COALESCE(SUM(CASE WHEN l.outcome = 'open' THEN l.weighted_amount END), 0)::text AS weighted
    FROM forecast_snapshot s
    LEFT JOIN forecast_snapshot_line l ON l.snapshot_id = s.id
    GROUP BY s.id, s.snapshot_month, s.taken_at
    ORDER BY s.snapshot_month DESC`;

  return rows.map((r) => ({
    id: r.id.toString(),
    month: r.snapshot_month.toISOString().slice(0, 7),
    takenAt: r.taken_at,
    lines: r.lines,
    weighted: Number(r.weighted),
  }));
}

/**
 * Freezes the book for a month. Values are copied rather than referenced, so a
 * later edit cannot change what a snapshot says. Taking the same month twice
 * is refused.
 */
export async function takeSnapshot(month: string, actorId: bigint | null): Promise<string> {
  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const existing = await db().forecast_snapshot.findUnique({
    where: { snapshot_month: monthStart },
  });
  if (existing) throw new Error(`A snapshot for ${month} already exists.`);

  return db().$transaction(async (tx) => {
    const snapshot = await tx.forecast_snapshot.create({
      data: { snapshot_month: monthStart, taken_by: actorId },
    });

    await tx.$executeRaw`
      INSERT INTO forecast_snapshot_line (
        snapshot_id, opportunity_id, schedule_line_id, account_name, owner_id,
        unit_code, sector_code, initiative_id, stage_code, outcome, product_code,
        effective_month, expected_amount, probability, weighted_amount, expected_close_date)
      SELECT ${snapshot.id}, o.id, w.id, a.name, o.owner_id, u.code, sec.code,
             o.initiative_id, st.code, o.outcome, p.code, w.effective_month,
             w.expected_amount, w.effective_probability, w.weighted_amount,
             o.expected_close_date
      FROM opportunity o
      JOIN account a ON a.id = o.account_id
      JOIN unit u ON u.id = o.unit_id
      JOIN sector sec ON sec.id = o.sector_id
      JOIN pipeline_stage st ON st.id = o.stage_id
      LEFT JOIN v_schedule_line_weighted w ON w.opportunity_id = o.id
      LEFT JOIN product p ON p.id = w.product_id
      WHERE o.archived_at IS NULL`;

    return snapshot.id.toString();
  });
}

async function linesOf(snapshotId: string): Promise<SnapshotLine[]> {
  const rows = await db().forecast_snapshot_line.findMany({
    where: { snapshot_id: BigInt(snapshotId) },
  });
  return rows.map((r) => ({
    opportunityId: r.opportunity_id.toString(),
    scheduleLineId: r.schedule_line_id?.toString() ?? null,
    outcome: r.outcome,
    effectiveMonth: r.effective_month?.toISOString().slice(0, 7) ?? null,
    expected: Number(r.expected_amount ?? 0),
    probability: Number(r.probability ?? 0),
    weighted: Number(r.weighted_amount ?? 0),
  }));
}

/** The movement report: two snapshots differenced into the doc 08 §3 buckets. */
export async function movementBetween(
  openingId: string,
  closingId: string,
): Promise<Movement> {
  const [opening, closing] = await Promise.all([linesOf(openingId), linesOf(closingId)]);
  return decomposeMovement(opening, closing);
}
