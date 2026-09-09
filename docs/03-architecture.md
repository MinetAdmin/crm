# 03 — Architecture and Non-Functional Requirements

The Spec chose a custom web application (§11) and warned exactly where custom builds fail:
snapshots, audit and visibility get cut, and the maintenance obligation outlives the project.
The architecture below is therefore deliberately **boring, small, and single-deployable**:
one web app, one database, one scheduled job, managed hosting. Every exotic choice is a future
maintainer nobody has hired.

## 1. Constraints that shape the design

- ~6 BD owners + unit heads + management + admin ⇒ **≤ 25 users**, single country, one currency
  in practice (field exists for more).
- Data volume is tiny by database standards: hundreds of opportunities/year, thousands of
  schedule lines, tens of thousands of audit rows. **Correctness and auditability matter;
  performance is free at this scale.**
- No confirmed internal hosting/auth standard yet (Spec H5) — the design must slot into
  Microsoft 365/Entra if that answer comes back, without rework.
- The three non-negotiables (Spec §11): month-end snapshots + movement report, field-level
  audit, role-based visibility. These are architectural concerns, not features, and appear
  below as first-class components.

## 2. Stack (Decision D-01, confirmed direction: Azure)

H5 is answered: the organisation runs Microsoft Azure / M365. Identity is inherited from
Entra ID; hosting is Azure. One developer builds and runs this (see §2.2), which hardens the
"boring and small" bias into a rule.

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript end-to-end | One language for one developer; types shared between API and UI |
| Framework | Next.js (React) — UI + API routes in one deployable | Smallest credible ops surface for an internal CRUD-heavy app |
| ORM / migrations | Prisma (or Drizzle) against the SQL schema in `schema.sql` | Schema is the source of truth; migrations versioned in git |
| Database | PostgreSQL 16 — Azure Database for PostgreSQL Flexible Server, smallest burstable tier (see §8 cost note and Decision D-21) | Real constraints, managed backups/PITR; `schema.sql` runs as-is |
| Auth | **Entra ID SSO only, invite-only** (Auth.js with the Microsoft Entra ID provider) — see §2.1 | No passwords stored, no reset flows, MFA inherited from org Entra policy; "usually inherited, and cheaper that way" (Spec H5) |
| Jobs | One scheduled worker (cron): month-end snapshot, nightly exception/ageing recompute, tender-deadline alerts | The only asynchronous work in the system |
| Reporting | SQL views + server-rendered dashboards; XLSX export (SheetJS) | Views make formulas single-sourced (doc 08); export covers the "monthly pack" question G4 until I8 is answered |
| Email | Microsoft Graph `sendMail` from an app registration (or org SMTP relay) | Already licensed; no third-party provider |
| Hosting | **Azure Container Apps, consumption plan, scale-to-zero** (app + worker) | Sits inside the monthly free grant at this traffic — effectively $0 for compute; no Kubernetes, no microservices |

Swap tolerance: the data model (doc 04), API contract (doc 05) and report formulas (doc 08) are
stack-neutral.

### 2.1 Identity: invite-only Entra SSO

Modelled on the EAP implementation (`auth_azure.py`) and deliberately improved on four points.
What EAP got right and is kept:

- **Users are provisioned before they can sign in.** SSO login succeeds only for an existing
  `app_user` row; an unknown Microsoft account gets a readable "your account has not been
  provisioned" message, never a self-service signup.
- **Azure `oid` is the durable identity key.** Email is used once, to link the OID on first
  login; thereafter lookup is by OID. Re-linking an email that already belongs to a different
  OID is refused (recycled-email account-takeover guard).
- Masked email in auth logs; every failure path is a readable redirect, never a blank 5xx.

What is done better here:

1. **One place to manage access, and it is the app.** EAP required a matching record before
   sign-in but left the Entra side to portal work. Here invites are issued only in the CRM
   admin UI: the app registration stays open to the Minet tenant, Entra proves who the person
   is, and the `app_user` row decides whether they have an account. Nobody administers two
   systems to onboard one colleague. Turning on *Assignment required* in Entra remains
   available as optional hardening (it stops unlisted staff reaching the sign-in page at all)
   but nothing in the design depends on it.
