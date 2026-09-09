/**
 * The transformation the console exists to perform, shown in the system's own
 * material: rows.
 *
 * Left, one Medical pursuit as the workbooks hold it. Each month it was
 * restated on a new row as the forecast was refreshed, the client spelled a
 * different way each time, so a column total counts the same deal four times.
 * Right, one record: one expected amount, and the months read as its history.
 * The figures are invented.
 */

const RECORDED: ReadonlyArray<{ cells: ReadonlyArray<string>; fault: string }> = [
  {
    cells: ["MEMNON CAPITAL LTD", "Medical", "Sep", "45,000,000"],
    fault: "",
  },
  {
    cells: ["Memnon Capital", "MED", "Oct", "45,000,000"],
    fault: "restated in October, not a second deal",
  },
  {
    cells: ["memnon  capital ltd", "Med", "Nov", "45,000,000"],
    fault: "link broken by a sorted row",
  },
  {
    cells: ["Memnon Capital Ltd.", "Medical", "TBA", " 45,000,000"],
    fault: "a space, so the total fails",
  },
];

const HISTORY: ReadonlyArray<{ when: string; what: string }> = [
  { when: "Sep 2026", what: "Engaged" },
  { when: "Oct 2026", what: "Quotation prepared" },
  { when: "Nov 2026", what: "Amount confirmed" },
];

export function LedgerResolve() {
  return (
    <figure className="m-0 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
      <figcaption className="sr-only">
        One Medical pursuit for Memnon Capital as the workbooks hold it, restated on a new row each
        month with the client spelled differently every time, so totalling the column counts one
        deal of 45 million as 180 million. Beside it, the same pursuit held as a single record with
        one expected amount of 45 million, a weighted figure of 22.5 million the system calculates,
        and the months kept as its history.
      </figcaption>

      {/* As recorded */}
      <div
        className="lp-rise rounded-md border border-(--lp-line) bg-(--lp-card) p-5 md:p-6"
        style={{ "--lp-delay": "0.35s" } as React.CSSProperties}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="lp-num text-[11px] text-(--lp-fg-muted)">As recorded</span>
          <span className="lp-num text-[11px] text-(--lp-fg-muted)">4 rows</span>
        </div>

        <ul className="mt-4 grid gap-2" aria-hidden>
          {RECORDED.map((row, index) => (
            <li
              key={row.cells[0] + row.cells[2]}
              className="lp-rise grid gap-1"
              style={{ "--lp-delay": `${0.5 + index * 0.09}s` } as React.CSSProperties}
            >
              <div className="lp-num grid grid-cols-[1.7fr_0.55fr_0.45fr_1fr] gap-1.5 rounded border border-(--lp-line-soft) bg-(--lp-wash) px-2 py-1.5 text-[10px] text-(--lp-fg-muted) sm:gap-2 sm:px-2.5 sm:text-[11px]">
                {row.cells.map((cell) => (
                  <span key={cell} className="truncate">
                    {cell}
                  </span>
                ))}
              </div>
              {row.fault && (
                <span className="pl-2.5 text-[11px] text-(--lp-brand)">{row.fault}</span>
              )}
            </li>
          ))}
        </ul>

        <div
          className="lp-rise mt-4 flex items-baseline justify-between gap-3 border-t border-(--lp-line) pt-3"
          style={{ "--lp-delay": "0.9s" } as React.CSSProperties}
          aria-hidden
        >
          <span className="lp-num text-[11px] text-(--lp-fg-muted)">Column total</span>
          <span className="lp-num text-base text-(--lp-brand)">180,000,000</span>
        </div>
      </div>

      {/* Resolution marker */}
      <div
        className="lp-rise flex items-center justify-center lg:flex-col"
        style={{ "--lp-delay": "1s" } as React.CSSProperties}
        aria-hidden
      >
        <span className="hidden h-10 w-px bg-(--lp-line) lg:block" />
        <span className="lp-num rounded-full border border-(--lp-line) bg-(--lp-page) px-3 py-1 text-[10px] text-(--lp-fg-muted)">
          Resolves to
        </span>
        <span className="hidden h-10 w-px bg-(--lp-line) lg:block" />
      </div>

      {/* As held */}
      <div
        className="lp-rise rounded-md bg-(--lp-panel) p-5 text-(--lp-panel-fg) md:p-6"
        style={{ "--lp-delay": "1.1s" } as React.CSSProperties}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="lp-num text-[11px] text-(--lp-panel-muted)">As held</span>
          <span className="lp-num text-[11px] text-(--lp-panel-muted)">1 record</span>
        </div>

        <div className="mt-4" aria-hidden>
          <p className="lp-display text-xl tracking-[-0.02em]">Memnon Capital, Medical 2026</p>
          <div className="lp-num mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-(--lp-panel-muted)">
            <span>OPP-1042</span>
            <span>·</span>
            <span>Quotation prepared</span>
            <span>·</span>
            <span className="text-(--lp-panel-committed)">50%</span>
            <span>·</span>
            <span>E. Nakato</span>
          </div>

          <dl
            className="lp-rise mt-4 grid gap-2 border-t border-(--lp-panel-line) pt-3"
            style={{ "--lp-delay": "1.25s" } as React.CSSProperties}
          >
            <div className="flex items-baseline justify-between gap-3">
              <dt className="lp-num text-[11px] text-(--lp-panel-muted)">Expected amount</dt>
              <dd className="lp-num text-base">45,000,000</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="lp-num text-[11px] text-(--lp-panel-muted)">Weighted, calculated</dt>
              <dd className="lp-num text-base text-(--lp-panel-committed)">22,500,000</dd>
            </div>
          </dl>

          <p
            className="lp-rise lp-num mt-4 text-[11px] text-(--lp-panel-muted)"
            style={{ "--lp-delay": "1.4s" } as React.CSSProperties}
          >
            The months are its history, not more revenue
          </p>
          <ul className="mt-2 grid gap-px">
            {HISTORY.map((entry, index) => (
              <li
                key={entry.when}
                className="lp-rise lp-num flex items-baseline justify-between gap-3 border-b border-(--lp-panel-line) py-1.5 text-[11px] last:border-b-0"
                style={{ "--lp-delay": `${1.5 + index * 0.09}s` } as React.CSSProperties}
              >
                <span className="text-(--lp-panel-muted)">{entry.when}</span>
                <span>{entry.what}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
