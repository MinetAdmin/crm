# 11 — Delivery Plan

**Team shape (confirmed): one solo full-stack developer**, plus a project lead who owns the
decision log and BD sessions (may be the same person's manager), and BD-team availability for
the workshop, grain decisions and UAT. The week numbers in §1 were drawn for a two-person
team; solo, plan on **~1.5× — roughly 22–24 weeks to go-live** — with the same sequence and
milestone order. Two solo-specific rules: (a) the decisions & data track must be driven by the
project lead, not the developer, or the build stalls every time a workshop needs chasing;
(b) scope relief comes from *deferring whole blocks* (budget lines per D3, the rebalancing
view, XLSX polish), never from thinning the three §11 non-negotiables or stage history.

## Current roadmap review, 2026-09-13

The [implementation review and roadmap](13-bd-crm-review-and-roadmap.md) records the
remaining BE/FE gaps and proposes evidence-based release gates. D-30 confirms the
post-BD direction: account relationships, then renewal/expansion opportunities. The
calendar below is historical planning context, not a current remaining-effort estimate;
re-estimate after the foundation findings are sized. Existing Phase-1 acceptance criteria
remain in force. Servicing and pack production are separate scope decisions.

## 0. Two tracks

- **Build track** — starts immediately; blocked by nothing in the question list.
- **Decisions & data track** — the BD sessions, controlled-list workshop and migration.
  The five blockers (C1, C2, F1, F2, A1) and I1 live here. Running them in parallel is the
  whole plan: the classic failure is the build waiting on workshops, or migration starting
  before decisions.

## 1. Timeline (indicative, ~16 weeks to go-live)

| Weeks | Build track | Decisions & data track |
|---|---|---|
| 1–2 | **Sprint 0:** repo, CI/CD, environments, auth, schema migration #1 (schema.sql), audit middleware skeleton, seed framework | Sponsor session: confirm provisional decisions (doc 12), put **I1** to CEO/sponsor; H1–H5 answered; schedule workshop |
| 3–4 | Accounts/contacts, leads incl. duplicate guard + BR rules | **Controlled-list workshop** (doc 09 §1); five blockers C1/C2/F1/F2/A1 pressed to answers; A2 owner mapping |
| 5–7 | Opportunities: detail screen, StageService + stage history, schedule lines, close/reopen flows, co-owners, support requests | Mapping workbook v1.0; ETL steps 1–3 running against fixture + real file |
| 8–9 | Initiatives + rollup views; tenders + deadline alerts; activities/next actions | Grain rebuild (F2 worksheet) with BD; ETL steps 4–7 |
| 10–11 | Targets + phasing + reconciliation rule; forecast views; **SnapshotService + movement report** | Loss reasons for the 39 lost rows; E4 register reconciliation |
| 12–13 | Reports & dashboards (day-one set), exceptions + digests, workload suite (stock signals), admin UI, RBAC sweep | Full migration rehearsal into staging; G3 gates dry run |
| 14 | Hardening: security sweep, backup/restore drill, performance smoke, T-SEED suite | **UAT** on migrated staging data (scripted, per persona) |
| 15 | UAT fixes; freeze | Workbook freeze; final migration run; G3 gates on prod |
| 16 | **Go-live** | Hypercare: daily check-ins, exception queues worked to zero, F6 spreadsheet sweep |

Post-launch: month-2 first real movement report · **month-4 review** (doc 10 §4; trend-report
acceptance; also the scheduled moment to revisit D-11/D-12 visibility settings with usage
evidence) · quarterly restore test and win/loss review.

## 2. The I1 gate (scope fork)

Decision needed by **week 4** to keep Phase 2 plannable:

- **I1 = "pipeline only":** this plan is complete. The CRM feeds the pack's New Business
  section via XLSX exports (G4).
- **I1 = "produce the pack":** Phase 2 (~8–12 further weeks) adds: retention & policy-fee
  revenue lines, monthly actuals/proforma loads (or finance integration, I2/I3), phased-budget
  achievement & variance, prior-year comparatives, pack-shaped reporting/export (I8 sizes
  this — replacing 36 hand-assembled slides is a significant deliverable in its own right).
  The Phase-1 schema already carries the landing zones (doc 04 §5), so Phase 2 is additive.

Either way Phase 1 ships the same system — that is what makes the fork safe to defer to week
4 and no later.

## 3. Milestones & demos

Demo at the end of every block to the BD team using real(istic) data — the audience that
decides whether to trust the system. Milestones: M1 leads live (wk 4) · M2 opportunity core +
stage history (wk 7) · M3 initiatives/tenders (wk 9) · M4 forecast + snapshots (wk 11) ·
M5 reports + admin (wk 13) · M6 UAT exit (wk 15) · **M7 go-live** (wk 16).

## 4. Run-cost and ownership (the §11 trade-off, honoured)

- Azure hosting per doc 03 §8: compute effectively $0 (Container Apps free grant, Entra free
  tier, Graph email); database **~US$15–20/month** on the recommended Postgres option, or $0
  on the Azure SQL free offer at the cost of a 1–2 week port and daily cold starts
  (Decision D-21 — put option A vs B to the boss with those numbers).
- Named system administrator (H1) trained on picklists, **user invites (a CRM user record; no
  Azure portal step)**, settings, snapshot recovery before go-live — admin UI acceptance
  includes the admin actually using it.
- Maintenance: budget ~2–4 developer-days/month post-hypercare for fixes and small changes;
  the custom build's "maintenance obligation" is a line item from day one, not a surprise.
  Solo-dev corollary: this pack and the test suite are the succession plan — keeping doc 12
  current is part of "done" for every change.

## 5. Top schedule risks

| Risk | Mitigation |
|---|---|
| Workshop or five blockers slip | Build track is unaffected until week 8; project lead escalates at week 4 |
| I1 undecided by week 4 | Proceed as pipeline-only; Phase 2 becomes a separately-planned project (no rework either way) |
| Scope squeeze targets snapshots/audit/visibility | They are launch acceptance criteria (doc 10 §3); descoping them requires the sponsor to strike them there, in writing |
| Grain decisions (F2) drag row by row | Timebox with BD lead; undecided rows migrate conservatively (one pursuit per client+product+year) and are flagged for post-launch split — the UI can split an opportunity |
| Solo developer unavailable (illness, departure) — bus factor 1 | Mainstream stack, one repo, this documentation pack, CI-as-reviewer, managed Azure services; any TypeScript developer can take over. Accepted residual risk — name it to the sponsor rather than pretend it away |
| DB cost decision (D-21) drifts unmade | ORM provider choice depends on it; hard deadline: end of Sprint 0 |
