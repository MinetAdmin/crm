# 01 — Review of the Scoping Document

**Document reviewed:** "BD CRM: Requirements and Data Model, draft v0.1" (`CRM review.pdf`, 21 pages, in git history at commit 3ce7f35)
**Reviewed:** 2026-09-09
**Verdict:** The Spec is unusually strong for a v0.1 — it is evidence-driven, the data model is
essentially build-ready, and it is honest about its own open questions. It is, however, a
*requirements and data* document, not a *build* document. It contains almost nothing an engineer
needs on day one: no architecture, no non-functional requirements, no API or UI definition, no
security model, no test criteria, no plan. This pack supplies those. One unresolved question
(I1, "does the CRM produce the CEO pack?") is large enough to change the size of the system by
roughly a factor of three and must be answered before the delivery plan in doc 11 is committed.

---

## 1. What the Spec gets right

These are load-bearing decisions the rest of this pack builds on without change:

1. **Requirements derived from evidence, not preference.** Every rule in §3 traces to a specific
   defect in the live workbooks (the `#REF!` errors, the 16 owner strings for 6 people, the
   impossible date 31/11/2026). This makes the validation rules non-negotiable rather than
   stylistic.
2. **The grain decision** (§4, §5.3): an Opportunity is one pursuit; money lives in dated
   Revenue Schedule Lines beneath it. This single decision eliminates the three-way duplication
   and the reconciliation sheet. It is the heart of the model and it is correct.
3. **Stage separated from outcome** (§5.2, §6), with exit criteria per stage and stage-defaulted
   probability. Win rate and loss-stage analysis are impossible without this.
4. **Derived, never typed** (§5.4, §7): weighted amounts, rollups, gaps and totals are always
   calculated. The Spec correctly identifies typed aggregates as the root failure of the sheets.
5. **Monthly forecast snapshots and the movement report** (§7) — called out, correctly, as the
   single most useful report a BD forecast produces.
6. **Stage History as a first-class entity written from day one** (§16) — correctly identified
   as the only thing that cannot be added retrospectively.
7. **The custom-build warning** (§11): snapshots, field-level audit, and role-based visibility
   are named as the three things a custom build usually cuts and must not. This pack treats all
   three as phase-one acceptance criteria, not enhancements (see docs 06, 10).
8. **The §15 corrections** from the CEO Summit pack (unit⊃sector hierarchy, 50% committed
   threshold, monthly target phasing, typed support interventions, Tender as its own entity)
   are adopted wholesale — they are cheaper now than after the schema exists, exactly as the
   Spec says.

## 2. Gaps this pack fills

| Gap in the Spec | Consequence if unfilled | Filled by |
|---|---|---|
| No numbered requirements | Nothing testable, no traceability | Doc 02 (PRD) |
| No architecture or stack | Can't start building; "custom web app" is a direction, not a design | Doc 03 |
| No non-functional requirements at all — security, backup, availability, hosting, data protection | The failure §11 warns about arrives via operations instead of features | Doc 03 |
| Data model has entities and fields but no types-as-schema, keys, or constraints | Every engineer re-derives it differently | Doc 04 + schema.sql |
| No API definition | Front end and back end negotiate ad hoc | Doc 05 |
| Visibility questions raised (A3, A4, J1, J5) but no permission model proposed | Row-level security retrofitted after launch — the Spec itself calls this expensive | Doc 06 |
| 14 entities, zero screens | UI scope unknowable; H2 (mobile?) unanswerable without a screen list | Doc 07 |
| Report list exists (§9, §15, §16) but formulas are prose | "Committed" or "coverage" computed two ways by two developers | Doc 08 |
| Migration sequence exists (§10) but no gates, artifacts or sign-off criteria | Cleanup decisions made repeatedly and inconsistently — the exact failure §10 warns against | Doc 09 |
| No acceptance criteria; §16 warns trend reports can't be tested at launch but nothing says what *is* tested | Launch argument about whether the build "works" | Doc 10 |
| No plan, phases or estimate | I1's factor-of-three scope swing has nowhere to land | Doc 11 |
| ~40 open questions in §12/§14/I/J with no owner or status tracking | Questions decay into silent assumptions | Doc 12 |

## 3. Internal issues found in the Spec

