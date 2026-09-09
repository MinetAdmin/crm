import { db } from "./db";
import { winRates } from "./tender-rules";

export type OwnerRow = {
  owner: string;
  open: number;
  weighted: number;
  won: number;
  winRateByCount: number | null;
  winRateByValue: number | null;
};

/** Owner performance. Win rate is always a pair, since count and value differ. */
export async function ownerPerformance(): Promise<OwnerRow[]> {
  const rows = await db().$queryRaw<
    { owner: string; open: number; weighted: string; won_value: string; won: number; lost: number; lost_value: string }[]
  >`
    SELECT u.full_name AS owner,
           COUNT(DISTINCT CASE WHEN o.outcome = 'open' THEN o.id END)::int AS open,
           COALESCE(SUM(CASE WHEN o.outcome = 'open' THEN w.weighted_amount END), 0)::text AS weighted,
           COALESCE(SUM(CASE WHEN o.outcome = 'won' THEN COALESCE(w.actual_amount, w.expected_amount) END), 0)::text AS won_value,
           COUNT(DISTINCT CASE WHEN o.outcome = 'won' THEN o.id END)::int AS won,
           COUNT(DISTINCT CASE WHEN o.outcome = 'lost' THEN o.id END)::int AS lost,
           COALESCE(SUM(CASE WHEN o.outcome = 'lost' THEN w.expected_amount END), 0)::text AS lost_value
    FROM app_user u
    LEFT JOIN opportunity o ON o.owner_id = u.id AND o.archived_at IS NULL
    LEFT JOIN v_schedule_line_weighted w ON w.opportunity_id = o.id
    WHERE u.active
    GROUP BY u.full_name
    ORDER BY u.full_name`;

  return rows.map((r) => {
    const decided = [
      ...Array.from({ length: r.won }, () => ({ won: true, amount: Number(r.won_value) / (r.won || 1) })),
      ...Array.from({ length: r.lost }, () => ({ won: false, amount: Number(r.lost_value) / (r.lost || 1) })),
    ];
    const rates = winRates(decided);
    return {
      owner: r.owner,
      open: r.open,
      weighted: Number(r.weighted),
      won: Number(r.won_value),
      winRateByCount: rates.byCount,
      winRateByValue: rates.byValue,
    };
  });
}

export type ExceptionRow = {
  id: string;
  name: string;
  owner: string;
  reasons: string[];
  /** Days since the pursuit last changed. */
  ageDays: number;
};

/** The hygiene feed of v_opportunity_hygiene (FR-RPT-12). */
export async function hygieneExceptions(): Promise<ExceptionRow[]> {
  const rows = await db().$queryRaw<
    {
      id: bigint;
      name: string;
      owner: string;
      is_stale: boolean;
      missing_next_action: boolean;
      overdue_next_action: boolean;
      close_date_past: boolean;
      missing_schedule_lines: boolean;
      age_days: number;
    }[]
  >`
    SELECT h.id, o.name, u.full_name AS owner, h.is_stale, h.missing_next_action,
           h.overdue_next_action, h.close_date_past, h.missing_schedule_lines,
           (CURRENT_DATE - h.updated_at::date)::int AS age_days
    FROM v_opportunity_hygiene h
    JOIN opportunity o ON o.id = h.id
    JOIN app_user u ON u.id = o.owner_id
    WHERE h.is_stale OR h.missing_next_action OR h.overdue_next_action
       OR h.close_date_past OR h.missing_schedule_lines
    ORDER BY o.name`;

  return rows.map((r) => {
    const reasons: string[] = [];
    if (r.missing_next_action) reasons.push("No next action");
    if (r.overdue_next_action) reasons.push("Action overdue");
    if (r.is_stale) reasons.push("No movement in 30 days");
    if (r.close_date_past) reasons.push("Close date passed");
    if (r.missing_schedule_lines) reasons.push("No schedule line");
    return {
      id: r.id.toString(),
      name: r.name,
      owner: r.owner,
      reasons,
      ageDays: r.age_days,
    };
  });
}

export type LossRow = { reason: string; count: number; value: number };

export async function lossReasons(): Promise<LossRow[]> {
  const rows = await db().$queryRaw<{ reason: string; count: number; value: string }[]>`
    SELECT COALESCE(r.label, 'Not recorded') AS reason,
           COUNT(DISTINCT o.id)::int AS count,
           COALESCE(SUM(w.expected_amount), 0)::text AS value
    FROM opportunity o
    LEFT JOIN ref_value r ON r.id = o.loss_reason_id
    LEFT JOIN v_schedule_line_weighted w ON w.opportunity_id = o.id
    WHERE o.outcome = 'lost' AND o.archived_at IS NULL
    GROUP BY COALESCE(r.label, 'Not recorded')
    ORDER BY count DESC`;
  return rows.map((r) => ({ reason: r.reason, count: r.count, value: Number(r.value) }));
}

export type FunnelRow = { source: string; leads: number; qualified: number; converted: number };

/** Lead to opportunity conversion by source, which the workbooks cannot answer. */
export async function funnelBySource(): Promise<FunnelRow[]> {
  const rows = await db().$queryRaw<
    { source: string; leads: number; qualified: number; converted: number }[]
  >`
    SELECT rv.label AS source,
           COUNT(*)::int AS leads,
           COUNT(*) FILTER (WHERE l.status IN ('qualified', 'converted'))::int AS qualified,
           COUNT(*) FILTER (WHERE l.status = 'converted')::int AS converted
    FROM lead l
    JOIN ref_value rv ON rv.id = l.source_id
    WHERE l.archived_at IS NULL
    GROUP BY rv.label
    ORDER BY leads DESC`;
  return rows;
}

export type SupportRow = { id: string; opportunity: string; ask: string; type: string; requestedAt: Date };

export async function supportRegister(): Promise<SupportRow[]> {
  const rows = await db().support_request.findMany({
    where: { resolved_at: null },
    orderBy: { requested_at: "desc" },
    include: { opportunity: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id.toString(),
    opportunity: r.opportunity.name,
    ask: r.ask,
    type: r.support_type,
    requestedAt: r.requested_at,
  }));
}
