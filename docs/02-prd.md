# 02 — Product Requirements Document (PRD)

Derived from the Spec (§1–§16). Requirement IDs used across the whole pack.
Conventions: **FR** functional requirement, **BR** business rule enforced at save,
**NFR** non-functional (detailed in doc 03). *MUST* items are phase-one; *SHOULD* items are
phase-one unless the delivery plan defers them explicitly.

## 1. Problem statement

The BD team runs pipeline, initiatives and forecast from divergent Excel workbooks with no IDs,
no controlled vocabularies, no clean dates, fragile cross-sheet links (already broken with
`#REF!` in a live copy), and no version control. The CEO Summit pack is assembled by hand:
2,859 text boxes, zero chart objects. The CRM's first job is *data discipline enforced by the
system*: single records, single owners, controlled lists, derived aggregates, and an audit
trail (Spec §1–§3, §15).

## 2. Users and personas

| Persona | Description | Primary needs |
|---|---|---|
| BD Owner | One of ~6 BD staff owning leads, opportunities, tenders | Their pipeline, next actions, exceptions on their own book |
| Unit Head | Leads a unit (Unit 1 = EMT+IND, Unit 2 = SPE+SME, Unit 3 = EBM) | Unit pipeline, owner performance, workload/rebalancing views |
| BD Leadership / Management | Head of BD, exec team | Forecast vs target, movement, initiative scorecard, win/loss |
| CEO / Executive (read-only) | Consumes the support register and summary views | Management-support register, headline forecast |
| Administrator | Maintains picklists, users, targets, settings | Admin UI (Spec H1) |

Team size assumption: 6 BD owners across 3 units (Spec §12); design for ≤25 users.

## 3. Scope and phasing

**Phase 1 — New Business pipeline system** (this PRD): lead capture and qualification,
opportunity pipeline with revenue schedule, strategic initiatives with rollups, tender register,
revenue targets with monthly phasing, forecasting with snapshots, reporting, workload/capacity,
picklist administration, audit, RBAC.

**Phase 2 — Pack production** (conditional on question I1): retention and policy-fee revenue
lines, YTD actuals and outstanding proformas (finance feed or manual monthly load, per I2),
phased-budget achievement/variance, prior-year comparatives, pack export. The Phase-1 schema
must not preclude Phase 2 — see doc 04 §"Phase-2 readiness".

**Out of scope (both phases):** policy administration, claims, premium collection, commission
accounting, client servicing (Spec §1). The CRM stops at won-and-handed-over and carries only a
reference to the resulting account.

## 4. Functional requirements

### 4.1 Accounts and contacts (ACC)

- **FR-ACC-01** MUST maintain Account records (organisation grain) with sector, unit, country
  (default UG) and relationship history. Client *name is never a key* (Spec §3): the system ID is.
- **FR-ACC-02** MUST detect likely duplicate accounts on create (normalised-name match: case,
  whitespace, punctuation folded) and prompt to use the existing record.
- **FR-ACC-03** MUST maintain Contacts under an account: name, role, email, phone,
  decision-maker flag.
- **FR-ACC-04** SHOULD support account merge (survivor keeps all children; merge is audited).

### 4.1a Longlist (LL) — D-29

- **FR-LL-01** MUST hold the pre-lead register: company name (free text, deliberately
  unvalidated), track (`planned` | `anytime`), plan year for planned entries, source,
  optional unit and sector, notes. Bulk paste is the primary entry path.
- **FR-LL-02** MUST promote an entry into a lead in one transaction, marking the entry
  *picked* and linking entry→lead. Entries are never deleted; parked and dropped names
  stay on the register.
- **FR-LL-03** MUST derive each entry's onward progress (lead status, pipeline stage,
  outcome) and the planned-book coverage per budget year at read time via the links.
- **BR-LL-01** A planned entry names its budget year.
- **BR-LL-02** Status *picked* requires the promoted lead link.
- **BR-LL-03** Dropping a name requires a reason.

### 4.2 Leads (LEAD) — Spec §5.1

- **FR-LEAD-01** MUST capture leads with the §5.1 field set; company name checked against
  accounts per FR-ACC-02.
- **FR-LEAD-02** MUST require lead source, unit, owner and status; sector and product-of-interest
  (multi-select) optional at capture.
- **BR-LEAD-01** At least one contact method (email or phone) is required before status can move
  to *qualified*.
- **BR-LEAD-02** Status *disqualified* requires a disqualification reason from the managed list.
- **FR-LEAD-03** MUST derive lead age from created date and surface unowned / stale leads in the
  exception views ("unassigned leads are the ones that die").
- **FR-LEAD-04 (conversion)** MUST convert a lead to an opportunity only when all four
  conditions hold (Spec §6): account identified and resolved against the account list; a
  decision-making contact named; product and indicative value known; an owner has accepted.
  Conversion atomically: creates the account if absent; creates the opportunity at *Prospecting*
  or *Information gathering*; links opportunity→lead (`source_lead`) and lead→opportunity
  (`converted_opportunity`, read-only); sets lead status to *converted*. Leads are never deleted
  on conversion — the funnel audit trail is the point.

