# 10 — Test Plan and Acceptance Criteria

The Spec's sharpest testing insight (§16): trend reports are structurally incapable of output
at launch, so **test the recording now, accept the reports at month four**. This plan encodes
that, and makes the three §11 non-negotiables (snapshots, audit, visibility) explicit
launch-acceptance items so they cannot be quietly cut.

## 1. Test strategy

| Layer | What | How |
|---|---|---|
| Unit | Every BR-* rule; every formula in doc 08 (forecast bases, movement buckets, workload signals, win-rate pair) | Pure functions / view queries against fixtures; CI-gated |
| Integration (API) | Every endpoint in doc 05: happy path + each 422 violation citing the right BR id + 409 concurrency + 403/404 visibility | API tests against a real Postgres |
| Migration | The ETL pipeline end-to-end against a **fixture workbook** reproducing every §3 defect (blank separators, TOTAL row, merged cells, `#REF!`, text-space amount, 31/11/2026, mixed stage/outcome, 16 owner strings, dual versions) | The pipeline must clean or halt on every defect; reconciliation gate math asserted |
| UAT | Scripted walkthroughs per persona (doc 07 flows) on staging with migrated data | BD team executes; issues triaged before cutover |
| Security | AuthZ matrix sweep (every role × every endpoint), OWASP baseline scan, backup restore drill | Before go-live |

## 2. Seeded-data proofs (launch acceptance for time-dependent features)

Per Spec §16, on seeded fixtures the build must demonstrate at launch:

- **T-SEED-01** Stage changes write correct `stage_history` rows (from, to, who, when);
  direct stage edits are impossible via API.
- **T-SEED-02** Backfilled history rows are flagged and excluded from throughput measures.
- **T-SEED-03** Two seeded snapshots produce a movement report whose buckets sum exactly to
  the weighted delta (doc 08 §3 reconciliation assertion).
- **T-SEED-04** Snapshot immutability: UPDATE/DELETE on snapshot tables fails at the DB
  permission layer.
- **T-SEED-05** Workload signals compute correctly on a seeded book (including the
  count-vs-value trap case: 3 pursuits/UGX 420m vs 8 pursuits/UGX 12m).
- **T-SEED-06** Every not-yet-meaningful report returns `insufficient_data` + correct
  `meaningful_from` date; UI renders the notice.

## 3. Launch (phase-one) acceptance criteria

**In** (all must pass):
1. All BR-* rules enforced at save with correct error contract — demonstrated per rule.
2. Lead→opportunity conversion is atomic and audit-traceable both directions.
3. Field-level audit present on all business tables; probability override, reassignment and
   complexity override surfaced in UI (§11 non-negotiable #2).
4. Month-end snapshot runs automatically, retries, alerts on failure, admin-triggerable
   (§11 non-negotiable #1); T-SEED-03/04 pass.
5. Visibility matrix (doc 06) enforced server-side; matrix sweep green (§11 non-negotiable #3).
6. All day-one reports (doc 08 §6 "day one" rows) correct against migrated data.
7. Migration exit gates G3.1–G3.5 signed off, including the line-by-line money reconciliation.
8. NFR smoke: backup restore drill done; SSO invite-only verified (a tenant account with no
   `app_user` record is refused, and the first-run bootstrap is spent, per doc 03 §2.1); an org
   MFA policy covers the app; <2s dashboards on 10× seeded volume.
9. T-SEED-01…06 pass.

**Explicitly out at launch** (accepted later, per §16 — do not argue about these in go-live
week):
- Bogged-down exceptions report → **month-four review**.
- Forecast movement on *real* data → month two (first pair of real snapshots).
- Stage advances/month, actions-overdue trends → months one–two.
- Forecast accuracy → first post-launch quarter.
- Win rate on real data → immediate only if F5 migrated history; else accumulating.

## 4. Month-four review (calendar it at go-live)

Re-run acceptance on the deferred reports with three months of real history; verify stage
history completeness (every stage change has a row; zero hand-edits); review picklist drift
and any probability-override abuse patterns with the BD lead.

## 5. Regression protection

Fixtures encode every §3 defect and every BR rule; CI runs the full unit+API suite on every
merge. The migration fixture workbook is kept permanently — it is the executable memory of
why the system is shaped like this.
