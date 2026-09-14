export type ValueBasis = "brokerage_income" | "sum_insured" | "premium";

export const BASIS_LABEL: Record<ValueBasis, string> = {
  brokerage_income: "Brokerage income",
  sum_insured: "Sum insured",
  premium: "Premium",
};

export type TenderValue = { basis: ValueBasis; amount: number };

/**
 * BR-TEN-01: values on different bases are never added together. Totals come
 * back grouped, so a single mixed figure cannot be produced by accident.
 */
export function totalsByBasis(values: ReadonlyArray<TenderValue>): {
  basis: ValueBasis;
  total: number;
  count: number;
}[] {
  const grouped = new Map<ValueBasis, { total: number; count: number }>();
  for (const value of values) {
    const current = grouped.get(value.basis) ?? { total: 0, count: 0 };
    grouped.set(value.basis, { total: current.total + value.amount, count: current.count + 1 });
  }
  return [...grouped.entries()]
    .map(([basis, { total, count }]) => ({ basis, total, count }))
    .sort((a, b) => a.basis.localeCompare(b.basis));
}

export const DECIDED_STATUSES = new Set(["won", "lost"]);

/** BR-TEN-02: a decided tender has to say why. */
export function decisionNeedsReason(status: string, outcomeReasonId: string | null): boolean {
  return DECIDED_STATUSES.has(status) && !outcomeReasonId;
}

/** Win rate by count and by value, always reported as a pair. */
export function winRates(
  decided: ReadonlyArray<{ won: boolean; amount: number }>,
): { byCount: number | null; byValue: number | null } {
  if (decided.length === 0) return { byCount: null, byValue: null };
  const wonCount = decided.filter((d) => d.won).length;
  const totalValue = decided.reduce((sum, d) => sum + d.amount, 0);
  const wonValue = decided.filter((d) => d.won).reduce((sum, d) => sum + d.amount, 0);
  return {
    byCount: (wonCount / decided.length) * 100,
    byValue: totalValue === 0 ? null : (wonValue / totalValue) * 100,
  };
}

/** Days until a submission deadline, negative once it has passed. */
export function daysUntil(deadline: Date, now: Date): number {
  const startOfDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((startOfDay(deadline) - startOfDay(now)) / 86_400_000);
}
