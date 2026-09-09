import { db } from "./db";

export type DashboardSummary = {
  openPursuits: number;
  weightedPipeline: number;
  exceptions: number;
  tendersDue: number;
};

/** Counts for the dashboard tiles, read from the reporting views (doc 08). */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [openPursuits, weighted, exceptions, tenders] = await Promise.all([
    db().opportunity.count({ where: { outcome: "open", archived_at: null } }),
    db().$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM(weighted_amount), 0)::text AS total
      FROM v_schedule_line_weighted
      WHERE outcome = 'open'`,
    db().$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM v_opportunity_hygiene
      WHERE is_stale OR missing_next_action OR overdue_next_action
         OR close_date_past OR missing_schedule_lines`,
    db().$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM tender
      WHERE archived_at IS NULL
        AND submission_deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
        AND status IN ('to_submit', 'submitted', 'in_evaluation')`,
  ]);

  return {
    openPursuits,
    weightedPipeline: Number(weighted[0]?.total ?? 0),
    exceptions: exceptions[0]?.count ?? 0,
    tendersDue: tenders[0]?.count ?? 0,
  };
}

export type SnapshotBaseline = {
  month: string;
  openPursuits: number;
  weightedPipeline: number;
};

/** The latest month-end snapshot reduced to the two dashboard figures. */
export async function lastSnapshotBaseline(): Promise<SnapshotBaseline | null> {
  const rows = await db().$queryRaw<
    { snapshot_month: Date; open_pursuits: number; weighted: string }[]
  >`
    SELECT s.snapshot_month,
           COUNT(DISTINCT l.opportunity_id) FILTER (WHERE l.outcome = 'open')::int AS open_pursuits,
           COALESCE(SUM(l.weighted_amount) FILTER (WHERE l.outcome = 'open'), 0)::text AS weighted
    FROM forecast_snapshot s
    JOIN forecast_snapshot_line l ON l.snapshot_id = s.id
    WHERE s.snapshot_month = (SELECT MAX(snapshot_month) FROM forecast_snapshot)
    GROUP BY s.snapshot_month`;
  const row = rows[0];
  if (!row) return null;
  return {
    month: row.snapshot_month.toISOString().slice(0, 7),
    openPursuits: row.open_pursuits,
    weightedPipeline: Number(row.weighted),
  };
}

/** Won share of decided pursuits, by count. Null until anything is decided. */
export async function wonRateAllTime(): Promise<number | null> {
  const rows = await db().$queryRaw<{ won: number; decided: number }[]>`
    SELECT COUNT(*) FILTER (WHERE outcome = 'won')::int AS won,
           COUNT(*) FILTER (WHERE outcome IN ('won', 'lost'))::int AS decided
    FROM opportunity
    WHERE archived_at IS NULL`;
  const row = rows[0];
  if (!row || row.decided === 0) return null;
  return row.won / row.decided;
}
