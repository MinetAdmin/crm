const AMOUNT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Grouped whole units, e.g. 22500000 becomes "22,500,000". */
export function formatAmount(value: number): string {
  return AMOUNT.format(Math.round(value));
}

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const SHORT_DATE_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Sep 9" within the current year, "Sep 9, 2025" otherwise. */
export function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return sameYear ? SHORT_DATE.format(date) : SHORT_DATE_YEAR.format(date);
}

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact figure for stat tiles, e.g. 2400000000 becomes "2.4B". */
export function formatCompactAmount(value: number): string {
  return COMPACT.format(value);
}