### 4.3 Opportunities (OPP) — Spec §5.2, §6

- **FR-OPP-01** MUST implement the §5.2 field set, including separated Stage and Outcome,
  close-date confidence, forecast category, typed management-support intervention, complexity
  weight, and single accountable owner with multi-select co-owners.
- **FR-OPP-02** Stage list and default probabilities (managed, admin-editable):
  Prospecting 10% → Information gathering 20% → Engaged 35% → Quotation prepared 50% →
  Proposal or tender submitted 70% → Shortlisted or final negotiation 85%. Each stage carries
  its exit criterion text, shown in the UI at the point of stage change.
- **FR-OPP-03** Outcome values: open, won, lost, on hold, withdrawn. An opportunity keeps its
  last stage when it closes, so stage-of-loss is analysable.
- **BR-OPP-01** Owner is mandatory at save. (Spec §15: 40 of 119 live opportunities unowned,
  UGX 686m — "this alone justifies validation at the point of entry.")
- **BR-OPP-02** An open opportunity MUST have a next action and a due date.
- **BR-OPP-03** An opportunity cannot move beyond *Quotation prepared* without ≥1 revenue
  schedule line.
- **BR-OPP-04** Outcome cannot be set to lost or on hold without a reason (picklist + text).
- **BR-OPP-05** Probability may be overridden away from the stage default only with a
  justification note; the override and note are audited.
- **BR-OPP-06** Expected close date is a true date. Uncertainty goes in close-date confidence
  (confirmed / estimated / to be confirmed), never as text in the date field.
- **BR-OPP-07** Complexity weight defaults from product and pursuit type; override requires a
  note and records who overrode it (Spec §16 caution).
