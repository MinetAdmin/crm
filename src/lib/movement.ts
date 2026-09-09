export type SnapshotLine = {
  opportunityId: string;
  scheduleLineId: string | null;
  outcome: string;
  effectiveMonth: string | null;
  expected: number;
  probability: number;
  weighted: number;
};

export type MovementBuckets = {
  added: number;
  won: number;
  lost: number;
  slipped: number;
  probabilityChange: number;
  revised: number;
  removed: number;
};

export type Movement = {
  openingWeighted: number;
  closingWeighted: number;
  buckets: MovementBuckets;
  /** Lines that moved to a later month, whose value delta may still be zero. */
  slippedCount: number;
  reconciles: boolean;
  residual: number;
};

const key = (line: SnapshotLine) => `${line.opportunityId}:${line.scheduleLineId ?? "none"}`;

/**
 * Decomposes the change in weighted pipeline between two snapshots into the
 * buckets of doc 08 §3. The buckets must add back to the delta; the residual
 * is reported rather than hidden.
 */
export function decomposeMovement(
  opening: ReadonlyArray<SnapshotLine>,
  closing: ReadonlyArray<SnapshotLine>,
): Movement {
  const before = new Map(opening.map((l) => [key(l), l]));
  const after = new Map(closing.map((l) => [key(l), l]));

  const buckets: MovementBuckets = {
    added: 0,
    won: 0,
    lost: 0,
    slipped: 0,
    probabilityChange: 0,
    revised: 0,
    removed: 0,
  };

  const weightedOf = (l: SnapshotLine) => (l.outcome === "open" ? l.weighted : 0);
  let slippedCount = 0;

  for (const [id, now] of after) {
    const was = before.get(id);
    if (!was) {
      buckets.added += weightedOf(now);
      continue;
    }
    if (was.outcome === "open" && now.outcome === "won") {
      buckets.won -= was.weighted;
      continue;
    }
    if (was.outcome === "open" && (now.outcome === "lost" || now.outcome === "withdrawn")) {
      buckets.lost -= was.weighted;
      continue;
    }
    if (was.outcome !== "open" || now.outcome !== "open") continue;

    if (was.effectiveMonth !== now.effectiveMonth) {
      buckets.slipped += now.weighted - was.weighted;
      slippedCount += 1;
      continue;
    }
    // Amount and probability can both move; the cross term is attributed to
    // revised, consistently.
    buckets.probabilityChange += (was.expected * (now.probability - was.probability)) / 100;
    buckets.revised += ((now.expected - was.expected) * was.probability) / 100;
    const explained =
      (was.expected * (now.probability - was.probability)) / 100 +
      ((now.expected - was.expected) * was.probability) / 100;
    buckets.revised += now.weighted - was.weighted - explained;
  }

  for (const [id, was] of before) {
    if (!after.has(id)) buckets.removed -= weightedOf(was);
  }

  const openingWeighted = opening.reduce((sum, l) => sum + weightedOf(l), 0);
  const closingWeighted = closing.reduce((sum, l) => sum + weightedOf(l), 0);
  const total = Object.values(buckets).reduce((sum, v) => sum + v, 0);
  const residual = closingWeighted - openingWeighted - total;

  return {
    openingWeighted,
    closingWeighted,
    buckets,
    slippedCount,
    residual,
    reconciles: Math.abs(residual) < 0.01,
  };
}
