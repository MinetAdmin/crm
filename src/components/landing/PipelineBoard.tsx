/**
 * Illustrative quarter of pipeline, plotted by expected close month.
 *
 * Three bands (committed, in play, early) share a Sep to Dec axis. October
 * carries the most pursuits and nothing in the committed band, which is the
 * point of the panel: a month can look busy and still be empty of anything
 * anyone has promised. The data is invented, since this panel renders before
 * anyone signs in.
 */

const MONTHS = 4;

const BANDS: ReadonlyArray<{
  id: string;
  label: string;
  color: string;
  at: ReadonlyArray<number>;
}> = [
  {
    id: "committed",
    label: "Committed, 50%+",
    color: "var(--lp-panel-committed)",
    at: [0.35, 0.72, 2.42, 2.78, 3.34],
  },
  {
    id: "play",
    label: "Quotation or bid in",
    color: "var(--lp-panel-play)",
    at: [0.5, 1.2, 1.45, 1.7, 1.9, 2.2, 2.62, 3.08],
  },
  {
    id: "early",
    label: "Early stage",
    color: "var(--lp-panel-early)",
    at: [0.18, 0.9, 1.12, 1.3, 1.52, 1.64, 1.82, 2.05, 2.3, 2.54, 2.9, 3.42, 3.66],
  },
];

const NOW = 0.28;

const AXIS = [
  { at: 0.5, label: "Sep" },
  { at: 1.5, label: "Oct" },
  { at: 2.5, label: "Nov" },
  { at: 3.5, label: "Dec" },
];

const CHIPS: ReadonlyArray<{ at: number; label: string; stem: string }> = [
  { at: 1.5, label: "October heaviest, nothing committed", stem: "h-38" },
  { at: 3.34, label: "December close dates confirmed", stem: "h-28" },
];

const MOMENTS: ReadonlyArray<{ time: string; title: string; detail: string }> = [
  {
    time: "30 Sep",
    title: "Month-end snapshot",
    detail: "Frozen before anyone edits, so next month's movement report reconciles to the penny.",
  },
  {
    time: "Stage moved",
    title: "Written to stage history",
    detail: "From, to, who, and when. Recorded on the day, because it cannot be reconstructed later.",
  },
  {
    time: "7 days",
    title: "Tender deadline",
    detail: "The one genuinely time-critical alert in the system, raised while it can still be met.",
  },
];

const asPercent = (month: number) => `${(month / MONTHS) * 100}%`;

export function PipelineBoard() {
  return (
    <figure
      className="lp-rise relative m-0 overflow-hidden rounded-md bg-(--lp-panel) px-5 pt-6 pb-8 text-(--lp-panel-fg) sm:px-8 sm:pt-8 sm:pb-24 md:px-12 md:pt-12 md:pb-28"
      style={{ "--lp-delay": "0.35s" } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <figcaption className="lp-display text-2xl md:text-3xl">A quarter of pipeline</figcaption>
        <div className="lp-mono flex items-center gap-2 text-[11px] text-(--lp-panel-muted)">
          <span
            className="lp-beacon inline-block size-1.5 rounded-full bg-(--lp-panel-committed)"
            aria-hidden
          />
          Illustrative quarter
        </div>
      </div>

      <p className="sr-only">
        Across an illustrative quarter, pursuits are plotted by expected close month. Early-stage
        work spreads through every month, quotations and bids cluster in October and November, and
        the committed band holds five pursuits in September, November and December, with none at all
        in October.
      </p>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:gap-4 md:mt-10" aria-hidden>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:w-44 sm:shrink-0 sm:flex-col sm:gap-4 sm:pt-27 sm:pb-4">
          {BANDS.map((band) => (
            <li
              key={band.id}
              className="lp-mono flex items-center gap-2 text-[11px] text-(--lp-panel-muted) sm:h-6"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: band.color }}
              />
              {band.label}
            </li>
          ))}
        </ul>

        <div className="relative flex-1">
          <div className="lp-ledger absolute inset-x-0 top-0 bottom-10 rounded-md" />

          {CHIPS.map((chip, index) => (
            <div
              key={chip.at}
              className="lp-rise absolute top-4 hidden -translate-x-1/2 flex-col items-center sm:flex"
              style={
                {
                  left: asPercent(chip.at),
                  "--lp-delay": `${1.6 + index * 0.2}s`,
                } as React.CSSProperties
              }
            >
              <span className="lp-chip lp-mono text-[10px] whitespace-nowrap">{chip.label}</span>
              <span className={`w-px bg-white/20 ${chip.stem}`} />
            </div>
          ))}

          <div className="flex flex-col gap-4 px-0 pt-6 pb-4 sm:pt-27">
            {BANDS.map((band, bandIndex) => (
              <div key={band.id} className="relative h-6">
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/8" />
                {band.at.map((month) => (
                  <span
                    key={month}
                    className="lp-mark absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black/30"
                    style={
                      {
                        "--lp-at": asPercent(month),
                        "--lp-delay": `${0.7 + bandIndex * 0.12 + (month / MONTHS) * 0.5}s`,
                        backgroundColor: band.color,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          <div
            className="lp-sweep h-px w-full bg-(--lp-panel-line)"
            style={{ "--lp-delay": "0.55s" } as React.CSSProperties}
          />
          <div className="relative h-6">
            {AXIS.map((tick) => (
              <span
                key={tick.label}
                className="lp-mono absolute top-2 -translate-x-1/2 text-[10px] text-(--lp-panel-muted)"
                style={{ left: asPercent(tick.at) }}
              >
                {tick.label}
              </span>
            ))}
          </div>

          <div
            className="lp-now lp-rise absolute top-0 bottom-6 w-px bg-(--lp-panel-now)/60"
            style={{ "--lp-at": asPercent(NOW), "--lp-delay": "1.4s" } as React.CSSProperties}
          >
            <span className="lp-mono absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-(--lp-panel-now)">
              today
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-10 grid gap-6 border-t border-(--lp-panel-line) pt-8 sm:grid-cols-3 md:mt-14">
        {MOMENTS.map((moment, index) => (
          <li
            key={moment.time}
            className="lp-rise grid gap-1.5"
            style={{ "--lp-delay": `${1.5 + index * 0.12}s` } as React.CSSProperties}
          >
            <span className="lp-mono text-[11px] text-(--lp-panel-muted)">{moment.time}</span>
            <span className="text-[0.9375rem] font-medium">{moment.title}</span>
            <span className="text-sm leading-relaxed text-(--lp-panel-muted)">{moment.detail}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
