import { db } from "./db";

export type FunnelCounts = {
  longlist: number;
  leads: number;
  pipeline: number;
  won: number;
};

/** Live counts at each step of the flow, for the strip that maps it. */
export async function funnelCounts(): Promise<FunnelCounts> {
  const [longlist, leads, pipeline, won] = await Promise.all([
    db().longlist_entry.count({
      where: { archived_at: null, status: { in: ["unworked", "parked"] } },
    }),
    db().lead.count({
      where: { archived_at: null, status: { notIn: ["converted", "disqualified"] } },
    }),
    db().opportunity.count({ where: { archived_at: null, outcome: "open" } }),
    db().opportunity.count({ where: { archived_at: null, outcome: "won" } }),
  ]);
  return { longlist, leads, pipeline, won };
}
