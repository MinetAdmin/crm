# 06 — RBAC, Visibility and Audit

The Spec names role-based visibility as one of the three features a custom build must not cut
(§11), asks who sees what in A3/A4/J1/J5, and warns that load metrics read as appraisal will
corrupt the data (§16). This document is the concrete model. Visibility choices marked
*(provisional)* are Decisions D-11/D-12 in doc 12 and take one config change to flip once the
BD team answers.

## 0. Who gets in at all: invite-only Entra SSO

Authentication is Microsoft Entra ID SSO, single-tenant, invite-only at two independent
layers (full design in doc 03 §2.1): the person must be *assigned to the app in Entra*
("Assignment required" on) **and** have an `app_user` record created by the admin. There is no
self-service signup and no password path. First login links the Azure OID to the user record
(re-linking to a different OID is refused — recycled-email guard, inherited from the EAP
implementation). Offboarding = unassign in Entra + `active=false` in-app; records and history
are never deleted. Invites, deactivations and OID links are audited like any other change.
Entra answers *who you are*; everything below answers *what you may do* — roles live on
`app_user`, not in Entra app roles.

## 1. Roles

| Role | Who | Summary |
|---|---|---|
| `bd_owner` | The ~6 BD staff | Works own book; sees team pipeline read-only *(provisional, A4)* |
| `unit_head` | Unit leads | Full read/write within unit; workload views for own unit |
| `bd_leadership` | Head of BD / management | Read everything, edit targets and initiatives, resolve support requests |
| `executive_ro` | CEO / exec consumers | Read-only dashboards: support register, forecast, scorecard |
| `admin` | System administrator | Ref data, users, settings, snapshots, audit log. Admin ≠ automatic data access: business-record visibility follows whatever second role the person holds |

One user, one role (plus admin flag if needed). Team of ≤25 does not justify a permission
matrix engine; roles are checked in one `VisibilityGuard` module server-side (NFR-SEC-03).

## 2. Permission matrix

R = read, W = create/edit, — = none. "Own" = accountable owner or co-owner; "Unit" = record's
unit matches user's unit.

| Capability | bd_owner | unit_head | bd_leadership | executive_ro | admin |
|---|---|---|---|---|---|
| Leads | W own + unit; R all unit | W unit | R all | — | — |
| Accounts / contacts | W (shared resource) | W | W | R | — |
| Opportunities | W own; **R all** *(provisional D-11: shared default view, per A4/G-forecast assembly)* | W unit; R all | R all; W none (comment/support only) | R support register + summaries | — |
| Schedule lines | W on own opportunities | W unit | R | — | — |
| Stage change / close / reopen | Own records | Unit records | — | — | — |
| Owner reassignment | — (request only) | W within unit | W cross-unit | — | — |
| Initiatives | R all; note on ones they champion | W unit | W all | R | — |
| Tenders | W own; R all | W unit; R all | R all | R summary | — |
| Targets | R own + own unit | R unit; propose | W (set/revise); approval per A5 | R | — |
| Budget lines | — | W unit | W | R summary | — |
| **Workload / capacity views** | **Own row only** *(provisional D-12, per J1/J5)* | Own unit's individuals | Aggregates + individuals *(revisit at J1 answer)* | Aggregates only | — |
| Snapshots / movement | R | R | R | R | W (trigger) |
| Ref data, users, settings | — | — | — | — | W |
| Audit log | Own records' trail | Unit records' trail | R all | — | R all |

Notes:
- **Probability override** (BR-OPP-05): any writer may override *with a note*; A5 may later
  restrict this to unit_head approval — the API already funnels it through one endpoint, so
  adding an approval step is contained.
- **Target approval** (A5): `approved_by/approved_at` fields exist; until A5 is answered,
  bd_leadership both sets and approves.
- **J6** (non-BD people who carry pursuits, e.g. a unit head closing deals): any role can be an
  opportunity owner; capacity reporting includes whoever owns pursuits, filtered by role if J6
  answers otherwise.

## 3. Row visibility implementation

- Every list/read query passes through `VisibilityGuard.scope(user, entity)` which appends the
  WHERE clause; there is no unscoped query path. 404 (not 403) for records outside scope, so
  the API doesn't leak existence.
- Rules are data-driven where they may flip (shared-vs-personal default D-11, workload
  visibility D-12): a `system_setting` toggle, not a code change. The Spec is explicit that
  retrofitting visibility is expensive — so it is built first and configured later.

## 4. Field-level audit

**What is audited (FR-AUD-01):** every INSERT/UPDATE/archive on business tables
(`account`…`budget_line`), one `audit_log` row per changed field, grouped by `request_id`,
written in the same transaction by the audit middleware. `stage_history`, `owner_reassignment`,
`support_request`, `initiative_note`, snapshots and `audit_log` itself are append-only and are
their own audit record.

**Surfaced in the UI, not just stored:**
- Probability overrides: value, note, who, when — on the opportunity, answering "who changed a
  probability and when" (§11) without opening the audit log.
- Owner reassignments with reasons (J2).
- Complexity overrides (§16 caution: "record who overrode it").
- Target versions: original always visible next to revision (D5).

**Retention:** never purged in Phase 1 (volumes are trivial). Contact-person anonymisation
under NFR-SEC-06 rewrites the person's PII in place and audit rows referencing it — deal
history survives, personal data does not.

## 5. The appraisal caution, operationalised (Spec §16)

1. Workload dashboards state their purpose on-face: *"For rebalancing work, not for ranking
   people."* Static text, part of the acceptance criteria for those screens.
2. Individual load visible only to the person and their unit head until J1/J5 are answered
   (D-12).
3. Complexity weight defaults from product/pursuit type; self-set overrides carry the note and
   the author's name (BR-OPP-07) so drift is attributable.
4. No workload measure appears in any export by default; a deliberate admin action is required
   to include them, and doing so is audited.