- **FR-OPP-04** MUST write a Stage History row automatically on every stage change (from-stage,
  to-stage, who, when). Never hand-written, never editable. (Spec §16: "cannot be added
  retrospectively.")
- **FR-OPP-05** MUST record owner reassignment as an audited event with a reason (provisional
  answer to J2; Decision D-13).
- **FR-OPP-06** MUST track `last_updated` as a system timestamp and `days in stage` /
  `days untouched` as derived values.
- **FR-OPP-07** MUST support management-support requests typed as *Management* or *MRS*
  (extensible list, pending I6), with free-text ask, requested-by/at, and a resolution state —
  this feeds the CEO support register.

### 4.4 Revenue schedule lines (RSL) — Spec §5.3

- **FR-RSL-01** MUST hold money only on schedule lines: product, effective month (true period),
  expected amount, currency (default UGX), probability (inherited from opportunity, per-line
  override with reason), revenue type (new business / renewal / cross-sell / upsell), recurring
  flag.
- **BR-RSL-01** Expected amount must be numeric and > 0; type-enforced (the `#VALUE!` class of
  error becomes impossible).
- **BR-RSL-02** Effective month is a real month+year period, never text.
- **FR-RSL-02** Weighted amount = expected × effective probability, always derived, never
  entered, never stored as an editable field.
- **FR-RSL-03** MUST capture `actual_amount` on lines of won opportunities (Decision D-09,
  pending C3) so forecast accuracy is measurable.

### 4.5 Strategic initiatives (INIT) — Spec §5.4

- **FR-INIT-01** MUST implement the §5.4 field set: managed name, unit + sector (mandatory),
  champion (user link), optional co-champions with effort share, annual revenue target
  (entered), status from the managed list, next milestone (text + real date + completion date).
- **FR-INIT-02** Revenue delivered, expected-by-period and gap-to-target are rollups from
  linked opportunities/schedule lines — never typed.
- **FR-INIT-03** Evidence/comments are an append-only note log with author and timestamp.
- **FR-INIT-04** Opportunity→initiative is a real FK, one-to-many (opportunity belongs to at
  most one initiative — provisional, pending E1; Decision D-10).

### 4.6 Tenders (TEN) — Spec §15

- **FR-TEN-01** MUST implement the tender register as its own entity with the §15 field set:
  type (prequalification / tender), issuing body and title, sector + unit, recorded value,
  **value basis** (brokerage income / sum insured / premium), status lifecycle (to submit,
  submitted, in evaluation, prequalified, won, lost, withdrawn), key dates, outcome + reason,
  optional linked opportunity, parent prequalification link.
- **BR-TEN-01** Values on different bases are never summed; every aggregate is grouped or
  filtered by value basis.
- **BR-TEN-02** Outcome and reason are required once status reaches a decided state.
- **FR-TEN-02** MUST alert on approaching submission deadlines — "the only genuinely
  time-critical alert in the system."
- **FR-TEN-03** MUST report prequalification→tender conversion via the parent link.

### 4.7 Targets and budget (TGT, BUD) — Spec §8, §15

- **FR-TGT-01** MUST hold revenue targets at company, unit, initiative, owner and optional
  product level, per year, **with monthly phasing** (Spec §15: 78.7% of budget falls Jan–Aug;
  without phasing neither achievement nor Sep–Dec comparison is producible).
- **BR-TGT-01** The system refuses to save a unit-target set whose sum ≠ company target, and
  shows the unallocated remainder while a set is being built. (If D2 answers "report variance
  only", this softens to a warning — one flag.)
- **FR-TGT-02** SHOULD version targets: a mid-year revision supersedes but never overwrites the
  original (pending D5).
- **FR-BUD-01** SHOULD hold BD cost budget lines: cost category (managed list seeded from Spec
  §8.2), owning unit, period, budgeted amount, actual spend, optional link to opportunity or
  initiative. *Deferred to late Phase 1 / Phase 2 if D3 answers "not phase one".*

### 4.8 Forecasting (FC) — Spec §7

- **FR-FC-01** Forecast views, each an aggregation of the same schedule lines (exact formulas
  in doc 08): closed-and-won, committed (threshold-based), weighted pipeline, best case,
  prior-year repeat, expected year-end landing, gap to target, coverage ratio.
- **FR-FC-02** The committed threshold is a system setting, default **50%** (Spec §15
  correction; Decision D-06).
- **FR-FC-03** MUST snapshot the full open pipeline and won book at each month end —
  automatically, immutable, stored not overwritten. Manual snapshot trigger for the admin.
- **FR-FC-04** MUST produce the movement report between any two snapshots, decomposed into:
  new opportunities added, amounts revised, probability changes, deals won, deals lost,
  deals slipped to a later month (doc 08 §3).
- **FR-FC-05** Phasing is always by schedule-line effective month; monthly/quarterly/annual
  views are groupings, never separate columns.

### 4.9 Activities (ACT)

- **FR-ACT-01** MUST record activities (meeting, call, submission, task) against a lead,
  opportunity or account, with owner, due date and completion date. Next actions are
  activities; an action without a completion date past its due date is *overdue* (Spec §16).

### 4.10 Reporting and exceptions (RPT) — Spec §9, §16

- **FR-RPT-01…10** The report set of doc 08: pipeline by stage; weighted forecast by month;
  forecast movement; initiative scorecard; owner performance; win/loss analysis; funnel
  conversion; management-support register; ageing & hygiene exceptions; workload suite
  (owner workload summary, rebalancing view, bogged-down exceptions, concentration alert,
  initiative load, unowned queue).
- **FR-RPT-11** Any report whose accumulation period has not elapsed MUST display
  "insufficient data — meaningful from <date>", never a zero or an empty chart (Spec §16).
- **FR-RPT-12** Ageing exception: any open opportunity untouched for 30 days (setting) appears
  on the exception report; likewise no-next-action, overdue action, close date in past,
  missing schedule lines.
- **FR-RPT-13** Concentration alert fires when the largest owner's share of committed value
  exceeds a threshold setting (fires at 79% on current book).

### 4.11 Administration (ADM) — Spec H1

- **FR-ADM-01** MUST provide an admin UI for every managed picklist (add / rename / deactivate;
  never hard-delete a value in use). List values referenced by records are deactivated, not
  removed.
- **FR-ADM-02** MUST provide user management: role, unit, capacity reference (nominal
  concurrent pursuits, pipeline/initiative split), availability %, active flag. Access is
  **invite-only via Entra SSO** (doc 03 §2.1): the admin creates the user record and assigns
  the person to the Entra app; there is no self-service signup and no password login.
- **FR-ADM-03** MUST expose system settings: committed threshold, ageing days, coverage
  minimum, concentration threshold, financial year end (pending D1).
- **FR-ADM-04** MUST let an admin trigger/verify the month-end snapshot and view the audit log.

### 4.12 Audit (AUD) — Spec §3, §11

- **FR-AUD-01** MUST keep a field-level audit trail on all business entities: entity, record,
  field, old value, new value, who, when. Answers "who changed a probability and when."
- **FR-AUD-02** Audit records are append-only and readable by admins; probability overrides,
  target changes, owner reassignments and complexity overrides are additionally surfaced on the
  record itself.

## 5. Business-rule summary (save-time enforcement)

All BR-* rules above are **conditions at the point of saving, not reports after the fact**
(Spec §6). The API rejects the write with a structured validation error (doc 05 §5); the UI
prevents the state where possible and explains where not.

## 6. Explicitly not building

- Free-text keys of any kind; client name is display-only.
- Typed aggregates anywhere (totals, weighted amounts, gaps, delivered figures).
- Text placeholders in date fields (TBA/TBD/N-A/quarters/month names).
- Multi-person text in a single owner field.
- A reconciliation view between entities — the relational model *is* the reconciliation.