Minor, but worth recording:

1. **Entity count drift.** §4 says "twelve entities… bringing the model to fourteen" (Tender,
   Stage History). But User *and* Team are listed as one entity, and Reference List is really a
   family of lists. The real table count is larger (~20 with join/history/snapshot tables);
   doc 04 enumerates them exactly. Cosmetic, but quote table counts from doc 04, not §4.
2. **Committed threshold stated twice.** §7 defines Committed at "50% to match current
   practice"; §15 reveals the earlier draft assumed 85% and corrects to 50%. Resolved in this
   pack as a configurable system setting defaulting to 50% (Decision D-06).
3. **Department is left ambiguous.** §5 makes unit *and* department required picklists; §15
   says "retire department as a separate concept or define how it differs." The Spec never
   picks. This pack provisionally retires it (Decision D-05) — the schema carries unit⊃sector
   only, and the workbook `Dept` column migrates to sector, exactly as the pack equates them.
4. **Actual amount on won deals** is raised only as question C3, but the §15 measure table
   (forecast accuracy, YTD actual) already depends on it. The schema adds `actual_amount` to
   the schedule line now (Decision D-09); it is cheap now and restates history if added later —
   the same argument the Spec makes for the currency field.
5. **"Recurring" flag on the schedule line** (§5.3) is specified and then argued against in its
   own notes column ("handled by carrying the pursuit forward rather than by a renewal type").
   Kept in the schema because it is one boolean, but flagged as a candidate for removal at the
   controlled-list workshop.

## 4. Top risks

Ranked. The first two are project-level; the rest are build-level.

| # | Risk | Why it's real | Mitigation in this pack |
|---|---|---|---|
| R1 | **Scope question I1 unresolved** — pack-production vs pipeline-only is a ~3× scope difference (retention, policy fees, actuals, proformas, phased budget, 36-slide reporting layer) | The Spec calls it "the largest open question in the project" and it is still open | Phase boundary drawn so Phase 1 (pipeline) is useful standalone *and* the schema doesn't preclude Phase 2: revenue_type, value_basis, actual_amount, monthly target phasing are all in the day-one schema. Delivery plan (doc 11) has an explicit I1 gate before Phase 2 commitment. |
| R2 | **The three "discipline" features get cut in a squeeze** (snapshots + movement report, field-level audit, row-level visibility) | §11's own prediction; nothing visible depends on stage history at launch | All three are phase-one acceptance criteria in doc 10; test plan tests stage-history writing and snapshot correctness on seeded data at launch, per §16 |
| R3 | **Migration blocked on five questions** (C1, C2, F1, F2, A1) while build proceeds, then rushed | The Spec: "nothing can be migrated and no forecast can be trusted until these five are settled" | Doc 09 sequences the controlled-list workshop and the five blockers in week 1–2, decoupled from the build track; migration has hard entry gates |
| R4 | **C1 (commission vs premium) answered "premium"** | The Spec: "everything… every figure changes meaning"; would add premium, commission-rate and derived-commission fields | Schema isolates money on the schedule line; doc 04 documents the C1-contingent columns so the change is one table, not a redesign |
| R5 | **Custom build = permanent maintenance obligation for a ~6–25 user tool** | §11's stated trade-off; no internal standard confirmed (H5) | Doc 03 chooses a deliberately boring, single-deployable stack with managed hosting and managed Postgres; smallest credible ops surface |
| R6 | **Trust lost in month one** — empty trend reports read as defects | §16's own warning | "Insufficient data, meaningful from <date>" is a hard UI requirement (FR-RPT-11); trend reports excluded from launch acceptance, reviewed at month four |
| R7 | **Load metrics read as appraisal**, so owners avoid difficult pursuits | §16's caution | Visibility restricted to self + unit head (Decision D-12, pending J1/J5); purpose statement required at dashboard rollout |

## 5. What to do next

1. Confirm or overturn the provisional decisions in doc 12 — one hour with the sponsor.
2. Put I1 to the CEO/sponsor with the two scope options and cost delta from doc 11.
3. Hold the controlled-list workshop (Spec §10 step 1) — it is useful regardless of any answer.
4. Start the build track against docs 03–07; nothing in it is blocked by the five migration
   questions.
