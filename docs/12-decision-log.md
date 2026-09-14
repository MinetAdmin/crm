# 12 — Decision Log and Open-Question Register

The control document. Part A records decisions taken **in this pack** so the build can start —
each is *Provisional* until the named confirmer signs it, and reversing one means editing this
file first. Part B tracks the Spec's open questions (§12, §14, I, J) with status and what the
answer changes.

## Part A — Decisions taken in this pack

| ID | Decision | Rationale | Confirmer | Status |
|---|---|---|---|---|
| D-01 | Stack: TypeScript / Next.js / PostgreSQL, hosted on **Azure** (Container Apps consumption); Auth.js | H5 answered 2026-09-09: org runs Azure/M365 (doc 03 §2) | Sponsor | **Confirmed** (DB engine detail rides on D-21) |
| D-02 | Single deployable + one scheduled worker; no microservices | NFR-MAINT-01 | Engineering | Provisional |
| D-03 | Audit as in-transaction middleware; single write path | §11 non-negotiable #2 | Engineering | Provisional |
| D-04 | Snapshots as denormalised immutable copies (no UPDATE/DELETE grants) | §7; history must not drift | Engineering | Provisional |
| D-05 | **Department retired**; unit⊃sector is the single hierarchy; workbook `Dept` → sector | §15 correction ("retire… or define how it differs" — Spec never defines it) | BD lead | Provisional — reversible cheaply (one nullable FK) |
| D-06 | Committed threshold = system setting, default **50%**, probability-band reporting kept | §15 correction over §7's earlier 85% draft | BD leadership | Provisional |
| D-07 | Stage list + default probabilities per Spec §6, admin-editable | §6; B1/B2 may adjust values, not structure | BD team (B1, B2) | Provisional |
| D-08 | Effective month treated as **revenue recognition month** | Must pick one to phase anything; label-only change if C2 differs | BD lead + finance (C2) | Provisional — assumption |
| D-09 | `actual_amount` on schedule lines from day one | §15 measures need it; adding later restates history | BD lead (C3) | Provisional |
| D-10 | Opportunity→initiative is **one-to-many** (nullable FK) | §4 "may be linked to one"; E1 could flip it — contained migration to join table | BD lead (E1) | Provisional |
| D-11 | Default pipeline visibility: **shared read** across BD owners; write own-only | Team of six assembling one forecast; flips via setting | BD team (A4) | Provisional |
| D-12 | Individual workload visible to **self + unit head only**; leadership sees aggregates | §16 appraisal caution | BD team (J1, J5) | Provisional |
| D-13 | Owner reassignment = audited event with mandatory reason | J2 asked; audit-everything posture answers it | BD lead (J2) | Provisional |
| D-14 | Mobile: responsive web, desktop-first; phone-critical subset in doc 07 §3 | H2 unanswered; cheapest reversible position | BD team (H2) | Provisional |
| D-15 | No integrations Phase 1; outbound email only | H3; each connection is its own project (Spec) | Sponsor (H3) | Provisional |
| D-16 | Phase 1 = pipeline system; Phase 2 = pack production, gated on I1 at week 4; schema pre-carries Phase-2 landing zones | R1 mitigation (doc 01 §4) | **CEO/sponsor (I1)** | Provisional |
| D-17 | Financial year assumed Jan–Dec | §12 assumption (2026 target, Sep–Dec phasing) | Finance (D1) | Provisional — assumption |
| D-18 | Currency field everywhere, default UGX, single-currency UI | §5.3; C4 decides if a picker surfaces | BD lead (C4) | Provisional |
| D-19 | Migrate won/lost history, not just open pipeline (F5) — recommended | Unlocks win rate & loss analysis on day one (§16 table) | BD lead (F5) | Provisional — recommendation |
| D-20 | Support types: `management` and `mrs`, extensible | §15 correction; I6 will define MRS precisely | BD lead (I6) | Provisional |
| D-21 | Hosting: **Azure**. Container Apps consumption for app and worker (inside the free grant), **Azure Database for PostgreSQL Flexible Server B1ms + 32GB at ~US$15–20/mo** for the data. Prefer the South Africa North region if both services are available there. Alternatives priced and rejected: *Azure SQL free tier* ($0, but a dialect port; keeps Prisma, which does support `sqlserver`); *Oracle Always Free Ampere A1 + self-hosted Postgres* ($0, no port at all, but you own backups, restores, patching and TLS, and Oracle reclaims instances idle over 7 days at under 20% CPU, network and memory — an office-hours CRM fits that profile); *Oracle Autonomous AI Database* (rejected: Prisma ships no Oracle connector, verified against the installed package, so it costs a dialect port **and** an ORM replacement **and** wallet-based connectivity; Oracle's docs confirm PostgreSQL is not in Always Free); *external free-tier Postgres* (rejected on data protection) | Identity, licensing and the org standard are already Microsoft (H5); a solo developer on a 22-week build should not also be the DBA (doc 11 bus-factor risk); ~US$200/yr is less than an hour of team time per month | Sponsor/boss — **deadline: end of Sprint 0** | Provisional — recommendation, verified 2026-09-09 |
| D-22 | Auth: **Entra ID SSO only, single-tenant, invite-only in the app** (admin-created `app_user` record; no Azure portal assignment step); no password path; roles/units live in-app, not in Entra app roles; OID is the identity key with the recycled-email relink guard | Doc 03 §2.1; improves on the EAP pattern (standard OIDC library, no parallel password auth) | Sponsor + Entra admin (needs the app registration) | **Confirmed**, revised 2026-09-09 (see D-23) |
| D-23 | Entra "Assignment required" dropped as a required layer; access is decided by the `app_user` record alone, with a **first-run bootstrap** making the first person to sign in the administrator (audited, single-use, transaction-guarded) | Two systems to onboard one colleague is friction the admin will not sustain, and a fresh deployment otherwise has nobody able to issue the first invite. Assignment stays available as optional hardening | Sponsor (accepts that any tenant member could claim the untouched bootstrap between deploy and first admin login) | **Provisional** |
| D-24 | Console UI standardised on **shadcn/ui** (radix-nova preset): components are added from the registry and themed through the token block in `globals.css`, never written from scratch. Shell layout: collapsible icon sidebar (state persisted in a cookie, toggle in the header, keyboard ⌘B) with tooltip labels when collapsed; page identity lives in the header breadcrumb and screens render no page headings of their own; global search is a placeholder control in the sidebar that relocates to the header centre while the sidebar is collapsed, until FR-RPT-12-adjacent global search is built | User direction 2026-09-10 against the reference set in `references/`; a single component vocabulary keeps future screens consistent and future work cheap | User (design owner) | **Confirmed** 2026-09-10 |

### D-25: Public landing palette refinement

- **Decision:** Adopt warm white, neutral grays, charcoal panels, quieter sage/amber/slate
  chart accents, and crimson action backgrounds in both themes (doc 07 §1.1).
  Use a lighter red for text on dark surfaces, separate from action backgrounds.
- **Reason:** Reduce the brown cast and chart saturation while preserving the existing
  crimson identity and readable white button labels. This is design judgment, not a
  verified external brand standard.
- **Assumptions:** The request to refine colors delegates shade selection within the
  existing layout, content, and light/dark theme behavior.
- **Consequences:** Changes are scoped to the landing page. Dark panels use their own
  red text token in both themes; button backgrounds no longer inherit the dark text red.
- **Status:** Adopted 2026-09-13 under user-delegated design authority.

### D-26: Sign-in arrow treatment

- **Decision:** Inset a white circular arrow in primary sign-in pills. Animate one
  horizontal exit/re-entry on hover or keyboard focus, with no animation when the
  user prefers reduced motion (doc 07 §1.1).
- **Reason:** User requested an animated arrow based on the circular arrow in
  [the supplied reference](https://i.pinimg.com/1200x/d2/40/8c/d2408cc038b3e0db2329018a1d4cf641.jpg).
- **Assumptions:** The reference is a still image; the slide motion is an implementation
  choice. Retain the adopted crimson palette and apply the treatment to both primary
  landing sign-in links for consistency.
- **Consequences:** CSS-only presentation, with the existing sign-in destination and
  accessible link labels retained.
- **Status:** Adopted 2026-09-13 under user-delegated design authority.

### Engineering follow-up: Vitest configuration warning

`pnpm verify` on 2026-09-13 passed all 100 tests, but Vite reported ESM syntax in
`vitest.config.ts:1` being loaded as CommonJS. Follow-up: engineering should migrate
that configuration to a supported ESM extension before Vite makes its native config
loader the default. This warning is outside the landing presentation change.

### D-27: Neutral signed-in palette

- **Decision:** Align the console with D-25 through shared neutral surface and text
  tokens; use progressively lighter charcoal surfaces for cards, popovers, and
  interaction states (doc 07 §1.2). Keep crimson action fills separate from lighter
  dark-mode red text. Soften dark-mode warning/success colors to amber/sage.
- **Reason:** User requested removal of the brown cast from signed-in pages on
  2026-09-13. The previous `globals.css` dark tokens used espresso `#17110f` for cards,
  burgundy `#1a1315` for washes, and rose-taupe `#a2918f` for muted text.
- **Assumptions:** The request covers shared presentation in both themes, retaining
  the existing shell, density, chart categories, and business behavior. Shade and
  surface hierarchy choices are design judgment, not external brand requirements.
- **Consequences:** All consumers of the console tokens inherit the palette,
  including sign-in. Link variants and active navigation icons use the text accent
  instead of the darker button fill. Destructive button/badge tints use 5% at rest
  and 10% on hover to retain label contrast. Landing tokens stay separately scoped.
- **Status:** Adopted 2026-09-13 under user-delegated design authority.

### D-28: Forms in non-dismissing sheets on shadcn primitives

- **Decision:** Every data-entry form opens in a right-hand sheet (`FormSheet` on the
  shadcn Sheet). The sheet does not close on click-away or Escape, so entered content
  cannot be lost by accident; it closes on the explicit close control or a successful
  save, and offers a Reset that restores initial values. Fields compose shadcn
  Label/Input/Select/Checkbox/Textarea through `src/components/console/fields.tsx`.
  Validation and rule refusals return action state rendered inside the sheet (rule ids
  kept in the message per doc 05), replacing redirect query-param errors. The
  dedicated `/new` routes are removed; creation happens on the list pages.
  Single-control inline actions (search, a settings value, a toggle, the initiative
  link) stay inline on shadcn Input/Button.
- **Reason:** User direction on 2026-09-13: shadcn components only, all forms as
  drawers/sheets that cannot lose content on click-away, with reset support, and
  tight professional spacing.
- **Assumptions:** The account duplicate check keeps its warn-then-confirm flow, now
  in-sheet. The lead conversion banner and `?converted` param are superseded by the
  revalidated page state.
- **Consequences:** Server actions used by sheets take `(state, formData)` and return
  `{ ok }` or `{ error }` instead of redirecting with query params; cross-route
  creates still redirect to the new record. List pages load the reference data their
  create sheet needs.
- **Status:** Adopted 2026-09-13 under user direction.

### D-29: The longlist, a step-0 register before leads

- **Decision:** Add a pre-lead register named the **longlist**: a deliberately dirty
  list of company names worth pursuing, entered in bulk with no dedup or validation.
  Two tracks: `planned` (the budget-year planning list, carrying its plan year,
  BR-LL-01) and `anytime` (contingency and future work). Entries are promoted into
  leads in one transaction with the link kept both ways (BR-LL-02), parked, or
  dropped with a reason (BR-LL-03); never deleted. Progress (lead status, pipeline
  stage, outcome) and the planned-book coverage per year are derived at read time
  through the links, which is what makes the budget track automatically tracked.
  The console maps the flow with a strip (Longlist, Leads, Pipeline, Won) across
  the three pages, and the sidebar gains Longlist between Accounts and Leads.
- **Reason:** User direction on 2026-09-13: the funnel needs a step 0 where scraped
  lists, budget-planning names and someday names live before anyone types a lead.
  The name "longlist" avoids colliding with the Prospecting stage and Targets.
- **Assumptions:** Account-grain budget planning does not exist in the schema, so
  automatic entry from the budget is out of scope; the planning list is imported
  or pasted yearly and the tracking is automatic from there. Reads are shared
  across BD (D-11), so longlist rows carry no per-row visibility scope.
- **Consequences:** New `longlist_entry` table with `longlist_track_t` and
  `longlist_status_t` enums (migration 0004). Leads gain a reverse link shown on
  the lead page. Requirements recorded as FR-LL-01..03 and BR-LL-01..03 in doc 02
  §4.1a. The nav order deviates from doc 07 §1 by one inserted item.
- **Status:** Adopted 2026-09-13 under user direction.

### D-30: Account relationships and renewal/expansion follow BD

- **Decision:** Keep the first release focused on Business Development. The next CRM
  priority is account relationships and renewal/expansion opportunities.
- **Reason:** The user explicitly selected this direction on 2026-09-13.
- **Assumptions:** Shared account/contact identities remain the foundation. Commercial
  renewal dates require a verified source; policy administration remains external.
- **Consequences:** Doc 13 sequences relationship ownership and history, renewal worklists,
  then expansion pursuits after BD acceptance. These are proposed work packages, not new
  approved business rules. D-15 integration limits and D-16 conditional pack scope remain
  in force; servicing is not silently added to Phase 1. Doc 11 links the current sequence.
- **Status:** Direction confirmed; detailed scope, measures, and estimates remain to be agreed.

### D-31: Read-only roadmap in the console

- **Decision:** Add Roadmap after Reports in the signed-in sidebar, available to all
  console roles. It presents the doc 13 review snapshot: proposed gates, filterable
  IP-01–12 priorities, D-30 relationship growth, decisions, and official research links.
- **Reason:** The user requested the review and roadmap in the UI.
- **Assumptions:** This is shared product planning information, with no business records
  or live delivery data. Existing console authentication applies.
- **Consequences:** No editing or progress mutations. Labels distinguish confirmed
  direction, proposed work, and open-at-review findings. Keep the dated UI summary in
  sync with doc 13 when the plan changes; do not imply automatic status tracking.
- **Status:** Adopted 2026-09-13 under user-delegated design authority.

### D-32: Console restyled after the Kargul Studio sales CRM reference

- **Decision:** Adopt the design language of the supplied reference
  (sales-crm-kargulstudio.vercel.app) as the console standard, starting with the shell
  and the accounts page: dark-first token set with a derived light variant, pill-shaped
  controls with layered shadows, split label/value filter dropdowns applied on click,
  a 254px sectioned sidebar, flat 12px column captions with 42px data rows, colored tag
  pills for sector and unit, a segmented win-probability meter, and a summary strip
  under the table. The primary accent stays Minet crimson; the console default theme
  becomes dark with the switcher retained.
- **Reason:** The user supplied the reference and asked that the accounts page and the
  shell follow it, as the design baseline for subsequent pages. Dark default with a
  light variant and the crimson accent were confirmed by the user.
- **Assumptions:** The light variant is a derivation, not a copy, since the reference
  ships dark only. Sector tags map to tag hues by a stable name hash; units use the
  neutral tag. Win probability per account is weighted open pipeline divided by
  expected open pipeline, computed at read time from v_schedule_line_weighted, never
  stored. Sorting moved from column headers into the Sort by dropdown. Row selection
  is visual only until bulk actions exist.
- **Consequences:** Shared shadcn tokens changed, so all console pages inherit the
  palette immediately and should be brought onto the pill/table patterns as they are
  touched. The landing page does not use these tokens and is unaffected. Reference
  elements without a real backing feature (Export, tabs, notifications, avatars) were
  omitted rather than rendered dead.
- **Status:** Adopted 2026-09-14 under user-delegated design authority.

### D-33: Account details page as the management workspace

- **Decision:** With the list-side detail drawer covering the read-only glance, the
  account page is the management surface: header with edit and add-contact sheets, an
  overview tile strip sharing the drawer's derived figures, a pursuits table from the
  account's opportunities, matched open leads, contact cards, a stage-movement
  timeline, and engagement counts from the activity table over the last 30 days.
- **Reason:** The user approved this structure after the reference-derived proposal,
  and asked for engagement counts now with score cards to follow.
- **Assumptions:** Engagement tiles show real activity rows and read zero until
  activities are captured in the UI. Score cards and health grades wait for a defined
  scoring model; none is invented. Account edits go through withAudit, and a unique
  name collision is rejected citing FR-ACC-02.
- **Consequences:** New opportunity creation is absent from the page until a creation
  flow exists. All figures remain derived at read time.
- **Status:** Adopted 2026-09-15 under user-delegated design authority.

### D-34: Account merge runs from the duplicate toward a survivor

- **Decision:** Implement FR-ACC-04 as a Merge sheet on the account page: pick the
  surviving account, confirm archiving, then contacts, opportunities, activities,
  lead matches, and longlist matches move to the survivor and the source is archived,
  all in one transaction with audit entries on both accounts.
- **Reason:** The user asked for the missing merge after reviewing how accounts come
  about. Running the merge from the duplicate's page matches how duplicates are found.
- **Assumptions:** Archiving frees the source name under the partial unique index, so
  no rename is needed. No unmerge is provided; the audit trail records both sides.
- **Consequences:** Derived figures move with the children automatically. The survivor
  picker lists the first 200 active accounts alphabetically.
- **Status:** Adopted 2026-09-15 under user-delegated design authority.

## Part B — Open-question register

Status: ⛔ **Blocker** (gates migration or scope) · ❗ High (changes design) · ◽ Normal
(changes detail). "Answered-by-pack" = this pack takes a position (see Part A); the question
still deserves a real answer.

### The six that matter most

| Q | Question (abridged) | Blocks | Owner | Status |
|---|---|---|---|---|
| **I1** | Does the CRM produce the CEO pack, or only the New Business pipeline? | Phase-2 scope, plan, budget (~3× swing) | CEO / sponsor | ⛔ Open — decide by week 4 (D-16) |
| **C1** | Amounts = brokerage commission or gross written premium? | Migration G0.2; meaning of every figure | BD lead + finance | ⛔ Open |
| **C2** | What does Effective Month mean? | Migration G0.3; phasing semantics | BD lead + finance | ⛔ Open (D-08 assumption) |
| **F1** | Which workbook is authoritative? | Migration G0.1 | BD lead | ⛔ Open |
| **F2** | Repeated client rows: one deal or several? | Migration G0.4 (grain) | BD team | ⛔ Open, with an indication: a repeated month row for the same client and product is a **restatement of one pursuit as the forecast was refreshed**, not phased revenue (reported by the developer, 2026-09-09). If that holds across the sheet, totalling the column double counts, and the months migrate as history rather than as schedule lines. Still needs row-by-row BD sign-off, since a genuinely phased deal looks identical in the source. |
| **A1** | Do individual owners carry revenue targets? | Target model; owner performance report | BD leadership | ⛔ Open |

### A. Team, ownership, access
A2 owner-string mapping (⛔ for migration step, workshop item) · A3 who outside BD sees what
(❗ → doc 06 matrix drafted, confirm) · A4 cross-owner visibility (◽ D-11) · A5 who approves
overrides/targets (◽ fields exist, add approval step if needed).

### B. Pipeline
B1 stages match reality, esp. tenders? (❗ — tender path largely answered by Tender entity;
confirm stage list) · B2 realistic default probabilities (◽ admin-editable) · B3 real loss
reasons (❗ workshop item, feeds picklist) · B4 stage skipping allowed? (◽ StageService flag)
· B5 post-win handover state? (◽ `operations_ref` exists; add state only if asked).

### C. Money
C3 record actuals on won? (❗ D-09 assumes yes) · C4 non-UGX ever? (◽ D-18) · C5 revenue split
across owners/units? (❗ structural if yes — schedule-line allocation table; ask early).

### D. Targets & budget
D1 FY end (❗ D-17) · D2 top-down vs bottom-up targets (◽ BR-TGT-01 hard/soft flag) · D3 cost
budget in phase one? (❗ table built, screens sequenced late — confirm) · D4 reuse finance cost
categories (◽) · D5 mid-year revisions keep original? (◽ versioning built).

### E. Initiatives
E1 many-to-many? (❗ D-10) · E2 initiatives added mid-year? (◽ lifecycle fields exist) ·
E3 August Commitment meaning (◽ migration mapping) · E4 172-vs-157 register reconciliation
(⛔ for migration step 7) · E5 initiative target entered or derived? (◽ entered, per §5.4).

### F–H. Data, reporting, build
F3 product list sign-off (⛔ workshop) · F4 UBA bancassurance rows special? (◽) · F5 history
depth (❗ D-19) · F6 other spreadsheets? (◽ cutover sweep) · G1 external reporting formats
(◽) · G2 slowest hand-built report → build first (◽ ask at workshop; likely the pack tables)
· G3 forecast as number or range (◽ all bases exist; presentation choice) · G4 Excel/PPT pack
continuity (◽ XLSX export in Phase 1) · H1 admin owner (❗ named person needed before go-live)
· H2 phone use (◽ D-14) · H3 integrations (◽ D-15) · H4 go-live date drivers (❗ re-plan doc 11
if externally driven) · H5 auth/hosting standard — **answered 2026-09-09: Azure/M365; Entra
SSO invite-only, Azure hosting (D-01 confirmed, D-22)**.

### I. Pack questions
I2 where do actuals/proformas come from (❗ Phase 2; `revenue_actual` accepts either) · I3
what is a proforma exactly (❗ Phase 2 modelling) · I4 is Retention a pipeline or a measured
budget line (❗ Phase 2 scope) · I5 who maintains tender registers (◽) · I6 what is MRS (◽
D-20) · I7 can a sector belong to two units / groupings change (❗ if yes, unit becomes a
period-varying rollup — flag early) · I8 generate the pack or feed a deck (❗ sizes Phase 2).

### J. Workload
J1 purpose: rebalancing vs appraisal (❗ D-12, dashboard purpose statement) · J2 reassignment
audited (◽ D-13) · J3 championing in job description (◽ capacity split fields exist) · J4
reasonable book size (◽ per-user capacity reference) · J5 peers see each other's load (◽
D-12) · J6 non-BD pursuit owners (◽ doc 06 note).

## Change protocol

An answer lands → update the question's status here, flip any linked D-xx to Confirmed/Revised,
then propagate to the affected doc(s) in the same commit. This file's history *is* the
decision history.

## Implementation review follow-up, 2026-09-13

The [CRM review and BD roadmap](13-bd-crm-review-and-roadmap.md) records IP-01–12
against baseline `0c90465`, with targeted delta notes through `4e78cab`. Engineering
owns authorization, session revocation, concurrency, next-action invariants, auditing, validation, financial
correctness, and job-delivery fixes. The BD lead and project lead own the documented
policy/migration contradictions and release acceptance. Each finding includes evidence,
a concrete follow-up, and a validation condition. All are open at review publication.

The release sequence is proposed, not an approved reduction of Phase-1 scope. D-12
leadership workload visibility, admin/business-role composition, Server Actions versus
doc 05 REST transport, and migration grain guidance require explicit resolution.
Existing D-15/D-16 and FR/BR requirements remain in force. Track closure in doc 13
with implementation commits and evidence; do not silently mark these as implemented.
