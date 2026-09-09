/**
 * The six stages as a climb, each step as long as the probability it carries,
 * with the committed threshold marked at 50 percent. A pursuit only moves up
 * when its exit criterion is met, which is what makes one owner's "engaged"
 * mean the same as another's.
 *
 * Wide screens get the staircase, read left to right. Narrow screens get the
 * same figure turned on its side, because six columns of prose in 50 pixels
 * is not a staircase, it is a wall.
 */

const STAGES: ReadonlyArray<{ name: string; probability: number; exit: string }> = [
  { name: "Prospecting", probability: 10, exit: "A named contact has responded." },
  { name: "Information gathering", probability: 20, exit: "Enough held to price or scope." },
  { name: "Engaged", probability: 35, exit: "The client invites a quotation or bid." },
  { name: "Quotation prepared", probability: 50, exit: "Quotation issued to the client." },
  { name: "Proposal submitted", probability: 70, exit: "Receipt confirmed, evaluation underway." },
  { name: "Shortlisted", probability: 85, exit: "Award decision communicated." },
];

const THRESHOLD = 50;

const isCommitted = (probability: number) => probability >= THRESHOLD;

const barColor = (probability: number) =>
  isCommitted(probability) ? "var(--lp-brand)" : "var(--lp-wash)";

const labelColor = (probability: number) =>
  isCommitted(probability) ? "text-(--lp-brand)" : "text-(--lp-fg-muted)";

export function StageLadder() {
  return (
    <>
      <StackedStages />
      <Staircase />
    </>
  );
}

/** Narrow screens: one stage per row, bars running left to right. */
function StackedStages() {
  return (
    <ol className="relative grid gap-3 pt-6 md:hidden">
      <div
        className="pointer-events-none absolute inset-y-0 top-6 border-l border-dashed border-(--lp-brand)/50"
        style={{ left: `${THRESHOLD}%` }}
        aria-hidden
      >
        <span className="lp-num absolute -top-5 left-1.5 text-[10px] whitespace-nowrap text-(--lp-brand)">
          Committed from 50%
        </span>
      </div>
      {STAGES.map((stage, index) => (
        <li key={stage.name} className="relative overflow-hidden rounded-sm py-1.5 pr-1 pl-2.5">
          {/* The bar is the row's ground, so it costs no height of its own. */}
          <div
            className="lp-sweep absolute inset-y-0 left-0"
            style={
              {
                width: `${stage.probability}%`,
                background: isCommitted(stage.probability)
                  ? "color-mix(in srgb, var(--lp-brand) 12%, transparent)"
                  : "var(--lp-wash)",
                borderRight: `2px solid ${barColor(stage.probability)}`,
                "--lp-delay": `${0.1 + index * 0.07}s`,
              } as React.CSSProperties
            }
            aria-hidden
          />
          <div className="relative flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] leading-tight font-medium">
              <span className="lp-num mr-2 text-[11px] text-(--lp-fg-muted)">
                {String(index + 1).padStart(2, "0")}
              </span>
              {stage.name}
            </h3>
            <span className={`lp-num text-[11px] ${labelColor(stage.probability)}`}>
              {stage.probability}%
            </span>
          </div>
          <p className="relative mt-0.5 text-[13px] leading-snug text-(--lp-fg-muted)">
            {stage.exit}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Wide screens: the staircase, each step as tall as its probability. */
function Staircase() {
  return (
    <div className="hidden md:block">
      <div className="relative h-36" aria-hidden>
        <div
          className="absolute inset-x-0 border-t border-dashed border-(--lp-brand)/50"
          style={{ bottom: `${THRESHOLD}%` }}
        >
          <span className="lp-num absolute -top-5 right-0 text-[10px] text-(--lp-brand)">
            Committed from 50%
          </span>
        </div>

        <ol className="flex h-full items-end gap-3">
          {STAGES.map((stage, index) => (
            <li
              key={stage.name}
              className="lp-sweep flex-1 rounded-t-sm"
              style={
                {
                  height: `${stage.probability}%`,
                  backgroundColor: barColor(stage.probability),
                  "--lp-origin": "bottom center",
                  "--lp-delay": `${0.15 + index * 0.08}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </ol>
      </div>

      <ol className="mt-3 flex gap-3 border-t border-(--lp-line)">
        {STAGES.map((stage, index) => (
          <li key={stage.name} className="grid flex-1 content-start gap-1 pt-3">
            <div className="flex items-baseline justify-between gap-1">
              <span className="lp-num text-[11px] text-(--lp-fg-muted)">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={`lp-num text-[11px] ${labelColor(stage.probability)}`}>
                {stage.probability}%
              </span>
            </div>
            <h3 className="text-[15px] leading-tight font-medium">{stage.name}</h3>
            <p className="text-[13px] leading-snug text-(--lp-fg-muted)">{stage.exit}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