2. **Single-tenant, not multi-tenant.** The OIDC issuer is pinned to the Minet tenant ID
   (never `common`); the EAP tenant-resolution table disappears — there is exactly one
   organisation.
3. **No password path at all.** EAP ran password auth and SSO side by side; this system is
   SSO-only. That deletes password storage, reset flows, TOTP management and the
   refresh-token rotation machinery — MFA, conditional access and offboarding are Entra's
   job (disabling the Entra account kills access instantly; the `app_user.active` flag is the
   in-app second layer).
4. **Standard library, not hand-rolled OAuth.** Auth.js's Entra ID provider handles
   state/PKCE/nonce and token validation; the EAP file hand-builds the redirect flow. Less
   code for a solo maintainer to own is the point.
5. **Authorization stays in the app.** Entra answers *who you are*; the doc 06 role matrix
   answers *what you may do*. Roles and units live on `app_user`, edited in the admin UI —
   no Entra app-role administration on the critical path.

**Invite flow (FR-ADM-02):** the admin creates the user in the CRM (name, work email, role,
unit, capacity fields), the person signs in with their normal Microsoft account, and that
first login links their OID and stamps `last_login`. No Azure portal step. Deactivation sets
`active=false`; the user record and its history are never deleted, and disabling the person's
Entra account cuts access to everything at once.

**First-run bootstrap.** A new deployment has no accounts, so nobody can issue the first
invite. While no account has ever been linked to a Microsoft identity, the first person to
sign in from the tenant is created as `admin`, and the event is written to the audit log. The
check runs inside the creating transaction, so a concurrent second sign-in cannot also claim
it. From that moment the system is invite-only: every later sign-in needs a record. The window
is therefore between deployment and the administrator's first login, which is why the admin
signs in immediately after go-live and the audit log is checked to confirm it was them.

### 2.1.1 Hosting does not change who gets in

Deploying to Azure changes nothing about access. The Container App is a public
HTTPS endpoint; the app itself runs the Entra flow and the `app_user` record
decides the rest. End users need no Azure RBAC, no Entra security group and no
app-role assignment, which is the point of D-23: an invite is a row in our
database, not a membership someone maintains in the portal.

**Leave Container Apps built-in authentication (Easy Auth) switched off.** It
would front the container with a second Entra layer, duplicate the flow the app
already performs, and reintroduce the portal-side configuration this design
removed.

Azure RBAC covers only the management plane: one Contributor assignment on the
resource group, to the developer, so releases and logs are reachable. That is a
single one-time assignment to a person, unrelated to CRM access. If network
narrowing is ever wanted, Container Apps ingress supports IP restrictions, which
involve no identity at all.

### 2.2 Solo-developer posture

One person builds and operates this. Consequences, treated as constraints:

- **Bus factor 1 is a standing risk.** Mitigations: this documentation pack stays current
  (doc 12 change protocol), the stack is mainstream (any TypeScript developer can pick it up),
  everything is in one repo, and ops is reduced to managed services + one admin runbook.
- **No code review.** CI is the reviewer: lint, typecheck, the full BR-rule and formula test
  suites gate every merge (doc 10 §5). The migration is scripted and rerunnable precisely so
  no judgement call lives only in one person's shell history.
- **The admin (H1) must not be the developer.** A named business-side admin owns picklists,
  users/invites, and the snapshot check — otherwise every list change becomes a dev ticket.

## 3. Components

```
┌──────────────────────────────────────────────────────────┐
│  Next.js app (one deployable)                            │
│                                                          │
│  UI (React, server-rendered)                             │
│  API routes (/api/v1/…)  ── validation layer (BR-*)      │
│        │                                                 │
│  Domain services:                                        │
│   • LeadConversionService   (atomic convert, FR-LEAD-04) │
│   • StageService            (stage change ⇒ StageHistory │
│                              row + probability default)  │
│   • SnapshotService         (month-end copy, immutable)  │
│   • RollupViews             (SQL views, doc 08)          │
│   • AuditMiddleware         (field-diff on every write,  │
│                              same transaction)           │
│   • VisibilityGuard         (row-level scoping, doc 06)  │
└───────────────┬──────────────────────────────────────────┘
                │
        PostgreSQL (managed, PITR)
                ▲
   Scheduled worker (cron): snapshots · ageing · deadline alerts
```

