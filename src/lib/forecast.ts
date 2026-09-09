import { db } from "./db";
import { coverageRatio } from "./target-rules";

async function setting(key: string, fallback: number): Promise<number> {
  const row = await db().system_setting.findUnique({ where: { key } });
  const value = Number(row?.value);
  return Number.isFinite(value) ? value : fallback;
}

export type ForecastBases = {
  won: number;
  committed: number;
  weighted: number;
  bestCase: number;
  threshold: number;
};

/**
 * The forecast bases of doc 08 §1, each a grouping of the same schedule lines.
 * Won uses the actual amount where one has been recorded.
 */
export async function forecastBases(year?: number): Promise<ForecastBases> {
  const threshold = await setting("committed_threshold_pct", 50);
  const from = year ? new Date(Date.UTC(year, 0, 1)) : null;
  const to = year ? new Date(Date.UTC(year + 1, 0, 1)) : null;

  const rows = await db().$queryRaw<
    { won: string; committed_open: string; weighted: string; best_case: string }[]
  >`
    SELECT
      COALESCE(SUM(CASE WHEN outcome = 'won'
                        THEN COALESCE(actual_amount, expected_amount) END), 0)::text AS won,
      COALESCE(SUM(CASE WHEN outcome = 'open' AND effective_probability >= ${threshold}
                        THEN expected_amount END), 0)::text AS committed_open,
      COALESCE(SUM(CASE WHEN outcome = 'open' THEN weighted_amount END), 0)::text AS weighted,
      COALESCE(SUM(CASE WHEN outcome = 'open' THEN expected_amount END), 0)::text AS best_case
    FROM v_schedule_line_weighted
    WHERE (${from}::timestamptz IS NULL OR effective_month >= ${from}::date)
      AND (${to}::timestamptz IS NULL OR effective_month < ${to}::date)`;

  const row = rows[0];
  const won = Number(row?.won ?? 0);
  return {
    won,
    committed: won + Number(row?.committed_open ?? 0),
    weighted: Number(row?.weighted ?? 0),
    bestCase: Number(row?.best_case ?? 0),
    threshold,
  };
}

export type MonthRow = { month: string; weighted: number; expected: number; committed: number };

/** Weighted pipeline phased by the effective month on each schedule line. */
export async function forecastByMonth(year?: number): Promise<MonthRow[]> {
  const threshold = await setting("committed_threshold_pct", 50);
  const rows = await db().$queryRaw<
    { month: Date; weighted: string; expected: string; committed: string }[]
  >`
    SELECT date_trunc('month', effective_month)::date AS month,
           COALESCE(SUM(weighted_amount), 0)::text AS weighted,
           COALESCE(SUM(expected_amount), 0)::text AS expected,
           COALESCE(SUM(CASE WHEN effective_probability >= ${threshold}
                             THEN expected_amount END), 0)::text AS committed
    FROM v_schedule_line_weighted
    WHERE outcome = 'open'
      AND (${year ?? null}::int IS NULL OR extract(year FROM effective_month) = ${year ?? null}::int)
    GROUP BY 1
    ORDER BY 1`;

  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    weighted: Number(r.weighted),
    expected: Number(r.expected),
    committed: Number(r.committed),
  }));
}

export type StageRow = { stage: string; sortOrder: number; count: number; weighted: number };

export async function pipelineByStage(): Promise<StageRow[]> {
  const rows = await db().$queryRaw<
    { stage: string; sort_order: number; count: number; weighted: string }[]
  >`
    SELECT s.name AS stage, s.sort_order, COUNT(DISTINCT o.id)::int AS count,
           COALESCE(SUM(w.weighted_amount), 0)::text AS weighted
    FROM opportunity o
    JOIN pipeline_stage s ON s.id = o.stage_id
    LEFT JOIN v_schedule_line_weighted w ON w.opportunity_id = o.id
    WHERE o.outcome = 'open' AND o.archived_at IS NULL
    GROUP BY s.name, s.sort_order
    ORDER BY s.sort_order`;
  return rows.map((r) => ({
    stage: r.stage,
    sortOrder: r.sort_order,
    count: r.count,
    weighted: Number(r.weighted),
  }));
}

export type GapRow = {
  label: string;
  target: number;
  won: number;
  weighted: number;
  gap: number;
  coverage: number | null;
};

/** Gap to target by unit, with coverage against what is still to be found. */
export async function gapByUnit(year: number): Promise<GapRow[]> {
  const rows = await db().$queryRaw<
    { label: string; target: string; won: string; weighted: string; open_pipeline: string }[]
  >`
    SELECT u.code AS label,
           COALESCE(MAX(t.amount), 0)::text AS target,
           COALESCE(SUM(CASE WHEN w.outcome = 'won'
                             THEN COALESCE(w.actual_amount, w.expected_amount) END), 0)::text AS won,
           COALESCE(SUM(CASE WHEN w.outcome = 'open' THEN w.weighted_amount END), 0)::text AS weighted,
           COALESCE(SUM(CASE WHEN w.outcome = 'open' THEN w.expected_amount END), 0)::text AS open_pipeline
    FROM unit u
    LEFT JOIN target t ON t.unit_id = u.id AND t.level = 'unit'
                      AND t.target_year = ${year} AND t.superseded_by IS NULL
    LEFT JOIN v_schedule_line_weighted w ON w.unit_id = u.id
    WHERE u.active
    GROUP BY u.code
    ORDER BY u.code`;

  return rows.map((r) => {
    const target = Number(r.target);
    const won = Number(r.won);
    const weighted = Number(r.weighted);
    return {
      label: r.label,
      target,
      won,
      weighted,
      gap: target - won - weighted,
      coverage: coverageRatio(Number(r.open_pipeline), target, won),
    };
  });
}
