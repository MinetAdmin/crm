/**
 * The full-year target read left to right: what is won, what is committed,
 * what the weighted pipeline adds, and the gap still open. Every segment is a
 * grouping of the same schedule lines, which is the point. Figures invented.
 */

const SEGMENTS: ReadonlyArray<{
  key: string;
  label: string;
  amount: string;
  share: number;
  fill: string;
  open?: boolean;
}> = [
  { key: "won", label: "Won", amount: "892m", share: 28, fill: "var(--lp-panel-committed)" },
  {
    key: "committed",
    label: "Committed, 50%+",
    amount: "604m",
    share: 19,
    fill: "var(--lp-panel-play)",
  },
  {
    key: "weighted",
    label: "Weighted pipeline",
    amount: "731m",
    share: 23,
    fill: "var(--lp-panel-early)",
  },
  { key: "gap", label: "Gap to target", amount: "964m", share: 30, fill: "transparent", open: true },
];

export function ForecastBand() {
  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        Against an illustrative full-year target, 28 percent is won, 19 percent is committed at 50
        percent probability or above, 23 percent is weighted pipeline, and 30 percent remains an
        open gap.
      </figcaption>

      <div className="flex items-baseline justify-between gap-4">
        <span className="lp-num text-[11px] text-(--lp-panel-muted)">
          Full year target
        </span>
        <span className="lp-num text-[11px] text-(--lp-panel-muted)">3,191m, illustrative</span>
      </div>

      <div
        className="mt-4 flex h-14 w-full gap-1 md:h-20"
        style={{ "--lp-delay": "0.2s" } as React.CSSProperties}
        aria-hidden
      >
        {SEGMENTS.map((segment, index) => (
          <div
            key={segment.key}
            className="lp-sweep rounded-sm"
            style={
              {
                flexGrow: segment.share,
                backgroundColor: segment.fill,
                border: segment.open ? "1px dashed var(--lp-brand)" : "none",
                "--lp-delay": `${0.35 + index * 0.14}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <dl className="mt-4 flex w-full gap-1" aria-hidden>
        {SEGMENTS.map((segment, index) => (
          <div
            key={segment.key}
            className="lp-rise grid content-start gap-0.5 overflow-hidden"
            style={
              { flexGrow: segment.share, "--lp-delay": `${0.6 + index * 0.14}s` } as React.CSSProperties
            }
          >
            <dt className="lp-num truncate text-[11px] text-(--lp-panel-muted)">
              {segment.label}
            </dt>
            <dd
              className={`lp-num text-sm md:text-base ${segment.open ? "text-(--lp-brand)" : ""}`}
            >
              {segment.amount}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
