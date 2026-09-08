# 08 — Reporting Specification

Every measure defined exactly once, here, and implemented exactly once (SQL views /
`SnapshotService`). Sources: Spec §7 (forecast views), §9 (report list), §15 (pack measures and
corrections), §16 (workload suite and availability timeline).

Notation: `RSL` = revenue schedule line joined to its opportunity
(`v_schedule_line_weighted`); `p(line)` = line probability override else opportunity
probability; `weighted = expected × p / 100`. "Open" = outcome `open`;
`T` = committed threshold setting (default **50%**, D-06).

## 1. Forecast bases (Spec §7 + §15 corrections)

| Basis | Formula | Notes |
|---|---|---|
| Closed & won | Σ `RSL.expected` (or `actual` where present) over won opportunities | What is delivered |
| Committed | Won + Σ open `RSL.expected` where `p ≥ T` | T configurable; pack also reports the `= T` band separately — group by probability band, don't hardcode |
| Weighted pipeline | Σ open `RSL.weighted` | The realistic forecast; the sheets' one good formula, made structural |
| Best case | Σ open `RSL.expected` | Retained but demoted (§15): not shown on the landing view |
| Prior-year repeat | Prior year same-period won (from migrated history or `revenue_actual`) | Replaces best case on landing comparisons (§15) |
| Expected year-end landing | YTD won (+ actual + proforma in Phase 2) + Σ weighted for remaining months of FY | Named view, per §15 |
| Gap to target | Target − won − weighted, by unit / owner / initiative | Never typed |
| Coverage ratio | Σ open `RSL.expected` ÷ (target − won) | Warn below `coverage_min` setting (default 3.0) |

All bases phase by `RSL.effective_month`; monthly/quarterly/annual are groupings (FR-FC-05).
Pending C2, "effective month" is treated as *revenue recognition month* — flagged as assumption
in doc 12; if C2 answers inception or payment month, only the label and migration mapping
change, not the formulas.

## 2. Report catalogue (Spec §9)

| Report | Cadence / audience | Definition |
|---|---|---|
| Pipeline by stage | Weekly, BD team | Count + gross + weighted by stage × owner × unit; movement vs last week from stage_history |
| Weighted forecast by month | Monthly, management | Weighted by effective month vs phased target; gap |
| Forecast movement | Monthly, management | §3 below |
| Initiative scorecard | Monthly, management | Per initiative: target, delivered, weighted expected, gap (all from `v_initiative_rollup`), status, next milestone |
| Owner performance | Monthly, unit heads | Per owner: target vs won + weighted; win rate (§4); avg deal size (won gross ÷ won count); avg days to close (close − created) |
| Win & loss analysis | Quarterly, BD leadership | Win rate by product/sector/unit/lead source; loss reasons; **stage at loss** (last stage of lost opportunities) |
| Funnel conversion | Quarterly, BD leadership | Leads → qualified → converted → won, rates by source |
| Management support register | CEO / management | Open `support_request`s: type, ask, requested by/when, opportunity value at stake |
| Ageing & hygiene exceptions | Weekly, BD team | `v_opportunity_hygiene`: no next action, overdue action, stale > `ageing_days`, close date past, missing schedule lines — plus unowned queue |

## 3. Movement decomposition (FR-FC-04)

Between snapshots S1 (earlier) and S2, matching on `opportunity_id` + `schedule_line_id`:

| Bucket | Rule |
|---|---|
| **Added** | Line in S2, not in S1 |
| **Won** | Open in S1 → won in S2: remove weighted, add to won |
| **Lost / withdrawn** | Open in S1 → lost/withdrawn in S2 |
| **Slipped** | Same line, `effective_month` later in S2 (report months moved) |
| **Probability change** | Same line, Δ from `p` change: `expected₂ × (p₂ − p₁)` |
| **Revised** | Same line, Δ from amount change: `(expected₂ − expected₁) × p₁` |
| **Removed** | Line in S1 absent in S2 (archived) |

Sum of buckets reconciles exactly to `weighted(S2) − weighted(S1)`; the report asserts this and
shows a reconciliation error rather than hiding one. Amount-and-probability both changing
attributes the cross-term to Revised (documented, arbitrary, consistent).

## 4. Win rate

- By count: won ÷ (won + lost) over decided opportunities in period.
- By value: won gross ÷ (won + lost gross).
Always presented **as a pair** — the pack's own lesson (41.2% by count vs 17.1% by value on
tenders; the same trap as pursuit counts in §16).

## 5. Workload suite (Spec §16)

Ten signals, computed per owner (accountable owner only; co-owners excluded from load):

| Signal | Formula |
|---|---|
| Open pursuit count | Count open opportunities owned |
| Weighted value held | Σ weighted over open owned |
| Effort-weighted load | Σ complexity weight (light=1, standard=2, complex=4 — settings) over open owned |
| Initiatives championed | Count championed + Σ their `gap_to_target` |
| Median days in stage | Median of `now − stage_entered_at` over open owned (backfilled entries flagged) |
| Stage advances / month | Forward moves in `stage_history` (`to.sort > from.sort`, `backfilled = false`) per month |
| Actions overdue | Open next actions + initiative milestones past due, + due ≤ 30 days |
| Accounts touched | Distinct accounts over open owned |
| Blocked pursuits | Open owned with `key_blocker` non-empty OR unresolved support request |
| Unowned work | (team-level) open opportunities with no owner — should be structurally impossible post-launch (BR-OPP-01); the report exists to prove it stays zero |

Derived reports: owner workload summary (all ten + team median); rebalancing view (ranked by
effort-weighted load ÷ (capacity × availability%), movable pursuits suggested); bogged-down
exceptions (median days-in-stage trending up while advances/month trend down, needs 3 months);
concentration alert (largest owner's share of committed value vs threshold — fires at 79% on
current book); initiative load; unowned queue.

## 6. Availability timeline (FR-RPT-11 data)

From Spec §16, encoded as `meaningful_from` logic per report:

| Report | Meaningful from |
|---|---|
| Stock measures, pipeline, forecast bases, scorecard, support register, unowned queue | Day one |
| Actions overdue | Go-live + 1 month |
| Median days in stage | Day one approximate (backfilled), dependable ~6 weeks |
| Stage advances per month | First full calendar month |
| Forecast movement | Second snapshot; trend from month 5 |
| Bogged-down exceptions | Month 4 |
| Win rate / stage conversion | Immediate if history migrated (F5), else 2–3 quarters |
| Prior-year comparatives | Only if 2025 history loaded |
| Forecast accuracy | First quarter after go-live |
| Prequal → tender conversion | 6–12 months |

Until the date passes, the endpoint returns `insufficient_data` + the date, and the UI renders
the notice (never zero, never blank).
