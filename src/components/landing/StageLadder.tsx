/**
 * The six stages as a climb, each step as tall as the probability it carries,
 * with the committed threshold drawn across at 50 percent. A pursuit only
 * moves up a step when its exit criterion is met, which is what makes one
 * owner's "engaged" mean the same as another's.
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

export function StageLadder() {
  return (
    <div>
      <div className="relative h-40 md:h-56" aria-hidden>
        <div
          className="absolute inset-x-0 border-t border-dashed border-(--lp-brand)/50"
          style={{ bottom: `${THRESHOLD}%` }}
        >
          <span className="lp-num absolute -top-5 right-0 text-[10px] text-(--lp-brand)">
            Committed from 50%
          </span>
        </div>

        <ol className="flex h-full items-end gap-1.5 md:gap-3">
          {STAGES.map((stage, index) => (
            <li
              key={stage.name}
              className="lp-sweep flex-1 rounded-t-sm bg-(--lp-wash)"
              style={
                {
                  height: `${stage.probability}%`,
                  backgroundColor:
                    stage.probability >= THRESHOLD ? "var(--lp-brand)" : "var(--lp-wash)",
                  "--lp-origin": "bottom center",
                  "--lp-delay": `${0.15 + index * 0.08}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </ol>
      </div>

      <ol className="mt-4 flex gap-1.5 border-t border-(--lp-line) md:gap-3">
        {STAGES.map((stage, index) => (
          <li key={stage.name} className="grid flex-1 content-start gap-1.5 pt-4">
            <div className="flex items-baseline justify-between gap-1">
              <span className="lp-num text-[11px] text-(--lp-fg-muted)">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`lp-num text-[11px] ${
                  stage.probability >= THRESHOLD ? "text-(--lp-brand)" : "text-(--lp-fg-muted)"
                }`}
              >
                {stage.probability}%
              </span>
            </div>
            <h3 className="text-[13px] leading-tight font-medium md:text-[15px]">{stage.name}</h3>
            <p className="hidden text-[13px] leading-relaxed text-(--lp-fg-muted) md:block">
              {stage.exit}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
