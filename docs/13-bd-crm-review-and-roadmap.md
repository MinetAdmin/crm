# CRM review and Business Development roadmap

Reviewed 2026-09-13 against baseline `0c90465`, with a targeted delta review through
`4e78cab` for sheets, accounts, themes, and longlist. Recommendations for the design owner,
BD lead, engineering, and sponsor. This is a review and proposed improvement plan,
not approval to change business policy or a claim that the system is production-ready.

## 1. Recommendation

**Continue with Business Development as the first CRM section. Make it a complete daily
working tool before expanding into other departments or pack production.**

Keep the single application and database, stable account IDs, separated stage/outcome,
revenue schedule lines, calculated figures, history, and immutable snapshots. These are
appropriate foundations for the problems described in FR-ACC-01/02, FR-OPP-04,
FR-RSL-02, and FR-FC-03. The implementation already contains useful vertical slices.

I reject treating the current screen inventory or green unit suite as evidence that
Phase 1 is complete. Read authorization is largely absent from business queries;
several writes check identity without checking permission; core workflow invariants
and forecast calculations have gaps. Findings IP-01 through IP-10 explain the evidence.

I also reject taking the CEO pack as the automatic next stage of a broader CRM.
Pack production remains the conditional I1 branch under D-16. Relationship management,
repeat opportunities, and a clear handover boundary are a more natural next extension
of BD. The user confirmed account relationships and renewal/expansion as the next
priority on 2026-09-13 (D-30). Detailed scope and integration still need business acceptance. Client servicing is
currently explicitly excluded by PRD §3; it needs its own scope decision.

The product should answer five questions reliably:

1. Who is the organisation, and which people influence this pursuit?
2. What is the opportunity, who owns it, and what evidence supports its stage?
3. What must someone do next, and by when?
4. What brokerage revenue is expected, in which period, on which basis?
5. What changed since the last review, and what needs a management decision?

## 2. Scope and evidence limits

Reviewed the build pack (docs 01–12 and schema), all domain service modules, auth and
visibility code, business Server Actions, representative list/detail/new/report/admin
screens, shared UI/navigation, migration files, jobs, tests, and CI configuration.
The review includes source analysis and isolated probes of the existing pure functions.
Vendor research uses official product documentation accessed on 2026-09-13.

No production records, original source workbooks, Azure deployment, tenant policies,
mail delivery, or backup infrastructure were inspected. Source-workbook statistics in
the existing pack remain inherited claims, not independently verified observations.
The browser redirected from `/console` to sign-in, so authenticated visual walkthroughs
and real-user usability testing remain outstanding. No business data was mutated.
This is not an exhaustive penetration test or legal assessment.

