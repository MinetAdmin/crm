import { db } from "./db";
import { canSeeWorkloadOf, type Viewer } from "./visibility";

export type WorkloadRow = {
  ownerId: string;
  owner: string;
  unitId: string | null;
  openCount: number;
  weightedHeld: number;
  effortWeighted: number;
  initiativesChampioned: number;
  initiativeGap: number;
  medianDaysInStage: number | null;
  advancesThisMonth: number;
  actionsOverdue: number;
  accountsTouched: number;
  blocked: number;
  capacity: number | null;
  availability: number;
};

const WEIGHTS: Record<string, number> = { light: 1, standard: 2, complex: 4 };

/**
 * The ten signals of doc 08 §5, per accountable owner. Co-owners are excluded
 * from load, since load cannot be attributed to two people at once.
 */
export async function workload(): Promise<WorkloadRow[]> {
  const rows = await db().$queryRaw<
    {
      owner_id: bigint;
      owner: string;
      unit_id: bigint | null;
      open_count: number;
      weighted_held: string;
      light: number;
      standard: number;
      complex: number;
      accounts_touched: number;
      blocked: number;
      capacity_pursuits: number | null;
      availability_pct: string;
      median_days: string | null;
      advances: number;
      actions_overdue: number;
      initiatives: number;
      initiative_gap: string;
    }[]
  >`
    WITH open_opps AS (
      SELECT o.* FROM opportunity o WHERE o.outcome = 'open' AND o.archived_at IS NULL
    )
    SELECT u.id AS owner_id, u.full_name AS owner, u.unit_id,
           u.capacity_pursuits, u.availability_pct::text,
           COUNT(DISTINCT o.id)::int AS open_count,
           COALESCE((SELECT SUM(w.weighted_amount) FROM v_schedule_line_weighted w
                     JOIN open_opps oo ON oo.id = w.opportunity_id
                     WHERE oo.owner_id = u.id), 0)::text AS weighted_held,
           COUNT(DISTINCT CASE WHEN o.complexity = 'light' THEN o.id END)::int AS light,
           COUNT(DISTINCT CASE WHEN o.complexity = 'standard' THEN o.id END)::int AS standard,
           COUNT(DISTINCT CASE WHEN o.complexity = 'complex' THEN o.id END)::int AS complex,
           COUNT(DISTINCT o.account_id)::int AS accounts_touched,
           COUNT(DISTINCT CASE WHEN COALESCE(o.key_blocker, '') <> '' THEN o.id END)::int AS blocked,
           (SELECT percentile_cont(0.5) WITHIN GROUP (
                     ORDER BY EXTRACT(EPOCH FROM (now() - oo.stage_entered_at)) / 86400)::text
            FROM open_opps oo WHERE oo.owner_id = u.id) AS median_days,
           (SELECT COUNT(*)::int FROM stage_history sh
            JOIN pipeline_stage fs ON fs.id = sh.from_stage_id
            JOIN pipeline_stage ts ON ts.id = sh.to_stage_id
            WHERE sh.changed_by = u.id AND NOT sh.backfilled
              AND ts.sort_order > fs.sort_order
              AND sh.changed_at >= date_trunc('month', now())) AS advances,
           (SELECT COUNT(*)::int FROM activity a
            WHERE a.owner_id = u.id AND a.completed_at IS NULL
              AND a.due_date < CURRENT_DATE) AS actions_overdue,
           (SELECT COUNT(*)::int FROM strategic_initiative si
            WHERE si.champion_id = u.id AND si.archived_at IS NULL) AS initiatives,
           COALESCE((SELECT SUM(r.gap_to_target) FROM v_initiative_rollup r
                     JOIN strategic_initiative si ON si.id = r.initiative_id
                     WHERE si.champion_id = u.id), 0)::text AS initiative_gap
    FROM app_user u
    LEFT JOIN open_opps o ON o.owner_id = u.id
    WHERE u.active
    GROUP BY u.id, u.full_name, u.unit_id, u.capacity_pursuits, u.availability_pct
    ORDER BY u.full_name`;

  return rows.map((r) => ({
    ownerId: r.owner_id.toString(),
    owner: r.owner,
    unitId: r.unit_id?.toString() ?? null,
    openCount: r.open_count,
    weightedHeld: Number(r.weighted_held),
    effortWeighted:
      r.light * WEIGHTS.light + r.standard * WEIGHTS.standard + r.complex * WEIGHTS.complex,
    initiativesChampioned: r.initiatives,
    initiativeGap: Number(r.initiative_gap),
    medianDaysInStage: r.median_days === null ? null : Math.round(Number(r.median_days)),
    advancesThisMonth: r.advances,
    actionsOverdue: r.actions_overdue,
    accountsTouched: r.accounts_touched,
    blocked: r.blocked,
    capacity: r.capacity_pursuits,
    availability: Number(r.availability_pct),
  }));
}

/** Applies D-12: a person sees their own row, a unit head sees their unit. */
export function visibleTo(viewer: Viewer, rows: ReadonlyArray<WorkloadRow>): WorkloadRow[] {
  return rows.filter((row) =>
    canSeeWorkloadOf(viewer, { ownerId: row.ownerId, unitId: row.unitId }),
  );
}

export type Unowned = { id: string; name: string; weighted: number };

/** Open pursuits with no accountable owner, which should stay at zero. */
export async function unownedQueue(): Promise<Unowned[]> {
  const rows = await db().$queryRaw<{ id: bigint; name: string; weighted: string }[]>`
    SELECT o.id, o.name, COALESCE(SUM(w.weighted_amount), 0)::text AS weighted
    FROM opportunity o
    LEFT JOIN v_schedule_line_weighted w ON w.opportunity_id = o.id
    LEFT JOIN app_user u ON u.id = o.owner_id AND u.active
    WHERE o.outcome = 'open' AND o.archived_at IS NULL AND u.id IS NULL
    GROUP BY o.id, o.name`;
  return rows.map((r) => ({ id: r.id.toString(), name: r.name, weighted: Number(r.weighted) }));
}

/** Share of committed value held by the largest owner (FR-RPT-13). */
export async function concentration(): Promise<{ share: number | null; owner: string | null }> {
  const rows = await db().$queryRaw<{ owner: string; committed: string }[]>`
    SELECT u.full_name AS owner, COALESCE(SUM(w.expected_amount), 0)::text AS committed
    FROM v_schedule_line_weighted w
    JOIN app_user u ON u.id = w.owner_id
    WHERE w.outcome = 'open'
      AND w.effective_probability >= (SELECT value::numeric FROM system_setting WHERE key = 'committed_threshold_pct')
    GROUP BY u.full_name
    ORDER BY 2 DESC`;
  const total = rows.reduce((sum, r) => sum + Number(r.committed), 0);
  if (total === 0 || rows.length === 0) return { share: null, owner: null };
  return { share: (Number(rows[0].committed) / total) * 100, owner: rows[0].owner };
}
