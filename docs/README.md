# BD CRM — Build Documentation Pack

This folder contains everything needed to build the BD CRM from the ground up. It is derived
from, and traceable to, the scoping document **"BD CRM: Requirements and Data Model, draft v0.1"**
(`CRM review.pdf`, kept in git history at commit 3ce7f35), referred to
throughout as **the Spec**.

## Document map

| # | Document | Purpose | Primary audience |
|---|----------|---------|------------------|
| 01 | [Spec review](01-spec-review.md) | Assessment of the Spec: strengths, gaps, risks, and what had to be added to make it buildable | Sponsor, project lead |
| 02 | [Product requirements (PRD)](02-prd.md) | Numbered functional requirements, scope and phasing, personas, business rules | Everyone |
| 03 | [Architecture](03-architecture.md) | Tech stack, system components, non-functional requirements, environments, backup/security | Engineers |
| 04 | [Data model](04-data-model.md) | ER diagram and table-by-table design for all 16 tables-worth of entities | Engineers |
| — | [schema.sql](schema.sql) | Full PostgreSQL DDL, runnable | Engineers |
| 05 | [API specification](05-api-spec.md) | REST conventions, endpoints, validation error contract | Engineers |
| 06 | [RBAC and audit](06-rbac-and-audit.md) | Roles, permission matrix, row visibility, field-level audit design | Engineers, admin |
| 07 | [UI specification](07-ui-spec.md) | Screen inventory, key flows, validation UX | Engineers, designer |
| 08 | [Reporting specification](08-reporting-spec.md) | Every report with its exact formula, data source and the date it becomes meaningful | Engineers, BD leadership |
| 09 | [Migration plan](09-migration-plan.md) | Operationalised version of Spec §10: gates, mapping tables, reconciliation sign-off | Project lead, BD team |
| 10 | [Test plan](10-test-plan.md) | Test strategy, phase-one acceptance criteria, what is explicitly *not* accepted at launch | Engineers, project lead |
| 11 | [Delivery plan](11-delivery-plan.md) | Phases, milestones, team, sequencing, the month-four review | Sponsor, project lead |
| 12 | [Decision log](12-decision-log.md) | Every provisional decision taken in this pack, plus the open-question register from Spec §12/§14/I/J | Everyone |

## How to use this pack

1. **Read 01 first.** It says what the Spec already settles, what this pack adds, and the one
   scope question (Spec question I1) that dominates everything else.
2. **The decision log (12) is the control document.** Every decision marked *Provisional* was
   taken here so the build can start; each names who must confirm it. Confirmations and
   reversals are recorded there, not scattered across documents.
3. **Requirement IDs** (`FR-…`, `NFR-…`, `BR-…`) are defined once in the PRD (02) and referenced
   everywhere else, including the test plan. Spec sections are cited as `Spec §n`.
4. Nothing here overrides the Spec's data-quality findings (§3) — they are treated as hard
   constraints: *the CRM must make each problem impossible, not merely tidy it once.*

## Status

Draft v1.0, generated 2026-09-09. Blocking inputs before migration (not before build start):
Spec questions **C1, C2, F1, F2, A1** and scope question **I1** — see [12-decision-log.md](12-decision-log.md).

## Current implementation review

[CRM review and BD roadmap](13-bd-crm-review-and-roadmap.md) compares the build pack
with baseline `0c90465`, targeted updates through `4e78cab`, and official CRM product
documentation, reviewed 2026-09-13. D-30 records the confirmed post-BD direction. It records findings IP-01–12, release gates, and proposed sequencing.
Recommendations do not supersede accepted requirements without a decision-log update.