The baseline has three SQL migrations, 11 test files, and 100 passing tests.
The delta adds migration 0004 and account-table/longlist rule tests.
The test files exercise helpers/rules, rather than an end-to-end database-backed user
journey. CI runs those tests before migration and seed steps. It does not demonstrate
the real-Postgres authorization, concurrency, and rollback proofs promised in doc 10.
See [test configuration](../vitest.config.ts#L8) and [CI](../.github/workflows/ci.yml#L32).

### Changes incorporated after the baseline

The following targeted source review recognizes work completed through `4e78cab`.
Baseline line references below may have moved; these notes supersede stale frontend
observations. This is not a second exhaustive review of every changed line.

- **D-28 sheets are implemented:** [FormSheet](../src/components/console/FormSheet.tsx)
  provides explicit close, Reset, pending state, returned errors, and prevention of
  click-away/Escape dismissal. Creation now uses sheets instead of dedicated new pages.
  IP-06 therefore concerns typed validation, field-specific errors, permissions, and
  recovery testing, not implementing the sheet mechanism again.
- **Accounts and themes improved:** account filtering, sorting, relationship/pipeline
  columns and light/dark/system controls now exist. Keep these changes. Pagination and
  the complete relationship lifecycle still need work; IP-11 is not a request to rebuild
  the account table or add another theme switch.
- **D-29 adds longlist before leads:** retain it as an optional prospect-capture route.
  [Promotion](../src/lib/longlist.ts#L157) creates a lead before unconditionally updating
  the entry. Two requests can pass the action's pre-transaction status check and leave
  two leads with only the last linked. Extend IP-03 with a single-winner promotion test
  and conditional transactional transition. This is a source-level race finding,
  not a reproduced concurrent database result.
- **Extend the existing findings to longlist:** its actions authenticate the actor but
  lack entity-specific role checks (IP-01); its selected-field `writeAudit` calls need
  the same command-boundary treatment as IP-05. Shared BD reads under D-29 do not imply
  write permission or unrestricted executive access. Promotion supplies no contact or
  products, making the missing lead correction journey in IP-11 particularly important.
- **Coverage must use the whole selected year:** [plannedCoverage](../src/lib/longlist.ts#L105)
  filters the year after `listLonglist` applies its 500-row cap. Extend IP-08 with a
  database aggregate filtered by year before aggregation, and a fixture exceeding 500
  entries across years. Retain the cap for display only. Longlist coverage is a count of
  planned prospects, not a financial target-attainment measure.

## 3. What is implemented, and what remains

**Accounts and contacts: partial working foundation.** Account search, duplicate prompts,
account creation, contact creation, and account detail exist. The visible account record
is not yet a full relationship workspace. Contact editing, account merge, a unified
activity timeline, and deal-specific stakeholder roles need work. FR-ACC-01–04 apply.
See [account services](../src/lib/accounts.ts#L12) and
[account detail](../src/app/console/accounts/[id]/page.tsx#L13).

**Leads: capture and conversion exist, but qualification is incomplete.** There is a
four-condition conversion checklist. There is no implemented edit/status progression
journey in the lead actions, and ownership acceptance is assumed. A lead captured without
an account, product, or estimate can reach a dead end because the detail screen explains
what is missing without providing the full correction flow. See
[lead actions](../src/app/console/leads/actions.ts#L20) and
[conversion UI](../src/app/console/leads/[id]/page.tsx#L21).

**Opportunities: useful core, incomplete daily lifecycle.** List/detail, stage movement,
schedule-line addition, next-action creation/completion, closure, initiative linking,
and stage history exist. Editing existing schedule lines, reopening, reassignment,
co-owner management, support-request creation/resolution, actuals capture, and a durable
handover workflow are not exposed through the reviewed opportunity actions. Some have
schema support; that is not feature completion. See
[opportunity actions](../src/app/console/opportunities/actions.ts#L38) and
[opportunity detail](../src/app/console/opportunities/[id]/page.tsx#L21).

**Initiatives and tenders: registers with partial workflows.** Creation, viewing, notes,
initiative linking, and tender status changes exist. The milestone editing/completion,
supporting evidence, tender-to-opportunity handoff, and delivered-alert workflows need
completion. Tender totals have a basis-aware helper, which is worth retaining.
See [initiatives](../src/lib/initiatives.ts#L113),
[tenders](../src/lib/tenders.ts#L47), and [basis totals](../src/lib/tender-rules.ts#L16).

**Targets and reporting: visible breadth exceeds proven correctness.** Forecast bases,
monthly forecasts, stage counts, unit gaps, owner performance, funnel/loss reports,
workload, and snapshot movement are implemented. Published target-set reconciliation,
revision phasing, period scoping, data-maturity labels, and report exports are incomplete.
See [targets](../src/lib/targets.ts#L78), [reports page](../src/app/console/reports/page.tsx#L10),
and findings IP-07–10.

**Administration and operations: partial.** Admin access is explicitly checked. Invites,
activation toggles, raw setting edits, ref-value activation toggles, and recent audit rows
exist. Full picklist add/rename, typed settings, role/capacity editing, audit filtering,
job delivery/recovery, and deployment/restore evidence remain work. See
[admin actions](../src/app/console/admin/actions.ts#L16) and [jobs](../scripts/jobs.ts#L1).

## 4. Findings and required improvements

IP identifiers below are review/backlog identifiers, not new FR/BR/NFR requirements.
P0 means block production use with business data. P1 means required to finish the BD
release or to trust its management outputs. P2 means sequence after the pilot foundation.
Severity is engineering judgment based on the cited source; production exploitation or
incorrect live balances have not been demonstrated.

### IP-01 · P0 · Enforce entity-specific read and write authorization

**Evidence:** [listLeads](../src/lib/leads.ts#L15),
[getOpportunity](../src/lib/opportunities.ts#L64), and
[forecast reads](../src/lib/forecast.ts#L22) accept no viewer and apply no role/unit predicate.
The console layout authenticates but does not enforce each page's business visibility.
Lead, account, initiative, tender, and next-action writes often call only `actorId()`.
See [lead conversion action](../src/app/console/leads/actions.ts#L50),
[tender status action](../src/app/console/tenders/actions.ts#L44), and
[action completion](../src/app/console/opportunities/actions.ts#L114).

The generic [writeScope](../src/lib/visibility.ts#L31) grants leadership all writes,
contrary to doc 06's opportunity restriction. The target action checks permission against
`ownerId: viewer.id`, so the existing function returns true for a BD owner. This was
reproduced without a database. Executive `readScope` returns `all`, despite doc 06's
summary-only opportunities and no-leads permissions. Admin navigation is not a data guard.

**Impact:** any authenticated role can reach several unauthorized record/action paths;
co-owner access is also absent from the simple ownership model. Shared BD pipeline read
under D-11 does not authorize unrestricted leads, workload, or executive detail access.

**Work / owner:** engineering implements a capability-by-entity policy and viewer-scoped
queries, including lookups, search, reports, exports, child records, and mutation targets.
Authorize activity completion using its actual parent, not a submitted parent ID. Resolve
D-12's conflicting leadership access statements with the BD lead. Do not rewrite policy
to legitimize current permissive behavior.

**Proof:** role × operation × ownership matrix against real Postgres, including direct
Server Action calls, guessed child IDs, co-owners, unassigned unit heads, admin-only users,
and executive readers. Out-of-scope reads return the agreed non-disclosing result.

### IP-02 · P0 · Refresh authorization after deactivation and role changes

**Evidence:** [JWT callback](../src/auth.ts#L149) loads role/unit only at sign-in;
[currentViewer](../src/lib/viewer.ts#L15) trusts those claims. Admin deactivation changes
`app_user.active` but existing sessions do not recheck it. Therefore the docs' immediate
access-revocation language is not established by the application.

**Work / owner:** engineering resolves a fresh active user and current permissions at the
server boundary, or uses a tested revocation/version scheme with an explicitly agreed
maximum delay. BD administration owns offboarding procedures. Verify tenant/session
revocation separately with the Entra administrator.

**Proof:** a previously valid session loses access after deactivation and loses privileges
after a role/unit change, without requiring the person to sign out voluntarily.

### IP-03 · P0 · Make bootstrap and conversion safe under concurrent requests

**Evidence:** [bootstrap](../src/auth.ts#L56) counts linked users then creates an admin in a
transaction, but shows no serialization/lock protecting the empty-set check. A transaction
alone does not establish the documented single-winner guarantee. First OID linking similarly
checks identity before an unconditional update. [Conversion](../src/lib/leads.ts#L135)
reads conversion status before its creating transaction; `source_lead_id` is not unique
in [the schema](schema.sql#L225).

**Work / owner:** engineering adds a database-enforced single-use bootstrap claim or
serialized lock, conditional first identity linking, and an idempotent conversion guard.
Sponsor/Entra admin should consider a designated bootstrap identity for the already
recorded D-23 first-user risk. This is a proposed hardening choice, not an authorization
change made by this review.

**Proof:** simultaneous bootstrap attempts yield one administrator; simultaneous first
links cannot replace a bound identity; two conversions produce one opportunity and one
consistent bidirectional lead link. These are source-identified race risks, not live
concurrency tests executed in this review.

### IP-04 · P0 · Enforce the next action and qualification at the transaction boundary

**Evidence:** [convertLead](../src/lib/leads.ts#L151) creates an open opportunity without
an activity. [completeAction](../src/lib/activities.ts#L57) can complete the last next
action without a replacement. [conversionStateOf](../src/lib/leads.ts#L65) hardcodes
`ownerAccepted: true`. Conversion accepts the submitted stage ID without restricting it
to the two permitted starting stages. The schema delegates BR-OPP-02 to application code
([schema](schema.sql#L332)); the current implementation surfaces an exception afterward.

**Work / owner:** engineering makes qualification, owner acceptance, starting stage, and
first dated action an atomic conversion command. Completion on an open deal must include
a replacement action or an allowed closure in the same transaction. BD lead confirms the
acceptance evidence and whether assignment by a unit head counts as acceptance.

**Proof:** no open opportunity can be saved without its required next action; deliberately
submitted later stages and invalid conversion states return the documented violations.

### IP-05 · P0 · Use one complete audit and concurrency path

**Evidence:** most business services call `$transaction` plus hand-selected `writeAudit`
fields rather than the mandated `withAudit` path. For example, stage movement stores the
probability note but audits only stage/probability; closure audits only outcome, omitting
the reason change. See [stage audit](../src/lib/opportunities.ts#L129) and
[closure audit](../src/lib/opportunities.ts#L228). Updates identify records by ID alone;
no submitted version is compared. `withAudit` also receives its before-image from outside
the transaction ([audit helper](../src/lib/audit.ts#L66)).

**Work / owner:** engineering extends the common audited transaction boundary for create,
update, and multi-entity commands, captures complete eligible field diffs, and performs
version/ownership checks inside it. Give related changes one request ID. Define treatment
of self-auditing append-only notes consistently with doc 06. Preserve snapshot immutability.

**Proof:** a failed change rolls back both entity and audit rows; simultaneous edits yield
one success and one conflict; old/new reason, override note, owner, and schedule fields
are reconstructable. Add database tests for append-only protections and least-privilege
runtime grants, rather than inferring them from comments.

### IP-06 · P1 · Validate input and make errors actionable

**Evidence:** actions cast submitted strings with `as never` or outcome/status assertions,
accept raw IDs, and often depend on database rejection. `RuleViolation` lacks a field;
the baseline opportunity actions redirected rule IDs into one generic message.
D-28 now returns errors inside sheets; field-level metadata remains absent. The detail page displays the current stage's criterion rather
than dynamically explaining the selected destination. The lead form has no complete
edit/qualify correction journey.

**Work / owner:** engineering introduces typed command schemas and a shared error result
with rule, field, message, and conflict metadata. Validate active reference values, list
membership, owner/unit/sector consistency, dates, enums, decimal strings, and lifecycle
transitions. FE preserves entered values, focuses errors, shows pending/success states,
and exposes only permitted controls. Permission checks remain server-side.

**Proof:** malformed IDs, stale forms, wrong-list reasons, inactive values, and invalid
dates produce usable errors without losing the form. Keyboard and mobile users can recover.

### IP-07 · P1 · Make target sets publishable and revisions complete

**Evidence:** [setTarget](../src/lib/targets.ts#L78) rejects over-allocation only, allows
under-allocation without a distinct draft state, and always creates a new active target.
[reviseTarget](../src/lib/targets.ts#L141) does not revalidate the unit set or carry/rebuild
phasing. The schema lacks uniqueness for an active target dimension/year/version family.
This falls short of BR-TGT-01 and FR-TGT-02.

**Work / owner:** engineering builds draft/save-set/publish/revise operations and a unique
active target identity. Finance and BD leadership confirm A1, D2, D5 and phasing. Published
unit allocations must reconcile; drafts may show a remainder without entering official
forecast comparisons. Revisions preserve originals and rebalance all twelve months.

**Proof:** duplicate current targets are rejected; a partial set stays draft; published
sets and revisions reconcile at annual and monthly levels, including concurrent saves.

### IP-08 · P1 · Correct report dimensions before using them for decisions

**Evidence:** [gapByUnit(year)](../src/lib/forecast.ts#L111) filters target year but not the
joined revenue months; multiple current targets can multiply joined money. The initiative
view also omits its target-year restriction ([schema](schema.sql#L514)).
[concentration](../src/lib/workload.ts#L129) casts committed sums to text and sorts column 2,
so numeric ranking is not guaranteed. Owner reports group by full name rather than stable
user ID ([reports](../src/lib/reports.ts#L29)). Currency fields exist but the main sums do
not group/filter by currency; the UI defaults do not constrain every possible stored row.

**Work / owner:** engineering uses one reporting context: authorized scope, period, currency,
value basis where relevant, and as-of date. Group identities by ID, order amounts numerically,
and aggregate before joining targets. For D-18, enforce UGX-only saving/importing in Phase 1
or explicitly group currencies; do not silently sum them. Finance validates expected vs
actual semantics after C1/C2.

**Proof:** fixtures spanning two years, two same-named owners, target revisions, 900 vs 1,000
ranking, and two currencies produce exact expected results. Financial calculations should
retain decimal precision through aggregation and reconciliation, with formatting at the edge.

### IP-09 · P1 · Complete movement semantics and snapshot timing

**Evidence:** isolated calls to [decomposeMovement](../src/lib/movement.ts#L38) produced:

- Open weighted value 50 moving to on-hold: residual −50, reconciliation false.
- On-hold returning to open at 50: residual +50, reconciliation false.
- A move from September to August increments `slippedCount`, although doc 08 defines
  slipping as moving later.
- Amount 100 → 200 and probability 10% → 20% yields probability change 10 and revised 20.
  Doc 08's equations allocate 20 and 10, while its prose assigns the cross-term to Revised.
  The code and equations differ; the specification contradicts itself too.

[The snapshot command](../scripts/jobs.ts#L11) defaults to the previous UTC month, while
doc 05 schedules the job on the last day at 23:55 EAT. [takeSnapshot](../src/lib/snapshots.ts#L38)
copies the current book for any submitted month; it cannot reconstruct a missed historical
cutoff simply by labeling today's data with that month.

**Work / owner:** finance and BD leadership settle the decomposition, hold/reopen categories,
and cutoff/correction policy. Engineering implements it with an explicit EAT reporting
period, replay-safe jobs, completeness metadata, and a safe recovery procedure. A late
capture must be labeled accurately; never overwrite an immutable snapshot.

**Proof:** every outcome pair, earlier/later month move, amount/probability combination,
empty book, duplicate job, and month-boundary case reconciles. Snapshot UPDATE/DELETE
rejection is tested against the real runtime role. Backfill is not presented as an authentic
month-end observation without reconstructable evidence.

### IP-10 · P1 · Deliver operational work and data-maturity behavior

**Evidence:** [jobs](../scripts/jobs.ts#L24) print hygiene/deadline messages to the console;
no delivery, outbox, retry policy, or job scheduling infrastructure is present in the
reviewed repository. [Workload](../src/lib/workload.ts#L63) counts blockers using only
`key_blocker`, omitting unresolved support, and attributes stage advances to the actor.
The page uses a hardcoded concentration threshold and shows a named largest owner before
filtering individual rows ([workload page](../src/app/console/reports/workload/page.tsx#L10)).
Data maturity is described in copy but there is no general FR-RPT-11 read contract.

**Work / owner:** engineering delivers tender alerts first, with recipients, deduplication,
retry/catch-up, delivery status, and deep links. Use a scoped system-job identity distinct
from interactive viewers. Implement report maturity from available history, not elapsed
time alone. Distinguish legitimate stock zeroes from unavailable trend data. Resolve actor
versus accountable-owner attribution and D-12 privacy before workload rollout.

**Proof:** simulated send failure is retried and visible to the business admin; a skipped
run catches overdue notifications without duplicates; permissions also cover derived
summaries; each immature report gives an honest reason and availability condition/date.

### IP-11 · P1 · Finish the seller's daily journey

**Evidence:** the opportunity list has outcome filters only and no next-action column
([list](../src/app/console/opportunities/page.tsx#L9)). Account, lead, opportunity, and
tender lists stop at 200 rows without a pagination contract. Search is explicitly disabled
([shell](../src/components/console/ConsoleShell.tsx#L107)). Activity functions only handle
opportunity next actions; call/meeting/task/account/lead timeline workflows are not exposed.

**Work / owner:** design owner and BD lead specify a compact “My work” page: overdue,
today, upcoming, waiting for management, and tender deadlines. Add lead edit/qualification,
activity logging, filtered/paginated lists, and a record workspace with overview,
activities, revenue, stakeholders, and history. Preserve a table view; a board is secondary.
Use the same stage service for any board move, with validation and rollback on refusal.

**Proof:** a BD owner can capture an incomplete lead, improve it later, qualify, convert,
record a meeting, set/complete the next action, update a forecast, request help, and close
or hand over a pursuit without database intervention. A reader sees no misleading edit
controls. Lists show totals for the complete filtered scope, not just the displayed page.

### IP-12 · P1 · Make the docs and migration plan safe to execute

The following contradictions need explicit disposition in the build pack:

- **Transport:** doc 05 describes implemented `/api/v1` CRUD, but current business writes
  use Server Actions; the only API route files are auth and health. Proposed choice:
  retain Server Actions plus typed domain commands for the internal UI; add REST only
  for an actual external client. Record this decision and adapt doc 05 before claiming
  conformance. Do not create a second business-write implementation.
- **Permissions:** D-12 says leadership receives aggregates, while doc 06's matrix and
  `canSeeWorkloadOf` allow leadership individual rows. Admin-plus-business-role language
  also differs from the single role enum. BD lead/sponsor must resolve these conflicts.
- **Migration grain:** doc 09 step 4 says every source row becomes a revenue line, but
  F2 records evidence that some rows may be monthly restatements. Doc 11 also proposes
  guessing unresolved grain and splitting later, although no split workflow exists.
  I reject both blanket conversion and guessed grouping. Quarantine unresolved rows;
  classify genuine phased revenue separately from history, with signed crosswalks.
- **Maturity and launch:** docs 10/11 require integration and operational proofs that are
  not in CI. A green unit suite is not a substitute. Snapshot protections are implemented
  using triggers, while parts of the pack describe grants; verify and document both.
- **Stale claims:** PRD FR-ADM-02 still mentions Entra app assignment despite D-23; doc 03
  retains “H5 unconfirmed” wording before confirming Azure; README uses local Postgres 18
  while CI uses 16; doc 11 mixes a 16-week table with a 22–24-week solo estimate. Reconcile
  these as documented constraints, not assumed runtime defects.

**Work / owner:** project lead owns the decision register and evidence; engineering owns
implementation-status annotations. Preserve historical decisions and mark superseded
text clearly. Do not weaken accepted rules to match incomplete implementation.

## 5. Lessons from established CRM products

These are workflow benchmarks, not a market-share ranking, product procurement recommendation,
or a claim that their paid features are available in the organisation's current licenses.
Feature descriptions below are verified; the choices for this project are judgment.

**Salesforce: model the people involved in each deal.** Opportunity Contact Roles identify
how each contact participates in a pursuit. Adopt a small opportunity-contact association
with role and primary-contact status; an account-wide decision-maker checkbox does not say
who decides this particular insurance placement. Defer configurable role engines and
enterprise account hierarchies until needed.
[Official contact-role documentation](https://help.salesforce.com/s/articleView?id=sf.sales_core_opp_contact_roles.htm&language=en_US&type=5).

**HubSpot: organize the working day around follow-up.** Its sales workspace combines company,
lead and deal records with tasks, saved views, schedules, and an activity feed. Adopt the
compact task queue, saved filters, and quick record updates. Defer sequences and suggested
AI tasks until basic logging and data quality are reliable. The documented workspace has
subscription and seat requirements.
[Official sales-workspace documentation](https://knowledge.hubspot.com/sales-workspace/manage-sales-activities-in-the-updated-sales-workspace).

**Dynamics 365 Sales: keep customer context alongside the next action.** Sales accelerator
provides a workspace across leads, opportunities, accounts, and contacts; sequences and
work lists help organize engagement. Adopt that contextual workflow and evaluate selective
Outlook/Teams integration later because the organisation uses M365. Do not assume M365
includes the relevant Dynamics features or unrestricted access to mailboxes.
[Official sales-accelerator documentation](https://learn.microsoft.com/en-us/dynamics365/sales/enable-configure-sales-accelerator).

**Pipedrive: show what needs attention directly on the pipeline.** Its default pipeline
ordering uses next activities, prioritizing overdue and due-today work ahead of missing
or future activities. Adopt action/due-date indicators and an actionable priority order
for the table first. Defer elaborate board customization.
[Official pipeline-priority documentation](https://support.pipedrive.com/en/article/how-are-deals-ordered-in-the-pipeline-view).

**Forecast terminology needs local discipline.** Salesforce separates forecast categories
such as Pipeline, Best Case, Commit, and Closed, with category and cumulative rollups.
Our D-06 “committed” is explicitly threshold-based; retain that definition until BD leadership
changes it. Display the threshold and avoid presenting won, committed, and weighted as
mutually exclusive totals to add together. A probability threshold is adopted policy,
not proof of calibrated forecasting accuracy.
[Official forecasting setup](https://help.salesforce.com/s/articleView?id=forecasts3_setup_intro.htm&language=en_US).

**Build versus buy checkpoint:** before adding another major department, run the same BD
scenario through this app and shortlisted commercial products. Compare schedule phasing,
tender value bases, immutable historical reporting, permissions, data location, exportability,
implementation effort, support ownership, and total licensing/customization cost. Obtain
current quotes and tenant-specific answers; this review did not verify prices or procurement
terms. Continue custom development only if these domain advantages and an accountable
maintenance owner justify it. Sunk development effort is not sufficient justification.

## 6. Proposed release sequence

This sequence subdivides the existing Phase 1. It does not silently defer its MUST requirements
or authorize use of unsafe software. Retain D-01/D-02/D-03/D-04/D-06/D-14/D-16 and the
migration gates. Changes to D-15 integrations, D-12 access, or the PRD's servicing exclusion
require explicit decisions with the named owners.

### Gate A: trustworthy foundation

**Deliver:** IP-01–06, corrected policy/transport documentation, real-Postgres tests, and
reviewable migration changes where needed. Build a current implementation-to-requirement
checklist rather than counting screens.

**Exit:** authorization, session changes, race handling, audit rollback, next-action
invariants, and conflicts pass the tests described above. No unresolved P0 findings.
Engineering owns implementation; BD lead resolves the role/acceptance decisions.

### Gate B: complete BD workflow in staging

Include the optional longlist → lead route and prove promotion remains editable through
qualification. Direct lead capture remains valid; future renewals start from the account.

**Deliver:** IP-11, account/contact correction, stakeholder roles, qualification and
conversion, next-action replacement, schedule edits, close/reopen/actuals, reassignment,
support requests, and a minimal handover reference. Use a role-specific working home:
BD owners see their actions; unit heads see unit exceptions; leadership sees scoped
forecast/support summaries; admins see administration.

**Exit:** representative BD owners and a unit head complete scripted journeys with fixture
or approved masked data on desktop and phone. Edit failures preserve work, and read-only
roles can navigate without mutation controls. This is a staging pilot, not Phase-1 sign-off.
Design owner and BD lead own usability acceptance; engineering owns functional proofs.

### Gate C: controlled BD business pilot

**Deliver:** corrected forecast/target/movement work (IP-07–09), minimum tender alerts,
scoped reporting/export parity, operational logging/recovery, and an approved migration
subset. Keep initiatives and tenders in the pilot when they are part of the participating
team's real book; do not force a second unaudited spreadsheet write path.

**Exit before business data:** C1/C2/F1/F2 and applicable A1 decisions signed; source hash,
row-level crosswalk, exclusions, and money reconciliation approved; bootstrap spent;
offboarding verified; scheduled snapshot and alert delivery demonstrated; backup restore
and rollback drill complete. Name the business administrator and pilot support owner.
If the pilot deliberately omits an existing Phase-1 MUST workflow, label it limited scope
and obtain explicit pilot acceptance. Do not call it the full launch in doc 10.

### Gate D: complete and accept Phase 1

**Deliver:** the remaining FR/BR items, report maturity handling, initiative milestones,
tender links, all required day-one reports, managed reference data/settings, audit browsing,
required exports, and the defined stock workload signals. Close migration and UAT findings.
Defer only the trend outputs already allowed by doc 10, and preserve their recording now.

**Exit:** doc 10 §3 and T-SEED-01–06 pass, migration G3.1–G3.5 signed, workbook cutover owned,
and a maintenance/recovery runbook demonstrated by someone other than the developer.
The sponsor accepts full launch. Calendar first real movement review, the month-four
review, and restore drills from the actual go-live date.

### Gate E: relationship growth, after adoption is demonstrated

**Confirmed direction (D-30), proposed implementation sequence:** deepen account
relationships and renewal/expansion opportunities,
then selective communication integration. Add account relationship ownership, key contacts,
interaction history, upcoming commercial renewal dates, and cross-sell pursuits using the
existing opportunity model. Do not create a duplicate “customer” master for another team.

Deliver this in three increments:

1. **Account relationships:** a named relationship owner, editable contacts and pursuit
   roles, shared interaction history, relationship review date, and a small account plan
   with explicit next actions. Keep account ownership separate from individual deal ownership.
2. **Renewal worklist:** record commercial renewal date and its verified source, link the
   prior won pursuit or external policy/contract reference, and assign an owner and dated
   preparation action. Make reminder lead times configurable after BD confirms its cadence.
   Create each renewal pursuit once per agreed account/product/contract/period identity;
   reminders alone must not generate forecast revenue or overwrite historical wins.
3. **Expansion pursuits:** create a distinct opportunity on the existing account, classified
   as expansion with relevant product and originating relationship context. Do not force
   existing clients through the longlist or create a duplicate account. Separate new business,
   renewal and expansion reporting after finance approves their definitions and boundaries.

Before reporting retention, BD and finance must define eligible renewals, measurement
period, loss/contraction handling, and the revenue basis. A renewal date is not proof of
retained revenue. These are recommended design safeguards, not new approved BR IDs.
Policy administration, claims and collection remain outside this commercial workflow.

Link documents through an approved organisation repository before building file storage.
If justified by pilot evidence, add explicit Outlook/calendar logging and internal Teams
notifications, with least-privilege permissions and auditable sync behavior. This requires
revisiting D-15. Do not start with unrestricted mailbox ingestion, automated outreach,
predictive scores, or a generic workflow builder.

**Exit:** BD lead demonstrates the workflow reduces missed follow-up or duplicate entry;
security/tenant owner approves integration scope; maintenance and data ownership are named.
These are proposed outcomes, not measured improvements in the current system.

**Relevant product evidence:** HubSpot's customer success workspace combines owned-account
views, activities, daily tasks and revenue views, supporting the recommendation to keep
relationship work close to account records. Salesforce CPQ links contract renewal to a
renewal opportunity, illustrating explicit commercial lineage. These are product-specific
patterns, not evidence that this CRM needs either suite's entire service or CPQ scope.
See [HubSpot customer success workspace](https://knowledge.hubspot.com/customer-success/use-the-customer-success-workspace)
and [Salesforce CPQ renewal](https://help.salesforce.com/s/articleView?id=000381709&language=en_US&type=1).

### Gate F: consider adjacent domains after relationship growth

Relationships and renewal/expansion are already the selected direction. Only after that
phase, run separate discovery if the sponsor chooses either adjacent domain:

- **Client servicing/handover:** named receiving team, service requests, ownership, SLA,
  acceptance of won-business handover, and an operations-system reference. Policy admin,
  claims, premium collection, and commission accounting remain external unless separately
  commissioned. This changes the current PRD servicing exclusion.
- **Management pack:** proceed only through I1/I2/I3/I8 with finance-owned actual/proforma
  definitions, source controls, and reconciliation. A `revenue_actual` table alone does not
  establish pack-production readiness.

Keep one modular application with shared accounts, contacts, identity, audit, and activities.
Do not introduce microservices or a generic CRM customization platform for the current team.

### Planning cadence and first work packages

The old 16/22–24-week calendar is not a current remaining-effort estimate. Re-estimate after
Gate A findings are sized. Plan in two-week review increments, with a working business
journey at each review; this cadence is a proposal, not a promised delivery date.

Recommended first packages, in dependency order:

1. Project lead + BD lead: settle access ambiguities, inventory requirement status, and
   confirm the BD pilot boundary. Keep unresolved finance/migration gates visible.
2. Engineering: real-Postgres fixture harness and policy-matrix tests; fix IP-01/02.
3. Engineering: bootstrap/link/conversion concurrency and command-boundary auditing;
   complete IP-03/05 with conflict tests.
4. Engineering + BD lead: atomic qualification/conversion/next-action workflow, IP-04/06.
5. Engineering + finance: published targets, fiscal/period/currency scoping, and movement
   semantics, IP-07–09. These can be prepared while BD tests the workflow.
6. Design owner + engineering: My work, record editing/timeline, scoped search and pagination.
7. Engineering + business admin: delivered tender alerts, snapshot recovery, restore drills.
8. Project lead + BD lead: migration rehearsal, persona UAT, and explicit release gate review.

Each package should become small commits/PRs with affected requirement IDs, database changes,
negative cases, acceptance evidence, and named reviewer. CI assists review; it cannot
independently establish that a permission policy or formula matches the business requirement.

## 7. Product and data decisions to obtain

Keep the existing decision register authoritative. Do not substitute defaults for facts:

- **BD lead + finance:** C1 money basis and C2 period meaning; target approval/phasing A1/D2/D5;
  hold/reopen forecast treatment and the movement cross-term; fiscal-year D1.
- **BD lead + project lead:** F1 source, F2 grain, F5 history depth, owner mappings, stage
  evidence, handover ownership, and the controlled-list workshop.
- **BD lead + sponsor:** D-11/D-12 read/workload policy and admin-plus-business-role treatment;
  relationship ownership and the renewal source of truth within the confirmed D-30 direction.
- **Sponsor + technical owner:** H1 business administrator, D-21 hosting budget/operations,
  D-23 bootstrap hardening, tenant access controls, and a maintenance substitute.

Progress engineering that does not depend on these answers; block only the dependent data
load, calculation policy, integration, or rollout. Do not hold the entire build for a workshop.

## 8. Pilot evidence and success measures

Adopt definitions first and collect a baseline during the pilot. No adoption rates, revenue
lift, time savings, or forecast accuracy figures have been measured in this review.

- **Integrity:** zero accepted unauthorized writes; zero open deals lacking required owner,
  next action, or due date; complete audit linkage; exact financial reconciliation.
- **Reliability:** every scheduled snapshot accounted for, including failures/recovery;
  alert delivery traceable; a successful restore with recorded recovery time/data loss.
- **Usability:** observed task completion for capture → follow-up → conversion → forecast →
  closure; validation-recovery success; mobile completion of the doc 07 critical subset.
- **Adoption:** active BD owners, timely next-action completion, stale pursuits, and duplicate
  corrections over time. Use denominators and agreed periods; do not turn activity counts
  into an unapproved staff ranking.
- **Business value:** finance-approved forecast-to-actual comparison once actuals/history are
  sufficient; reduced manual reconciliation demonstrated against a recorded baseline.

## 9. Verification of this review

Source-level probes reproduced the three policy decisions and four movement cases recorded
in IP-01/IP-09. These were read-only function calls using synthetic values, not production
transactions. The baseline passed verification in an isolated checkout. A first shared-tree
attempt hit an incomplete concurrent form refactor; those changes subsequently landed and
are covered by the delta notes above. Final shared-tree checks through `4e78cab` plus this documentation passed:
`pnpm verify` (lint, typecheck, 13 test files and 113 tests) and `pnpm build`.
The companion roadmap also passed its standalone TypeScript check. The existing
Vite/Vitest config-loader warning is already recorded in doc 12.
SonarQube and live infrastructure validation were not available in this session.

This review records implementation work for follow-up; it does not fix the findings or
alter the accepted FR/BR requirements. Update each finding with its implementation commit,
acceptance evidence, and closure date as the roadmap is executed.
