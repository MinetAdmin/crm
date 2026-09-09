/**
 * The transformation the console exists to perform, shown in the system's own
 * material: rows.
 *
 * Left, one deal as the workbooks hold it, restated three times with a
 * different spelling each time, a broken link and a weighted figure that is a
 * formula on one row and typed on the next. Right, the same deal as one
 * record with its money underneath it. The figures are invented.
 */

const RECORDED: ReadonlyArray<{ cells: ReadonlyArray<string>; fault: string }> = [
  {
    cells: ["MEMNON CAPITAL LTD", "Medical", "Sep", "45,000,000", "22,500,000"],
    fault: "",
  },
  {
    cells: ["Memnon Capital", "MED", "Oct", "45,000,000", "=E4*F4"],
    fault: "same client, spelled differently",
  },
  {
    cells: ["memnon  capital ltd", "Med", "Nov", "45,000,000", "#REF!"],
    fault: "link broken by a sorted row",
  },
  {
    cells: ["Memnon Capital Ltd.", "Medical", "TBA", " 45,000,000", "#VALUE!"],
    fault: "a space, so the total fails",
  },
];

const HELD_LINES: ReadonlyArray<{ month: string; product: string; amount: string }> = [
  { month: "Sep 2026", product: "Medical", amount: "45,000,000" },
  { month: "Oct 2026", product: "Medical", amount: "45,000,000" },
  { month: "Nov 2026", product: "Medical", amount: "45,000,000" },
];

export function LedgerResolve() {
  return (
    <figure className="m-0 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
      <figcaption className="sr-only">
        One deal as the workbooks hold it, restated across four rows with a different spelling of
        the client on each, a broken reference and a failed total, beside the same deal held as one
        opportunity with three dated revenue schedule lines and a weighted figure the system
        calculates.
      </figcaption>

      {/* As recorded */}
      <div
        className="lp-rise rounded-md border border-(--lp-line) bg-(--lp-card) p-5 md:p-6"
        style={{ "--lp-delay": "0.35s" } as React.CSSProperties}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="lp-mono text-[11px] tracking-[0.08em] text-(--lp-fg-muted) uppercase">
            As recorded
          </span>
          <span className="lp-mono text-[11px] text-(--lp-fg-muted)">4 rows</span>
        </div>

        <ul className="mt-4 grid gap-2" aria-hidden>
          {RECORDED.map((row, index) => (
            <li
              key={row.cells[0] + row.cells[2]}
              className="lp-rise grid gap-1"
              style={{ "--lp-delay": `${0.5 + index * 0.09}s` } as React.CSSProperties}
            >
              <div className="lp-mono grid grid-cols-[1.6fr_0.7fr_0.5fr_1fr] gap-2 rounded border border-(--lp-line-soft) bg-(--lp-wash) px-2.5 py-1.5 text-[11px] text-(--lp-fg-muted)">
                {row.cells.slice(0, 4).map((cell) => (
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
      </div>

      {/* Resolution marker */}
      <div
        className="lp-rise flex items-center justify-center lg:flex-col"
        style={{ "--lp-delay": "0.95s" } as React.CSSProperties}
        aria-hidden
      >
        <span className="hidden h-10 w-px bg-(--lp-line) lg:block" />
        <span className="lp-mono rounded-full border border-(--lp-line) bg-(--lp-page) px-3 py-1 text-[10px] tracking-[0.08em] text-(--lp-fg-muted) uppercase">
          resolves to
        </span>
        <span className="hidden h-10 w-px bg-(--lp-line) lg:block" />
      </div>

      {/* As held */}
      <div
        className="lp-rise rounded-md bg-(--lp-panel) p-5 text-(--lp-panel-fg) md:p-6"
        style={{ "--lp-delay": "1.05s" } as React.CSSProperties}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="lp-mono text-[11px] tracking-[0.08em] text-(--lp-panel-muted) uppercase">
            As held
          </span>
          <span className="lp-mono text-[11px] text-(--lp-panel-muted)">1 record</span>
        </div>

        <div className="mt-4" aria-hidden>
          <p className="lp-display text-xl tracking-[-0.02em]">Memnon Capital, Medical 2026</p>
          <div className="lp-mono mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-(--lp-panel-muted)">
            <span>OPP-1042</span>
            <span aria-hidden>·</span>
            <span>Quotation prepared</span>
            <span aria-hidden>·</span>
            <span className="text-(--lp-panel-committed)">50%</span>
            <span aria-hidden>·</span>
            <span>E. Nakato</span>
          </div>

          <ul className="mt-4 grid gap-px border-t border-(--lp-panel-line)">
            {HELD_LINES.map((line, index) => (
              <li
                key={line.month}
                className="lp-rise lp-mono grid grid-cols-[1fr_0.8fr_auto] items-center gap-2 border-b border-(--lp-panel-line) py-2 text-[11px]"
                style={{ "--lp-delay": `${1.2 + index * 0.09}s` } as React.CSSProperties}
              >
                <span className="text-(--lp-panel-muted)">{line.month}</span>
                <span className="text-(--lp-panel-muted)">{line.product}</span>
                <span className="text-right">{line.amount}</span>
              </li>
            ))}
          </ul>

          <div
            className="lp-rise mt-3 flex items-baseline justify-between gap-3"
            style={{ "--lp-delay": "1.5s" } as React.CSSProperties}
          >
            <span className="lp-mono text-[11px] text-(--lp-panel-muted)">
              weighted, calculated
            </span>
            <span className="lp-mono text-base text-(--lp-panel-committed)">67,500,000</span>
          </div>
        </div>
      </div>
    </figure>
  );
}
