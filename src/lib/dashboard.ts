import { prisma } from "./db";

export type DashboardSummary = {
  openPursuits: number;
  weightedPipeline: number;
  exceptions: number;
  tendersDue: number;
};

/** Counts for the dashboard tiles, read from the reporting views (doc 08). */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [openPursuits, weighted, exceptions, tenders] = await Promise.all([
    prisma.opportunity.count({ where: { outcome: "open", archived_at: null } }),
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM(weighted_amount), 0)::text AS total
      FROM v_schedule_line_weighted
      WHERE outcome = 'open'`,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM v_opportunity_hygiene
      WHERE is_stale OR missing_next_action OR overdue_next_action
         OR close_date_past OR missing_schedule_lines`,
    prisma.$queryRaw<{ count: number }[]>`
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