Key implementation rules:

1. **Audit is middleware, not memory.** Every mutating request passes through one code path
   that diffs old/new field values and writes `audit_log` rows **in the same transaction** as
   the change. There is no second way to write to the database from the app.
2. **Stage changes only via StageService.** It writes the `stage_history` row, resets
   `stage_entered_at`, applies the stage's default probability (unless overridden with a note),
   and enforces BR-OPP-03. Direct writes to `opportunity.stage_id` are blocked by code review
   convention and a DB trigger as belt-and-braces.
3. **Snapshots are copies, not queries.** The month-end job copies denormalised line-level
   rows into `forecast_snapshot_line`. Snapshot tables have no UPDATE/DELETE grants.
4. **Derived values live in SQL views** (`v_weighted_pipeline`, `v_initiative_rollup`,
   `v_owner_workload`, …) so every report and every screen reads the same formula.
5. **Reference data is data.** Picklists are rows, managed in the admin UI (FR-ADM-01), never
   enums baked into code — except `outcome` and `value_basis`, which are structural and
   change meaning if edited (DB enums).

## 4. Environments and delivery

| Env | Purpose | Data |
|---|---|---|
| dev | Local, per developer | Seed script (realistic anonymised data incl. edge cases from Spec §3) |
| staging | UAT, migration rehearsals | Masked copy of migration output |
| prod | Live | Real data; only migration and app write to it |

- CI: lint, typecheck, unit tests (all BR rules and report formulas), migration dry-run.
- CD: merge to `main` ⇒ staging; tagged release ⇒ prod. Rollback = redeploy previous tag;
  DB migrations forward-only with tested down-paths for the last step.

## 5. Non-functional requirements

### Security (NFR-SEC)
- **NFR-SEC-01** All traffic TLS; HSTS; session cookies HttpOnly/Secure/SameSite.
- **NFR-SEC-02** AuthN is Entra SSO only (§2.1); MFA/conditional access enforced via the org's
  Entra policy — verify an MFA policy actually covers this app before go-live.
- **NFR-SEC-03** AuthZ enforced server-side on every request via VisibilityGuard (doc 06);
  never trust the client for row scoping.
- **NFR-SEC-04** Secrets in the platform secret store; none in git.
- **NFR-SEC-05** OWASP basics: parameterised queries only (ORM), output encoding, CSRF
  protection on state-changing routes, rate-limited login.
- **NFR-SEC-06** Personal data (contact names, emails, phones) is in scope of the **Uganda
  Data Protection and Privacy Act 2019**: document a lawful basis, keep contact data minimal,
  support delete/anonymise of contact persons without destroying deal history.

### Availability & operations (NFR-OPS)
- **NFR-OPS-01** Target availability: business hours EAT; 99.5% monthly is sufficient — this is
  an internal tool, not a trading system. No on-call rota; next-business-day fix is acceptable
  outside month-end week.
- **NFR-OPS-02** **Month-end is the critical window.** Snapshot job must succeed before the
  1st; it retries, alerts on failure, and the admin can run it manually (FR-ADM-04).
- **NFR-OPS-03** Backups: managed daily snapshots + point-in-time recovery ≥ 7 days;
  quarterly restore test (a backup that has never been restored is a hope, not a backup).
- **NFR-OPS-04** Structured application logs + error tracking (e.g. Sentry); uptime check on
  `/health`.
- **NFR-OPS-05** Monthly export of full database to org-controlled storage — protects against
  platform lock-in and is itself an audit artefact.

### Performance (NFR-PERF)
- **NFR-PERF-01** Any list/dashboard < 2s at 10× projected data volume. At this scale that is
  a smoke test, not an engineering programme.

