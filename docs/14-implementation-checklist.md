# 14: Implementation-to-requirement checklist

Audited 2026-09-13 against commit `4e78cab` (plus the BR-LL-01 fix committed with this
file). This is the checklist doc 13 Gate A calls for: per requirement, what the code
actually does, with the deciding evidence. Verdicts: **Done** (every clause), **Partial**
(some clause unmet), **Missing** (no behaviour), **Deferred** (documented deferral),
**Deviates** (implemented against the doc's statement). Schema-only support does not
count as Done; a column with no write path is a Partial or Missing.

The dominant pattern: the schema implements the PRD almost completely; the behaviour is
a narrow vertical slice (capture, convert, move stage, add a line, close, one next
action). Doc 13's IP-01 to IP-12 remain open and this checklist agrees with them.

## Accounts, longlist, leads

| ID | Verdict | Evidence / gap |
|---|---|---|
| FR-ACC-01 | Partial | IDs as keys, sector/unit/country columns; `country` has no write path and the account page shows no relationship history beyond contacts (`src/app/console/accounts/[id]/page.tsx`) |
| FR-ACC-02 | Done | Fold + prompt + DB backstop (`src/lib/account-name.ts:19`, `accounts/actions.ts:27`, `0001_init.sql:114`); note: DB index folds less than the app, so a pure case variant on "create anyway" throws raw |
| FR-ACC-03 | Done | Create-only; no contact edit or archive path |
| FR-ACC-04 | Missing | No merge code anywhere |
| FR-LL-01 | Partial | `notes` column has no form field or create input (`src/lib/longlist.ts:110`) |
| FR-LL-02 | Done | One transaction, both audits (`src/lib/longlist.ts:157`) |
| FR-LL-03 | Done | Pure read-time derivation (`src/lib/longlist-rules.ts`) |
| BR-LL-01 | Done | DB CHECK + save-time message; blank-year loophole fixed with this commit (`longlist/actions.ts:35`) |
| BR-LL-02 | Done | Unreachable by construction + DB CHECK |
| BR-LL-03 | Done | DB CHECK + save-time message citing the id |
| FR-LEAD-01 | Partial | Lead company name is never checked against accounts; only a manual match dropdown |
| FR-LEAD-02 | Done | Server-side required check + NOT NULLs |
| BR-LEAD-01 | Partial | DB CHECK only; no lead status-transition action exists, and conversion without contact hits a raw Postgres error, not a BR-LEAD-01 message |
| BR-LEAD-02 | Partial | DB CHECK only; no disqualify UI, no code touches `disqualification_reason_id`, list unseeded |
| FR-LEAD-03 | Partial | Age derived and tinted on the list; no lead appears in any exception view (hygiene views are opportunity-only) |
| FR-LEAD-04 | Partial | Atomic conversion with both links and kept lead works; but the account is never created if absent, `ownerAccepted` is hardcoded true (`src/lib/leads.ts:74`), and the stage id is form-trusted (UI `take: 2` is the only limit) |

## Opportunities and schedule lines

| ID | Verdict | Evidence / gap |
|---|---|---|
| FR-OPP-01 | Partial | All columns exist incl. co-owners, confidence, forecast category, complexity, support; none of those four has any write path or UI |
| FR-OPP-02 | Partial | Stages + probabilities + criteria seeded and applied; not admin-editable, and the stage sheet shows the current stage's criterion, not the destination's |
| FR-OPP-03 | Done | Stage kept on close (`src/lib/opportunities.ts:211`) |
| BR-OPP-01 | Done | NOT NULL owner; note acceptance itself is vacuous (see FR-LEAD-04) |
| BR-OPP-02 | Missing | Open pursuit without next action is only a report row; conversion creates one with none, and the last action can be completed without replacement |
| BR-OPP-03 | Done | `opportunity-rules.ts:22`, enforced before the write |
| BR-OPP-04 | Partial | Reason id enforced (rule + CHECK); the "+ text" half (`loss_reason_text`) is never captured |
| BR-OPP-05 | Done | Note required, persisted, audited; audit omits the note text itself |
| BR-OPP-06 | Partial | True date enforced; `close_confidence` is inert (never settable) |
| BR-OPP-07 | Missing | `product.default_complexity` never read; no override flow, no who-overrode column |
| FR-OPP-04 | Done | Auto-written in-transaction on create and move; no immutability trigger (snapshots have one, stage history does not) |
| FR-OPP-05 | Missing | `owner_reassignment` table has zero references; owner_id is never updated anywhere |
| FR-OPP-06 | Partial | `updated_at` set in only two paths, so days-untouched is wrong after line/action writes; neither derived figure is shown on the record |
| FR-OPP-07 | Missing | `supportRegister()` exists but is imported by nothing; no create/resolve flow |
| FR-RSL-01 | Partial | Writer sets four fields; currency, per-line override + reason, recurring flag not capturable |
| BR-RSL-01 | Done | CHECK + server guard citing BR-RSL-01 |
| BR-RSL-02 | Done | CHECK day=1 + month input |
| FR-RSL-02 | Done | Only `v_schedule_line_weighted`; nothing stored |
| FR-RSL-03 | Partial | Column consumed by rollups but no capture path; always NULL |

## Initiatives, tenders, targets

| ID | Verdict | Evidence / gap |
|---|---|---|
| FR-INIT-01 | Partial | Milestones, co-champions, effort share: schema only, no write path or rendering; no initiative edit action at all |
| FR-INIT-02 | Done | `v_initiative_rollup` only |
| FR-INIT-03 | Done | Append-only by convention (no trigger); author + timestamp shown |
| FR-INIT-04 | Done | Single nullable FK, audited link action |
| FR-TEN-01 | Partial | Core capture works; `published_date`, `outcome_text`, `linked_opportunity_id` have no write path; linked opportunity fetched but never rendered |
| BR-TEN-01 | Done | `totalsByBasis` never sums across bases; one tile per basis |
| BR-TEN-02 | Done | CHECK + rule error with id surfaced in the sheet |
| FR-TEN-02 | Partial | Dashboard tile + amber highlighting exist; the alert job only prints to console, and nothing schedules it |
| FR-TEN-03 | Missing | Parent link stored and navigable; no conversion report exists |
| FR-TGT-01 | Partial | Four of five levels; product level unreachable from types, action and UI |
| BR-TGT-01 | Partial | Refuses over-allocation only; under-allocated sets save silently (the softened D2 reading, not the stated rule); messages carry no rule id |
| FR-TGT-02 | Partial | `reviseTarget` correct but has no caller, and drops the original's phasing rows |
| FR-BUD-01 | Deferred | Schema only; named deferrable by doc 11 under D3 |

## Forecasting, activities, reporting

| ID | Verdict | Evidence / gap |
|---|---|---|
| FR-FC-01 | Partial | Won/committed/weighted/best-case/gap-by-unit/coverage exist; prior-year repeat and expected year-end landing do not; best case is shown as a headline contrary to doc 08 §1 |
| FR-FC-02 | Done | Setting read with 50 fallback; workload reads it with no fallback (NULL if row missing) |
| FR-FC-03 | Partial | Manual trigger + DB immutability triggers (0003) are real; nothing schedules the month-end job anywhere |
| FR-FC-04 | Done | Full decomposition with visible reconciliation; doc 13 IP-09's semantic disputes (hold transitions, early-move slippage, cross-term) remain open |
| FR-FC-05 | Partial | Monthly grouping only; no quarterly or annual rollups |
| FR-ACT-01 | Partial | Only `next_action` is ever created; no meeting/call/submission/task flows, nothing attaches to leads or accounts; overdue derivation correct |
| FR-RPT-01..10 | Partial | Done: movement, hygiene exceptions. Partial: pipeline-by-stage (no owner×unit, no movement), forecast-by-month (no target comparison), initiative scorecard (no milestone), owner performance (no target/deal-size/days), win-loss (loss reasons only, no stage-of-loss), funnel (no won step, no rates), workload (rebalancing and bogged-down views missing, initiative load computed but unrendered). Missing: support register page (query is dead code) |
| FR-RPT-11 | Missing | One hand-written sentence on movement; every other report renders zeros or empty states |
| FR-RPT-12 | Done | All five conditions in `v_opportunity_hygiene`, surfaced twice |
| FR-RPT-13 | Partial | Share computed; threshold hardcoded at 50, `concentration_threshold_pct` never read; no alert surface |

## Administration, audit, RBAC, transport

| ID | Verdict | Evidence / gap |
|---|---|---|
| FR-ADM-01 | Partial | Activate/deactivate only; no add or rename for any list value |
| FR-ADM-02 | Partial | Invite + SSO linking + bootstrap solid and audited; capacity/split/availability not editable, no role/unit change after invite |
| FR-ADM-03 | Partial | Generic key/value editor; only two of five settings have readers, `concentration_threshold_pct` is ignored by the one place it should apply |
| FR-ADM-04 | Partial | Manual snapshot admin-gated but lives under Reports; audit view is last-25 with no filters; snapshot trigger writes no audit row |
| FR-AUD-01 | Partial | Audit is in-transaction on nearly every path, but fields are hand-picked subsets (stage note, closure reason, tender reason not audited); `addInitiativeNote` and `takeSnapshot` write no audit row |
| FR-AUD-02 | Partial | Append-only by convention, not by trigger or grant; none of the four surfaced-on-record items is rendered (probability note, reassignment, complexity override, target versions) |
| Doc 06 read scope | Missing | `readScope`/`canRead` have zero production callers; 37 of 37 lib query functions apply no viewer scope; only workload rows filter post-query |
| Doc 06 write scope | Partial | Enforced on opportunity stage/line/close and targets only; sixteen named mutations accept any authenticated role, including `executive_ro` (see doc 13 IP-01 and the bypass list in the audit record) |
| Doc 06 executive_ro / admin | Deviates | executive reads everything; admin's `none` scope is never consulted, so admins read and write business data |
| Doc 05 transport | Deviates | No `/api/v1`; server actions throughout; no paging, no concurrency token, no archive, several documented endpoints have no equivalent (reassign, reopen, support requests, revise, link-opportunity, exports, audit) |
| Doc 05 error contract | Partial | Rule ids exist in the rules layer but flatten to one string before the client; no violations array, no field attribution; BR-TGT-01 and lead-conversion errors carry no id |
| Doc 07 structure | Partial | Nav adds Accounts and Longlist (D-24/D-29) and transposes Targets/Reports; global search disabled; exception badge placeholder; per-role dashboard, kanban, reassign/support/actuals flows, report screens with filters and export, phasing grid editor all missing |

## Reading this list

Roughly a third of the tracked requirement ids are fully done, half are partial, and
about a dozen are missing outright. Almost every Partial is a write-path or UI gap over
a correct schema, which is why the system looks more complete than it is. The largest
single deviation is authorization: the visibility guard exists as a module and a
documented rule, and is not applied to any business query. Sequence remains doc 13's
gates; nothing here supersedes IP-01 to IP-12.
