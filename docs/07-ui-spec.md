# 07 — UI Specification

Screen inventory and key flows. Responsive web, desktop-first (Decision on H2, doc 03 §6).
Wireframes are deliberately not included — layout is the implementing designer's call; this
document fixes *what each screen must contain and enforce*.

## 1. Global

- **Navigation:** Dashboard · Leads · Opportunities · Initiatives · Tenders · Reports ·
  Targets · Admin (role-dependent).
- **Shell (D-24):** shadcn/ui throughout; collapsible icon sidebar with tooltip labels when
  collapsed; page identity lives in the header breadcrumb, so screens render no page headings
  of their own.
- **Global search** across accounts, opportunities, leads, tenders by name/ID.
- **Exception badge** in the nav: count of the user's hygiene exceptions (FR-RPT-12).
- Every derived figure is visually distinct from entered figures (subtle "calculated" styling) —
  the entered-vs-derived boundary is the core idea of the system; the UI should teach it.
- Every report screen implements the **insufficient-data rule** (FR-RPT-11): a labelled notice
  with the "meaningful from" date, never an empty chart or a zero.
- Concurrency conflicts (409) render as "Someone else changed this record — review and retry",
  showing whose change and when.

### 1.1 Public landing palette (D-25)

The landing page uses warm white (`#faf9f8`), neutral gray text and washes, and
charcoal panels (`#1b1e22`). Dark mode uses a charcoal page (`#111316`) with lighter
cards and panels. Sign-in buttons and text selection retain crimson (`#c8102e`)
with white text in both themes. Red text on dark surfaces uses `#e85b60` independently
of button backgrounds. Charts use muted sage (`#91bda5`), amber (`#d1ad68`), and slate
(`#a5acb5`), with the existing category labels retained. Palette tokens remain scoped
to `.landing` in `src/components/landing/landing.css`.

Primary sign-in links use a white circular arrow inset at the right edge (D-26).
On hover or keyboard focus the arrow slides right and re-enters from the left once;
reduced-motion users see a static arrow.

## 2. Screens

### 2.1 Dashboard (per role)
- bd_owner: my open pipeline (count, gross, weighted), my next actions due this week, my
  exceptions, my tenders with deadlines, my targets vs won+weighted.
- unit_head: unit versions of the above + owner workload summary + concentration alert.
- bd_leadership / executive_ro: forecast headline (won / committed / weighted vs target),
  gap by unit, support register count, movement summary since last snapshot.

### 2.2 Leads
- **List** with filters (status, source, unit, owner, age); stale/unowned highlighted.
- **Capture form** — fast entry; duplicate-account prompt inline (FR-ACC-02); BR-LEAD rules
  enforced with per-field messages.
- **Detail** with activity log and the **Convert** action: a modal walking the four conversion
  criteria (Spec §6) as a checklist; disabled criteria explain what is missing; on success,
  deep-link to the new opportunity.

### 2.3 Opportunities
- **List / board:** table view (sort/filter by stage, owner, unit, month, value) and a kanban
  by stage. Cards show weighted value, age-in-stage, exception flags.
- **Detail** — the workhorse screen:
  - Header: account, name, owner + co-owners, stage chip, outcome, probability (with override
    marker + note), expected close + confidence, initiative link.
  - **Stage control:** advance/retreat via a control that shows the target stage's *exit
    criterion* and enforces BR-OPP-03/05 inline. Stage changes only through this control.
  - Tabs: **Schedule lines** (inline grid: product, month, expected, currency, type,
    per-line probability, derived weighted total row — clearly calculated); **Activity &
    next action** (BR-OPP-02: an open opportunity always shows its current next action;
    completing one prompts for the next); **Support** (typed requests, resolution);
    **History** (stage history timeline + surfaced audit: probability overrides,
    reassignments).
  - **Close** flow: outcome picker → reason (required for lost/on-hold) → actuals per line for
    won (D-09) → confirmation that stage is retained.
- **Reassign** action (unit_head+): to-owner + mandatory reason (FR-OPP-05).

### 2.4 Initiatives
- **Register list:** name, unit/sector, champion, target, delivered (derived), weighted
  expected (derived), gap (derived), status, next milestone + date.
- **Detail / scorecard:** rollup figures with drill-through to contributing opportunities;
  append-only evidence log (author + timestamp shown); milestone with completion date.

### 2.5 Tenders
- **Register:** filterable by type/status/deadline; deadline countdown coloring; value shown
  **with its basis label always adjacent** (BR-TEN-01: the UI never renders a mixed-basis
  total).
- **Detail:** lifecycle status control, key dates, outcome + reason once decided, link to
  opportunity, parent prequalification chain visualised (prequal → tender → opportunity).

### 2.6 Reports
One screen per report in doc 08, all sharing: period/unit/owner filter bar, "as of" indicator,
XLSX export, insufficient-data handling. The **movement report** gets a waterfall layout
(added / revised / probability / won / lost / slipped between two snapshot months).
The **workload suite** carries the purpose statement (doc 06 §5) and respects D-12 visibility.

### 2.7 Targets
- Year view: hierarchy company → unit → initiative/owner with **unallocated remainder**
  displayed while drafting (BR-TGT-01); monthly phasing editor (grid, must sum to annual);
  version history side-by-side (original vs revised, D5).

### 2.8 Admin
- Picklist manager (FR-ADM-01): per list — add, rename, deactivate; usage count per value;
  hard delete only when unused.
- Users (FR-ADM-02): role, unit, capacity fields, availability, active.
- Settings (FR-ADM-03): committed threshold, ageing days, coverage minimum, concentration
  threshold, FY end.
- Snapshots (FR-ADM-04): list with status; manual trigger; failure alert state.
- Audit log browser: filter by entity/record/user/date.

## 3. Mobile-critical subset (H2 provisional)

Must be genuinely usable on a phone: lead capture form, my pipeline list, opportunity detail
(read + complete/set next action + stage change), tender deadline list, exception list.
Everything else may degrade to "readable".

## 4. Empty states

Every list's empty state says what the list is for and what fills it. Report empty states
follow FR-RPT-11. The first-quarter experience decides whether the team trusts the system
(Spec §16) — empty states are part of the product, not polish.