### Data integrity (NFR-DATA)
- **NFR-DATA-01** Every §3 finding has a schema-level guard (see doc 04 mapping table): IDs
  system-generated, dates typed, amounts numeric, picklists FK-enforced, aggregates absent
  from base tables, links real FKs, no version forks (one database, audit trail).
- **NFR-DATA-02** Soft-delete only (`archived_at`) on business entities; hard delete reserved
  for admin on records with no children and is itself audited.
- **NFR-DATA-03** Concurrency: optimistic locking (`updated_at` check) — two people editing
  the same opportunity get a conflict message, not silent last-write-wins. This is the
  two-divergent-workbooks failure, solved properly.

### Maintainability (NFR-MAINT)
- **NFR-MAINT-01** One repo, one deployable, one scheduled worker. A competent generalist can
  hold the whole system in their head.
- **NFR-MAINT-02** Report formulas exist exactly once (SQL views), documented in doc 08.
- **NFR-MAINT-03** Seed + fixture data covers every validation rule so regressions are caught
  by CI, not by the BD team.

## 6. Mobile (Spec H2, provisional)

Responsive web, desktop-first. The screens that must work well on a phone: my pipeline list,
opportunity detail (read + next-action update), lead capture form, tender deadlines. No native
app in Phase 1. Revisit if H2 comes back "field use is primary".

## 7. Integrations (Spec H3)

None in Phase 1. Email is outbound-only (alerts). The finance feed for actuals/proformas is a
Phase-2 question (I2) and enters as either a monthly CSV upload screen or a read integration —
the schema reserves the landing table either way (doc 04 §"Phase-2 readiness").

## 8. Azure hosting and the "no cost" constraint (Decision D-21)

The honest position first: **"hosted on Azure" and "zero cost" only coexist with a real
trade-off.** The app tier is genuinely free at this scale; the database is where the money
question lives.

**Compute — effectively $0, no trade-off.** Azure Container Apps consumption plan with
scale-to-zero. The monthly free grant (180k vCPU-seconds, 360k GiB-seconds, 2M requests) far
exceeds what ≤25 office-hours users generate; cold starts of a few seconds on first morning
request are acceptable for an internal tool. The scheduled worker runs as a Container Apps
job inside the same grant. Entra ID SSO for line-of-business apps is on the free tier. Avoid
App Service F1 for prod (60 CPU-min/day cap, no custom-domain TLS).

**Database — three options, ranked:**

| Option | Real cost | Trade-off |
|---|---|---|
| **A (recommended): Azure Database for PostgreSQL Flexible Server, B1ms burstable + 32GB** | ~US$15–20/month | The only option with none: `schema.sql` runs as-is, PITR backups managed, no porting, no cold-start pauses. This is the true price of the boss's own requirement (a properly hosted, backed-up DB) — cheaper than one hour of anyone's time per month |
| **B (the genuinely-$0 Azure path): Azure SQL Database free offer** (100k vCore-seconds + 32GB/month, free permanently, one per subscription) | $0 | It is SQL Server, not PostgreSQL: the schema, views and Prisma provider must be ported (enums→CHECKs, no partial indexes, T-SQL views) — roughly 1–2 weeks of solo-dev time, worth more than years of option A. The free quota also forces auto-pause: the first request after idle waits ~a minute, felt every morning |
| **C (rejected): free-tier external Postgres (Neon/Supabase) with the app on Azure** | $0 | Client personal data leaves the org's cloud onto a third party's free tier — wrong answer under NFR-SEC-06/DPPA and not what "host it on Azure" means |

**Recommendation:** present option A to the boss as the deliberate spend — ~$180–240/year,
against option B's one-off porting cost and permanent morning cold-starts. If $0 is a hard
mandate, option B is workable and this pack's docs 04–08 survive the port (the *model* is
unchanged; the DDL dialect changes). Decide before Sprint 0 ends — the ORM provider choice
follows it. A 12-month Azure free-account trial (750h B1ms) can defer the decision a year,
but only if the subscription is new and someone diarises the expiry.

Dev/staging cost nothing regardless: local Postgres (or LocalDB for option B) for dev; staging
as a second database on the same server/quota.
