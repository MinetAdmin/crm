export type Allocation = { label: string; amount: number };

export type Reconciliation = {
  companyTarget: number;
  allocated: number;
  remainder: number;
  reconciled: boolean;
};

/**
 * BR-TGT-01: a set of unit targets has to add up to the company target. The
 * remainder is shown while a set is being built, so it can be saved only once
 * it reaches zero.
 */
export function reconcile(
  companyTarget: number,
  allocations: ReadonlyArray<Allocation>,
): Reconciliation {
  const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainder = companyTarget - allocated;
  return {
    companyTarget,
    allocated,
    remainder,
    reconciled: Math.abs(remainder) < 0.005,
  };
}

/** A phasing must add up to the annual figure it phases. */
export function phasingBalances(annual: number, months: ReadonlyArray<number>): boolean {
  return Math.abs(annual - months.reduce((sum, m) => sum + m, 0)) < 0.005;
}

/** Even phasing, used as a starting point before the real shape is entered. */
export function evenPhasing(annual: number, monthCount = 12): number[] {
  const each = Math.floor((annual / monthCount) * 100) / 100;
  const months = Array.from({ length: monthCount }, () => each);
  const drift = annual - each * monthCount;
  months[monthCount - 1] = Math.round((months[monthCount - 1] + drift) * 100) / 100;
  return months;
}

/** Coverage: open pipeline against what is still to be found. */
export function coverageRatio(openPipeline: number, target: number, won: number): number | null {
  const remaining = target - won;
  if (remaining <= 0) return null;
  return openPipeline / remaining;
}
