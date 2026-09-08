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
| D-21 | Database hosting: **recommend** Azure Database for PostgreSQL B1ms (~US$15–20/mo); the genuinely-$0 alternative is the Azure SQL free offer (1–2 week port + daily cold starts); external free-tier Postgres rejected on data-protection grounds | Doc 03 §8: compute is free on Azure at this scale, the DB is the only real cost; "no cost" vs "no trade-off" is the boss's call to make explicitly | Sponsor/boss — **deadline: end of Sprint 0** (ORM provider follows it) | Provisional — recommendation A |
| D-22 | Auth: **Entra ID SSO only, single-tenant, invite-only at two layers** (Entra "Assignment required" + admin-created `app_user` record); no password path; roles/units live in-app, not in Entra app roles; OID is the identity key with the recycled-email relink guard | Doc 03 §2.1; improves on the EAP pattern (Entra-side enforcement, standard OIDC library, no parallel password auth) | Sponsor + Entra admin (needs the app registration) | **Confirmed** direction |

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
| **F2** | Repeated client rows: one deal or several? | Migration G0.4 (grain) | BD team | ⛔ Open |
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
