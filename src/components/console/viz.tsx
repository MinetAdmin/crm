"use client";

import { TREND_WEEKS } from "@/lib/account-table";
import { cn } from "cn";

export function ProbabilityMeter({
  value,
  segments = 18,
  className,
}: Readonly<{ value: number; segments?: number; className?: string }>) {
  const filled = Math.round((value / 100) * segments);

  return (
    <span
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={`Win probability ${value} percent`}
      className={cn(
        "flex h-3.5 w-[74px] items-center gap-[2px] overflow-hidden rounded-[2px] bg-foreground/8 px-[2px]",
        className,
      )}
    >
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 min-w-px flex-1 rounded-[1px] ${segmentClass(index, filled, segments)}`}
        />
      ))}
    </span>
  );
}

function segmentClass(index: number, filled: number, segments: number): string {
  if (index >= filled) return "bg-(--track)";
  if (index < segments * 0.25) return "bg-(--danger)";
  if (index < segments * 0.55) return "bg-(--warning)";
  return "bg-(--success)";
}

export function TrendBars({
  trend,
  className,
}: Readonly<{ trend: ReadonlyArray<number>; className?: string }>) {
  const values =
    trend.length === TREND_WEEKS ? trend : new Array<number>(TREND_WEEKS).fill(0);
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <span
      className={cn("inline-flex h-3.5 items-end gap-px", className)}
      aria-label={`${total} stage movements in the last ${TREND_WEEKS} weeks`}
    >
      {values.map((value, index) => (
        <span
          key={index}
          aria-hidden
          className={`w-1 shrink-0 rounded-[1px] ${barClass(value, max)}`}
          style={{ height: value === 0 ? 2 : 3 + Math.round((value / max) * 11) }}
        />
      ))}
    </span>
  );
}

function barClass(value: number, max: number): string {
  if (value === 0) return "bg-(--track)";
  return value >= max / 2 ? "bg-(--trend)" : "bg-(--trend-muted)";
}
