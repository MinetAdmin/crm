# 05 — API Specification

REST over HTTPS, JSON, base path `/api/v1`. Server-enforced validation (all BR-* rules) and
row-level visibility (doc 06) on every endpoint. The UI is the only intended client, but the
contract is documented so the front and back ends don't negotiate ad hoc, and so a future
integration (H3) has a surface.

## 1. Conventions

- Auth: session cookie (Auth.js, Entra ID SSO — invite-only per doc 03 §2.1; no token or
  password endpoints exist). All endpoints require authentication; role/visibility rules
  per doc 06.
- IDs are server-generated integers; clients never supply them.
- Timestamps ISO-8601 UTC; months as `YYYY-MM`; money as decimal strings with `currency`.
- Lists: `GET` with `?page`, `?page_size` (≤200), `?sort`, and documented filters. Responses:
  `{ "data": [...], "page": n, "total": n }`.
- Writes send full or partial resources; partial = `PATCH`. Every write carries
  `If-Unmodified-Since`-style concurrency token: `{"updated_at": "..."} ` — mismatch ⇒
  `409 Conflict` (NFR-DATA-03).
- Soft delete via `POST /{resource}/{id}/archive`; no `DELETE` verbs except admin ref-data.

## 2. Error contract

```json
// 422 Unprocessable Entity — validation failure (BR rules)
{
  "error": "validation_failed",
  "violations": [
    { "rule": "BR-OPP-04", "field": "loss_reason_id",
      "message": "Outcome cannot be set to lost without a loss reason." }
  ]
}
```
`401` unauthenticated · `403` visibility/permission denied · `404` not found or not visible
(indistinguishable by design) · `409` concurrency conflict · `422` validation.
Every violation cites its BR id — the test plan (doc 10) asserts on these.

## 3. Resources

Standard CRUD (`GET /x`, `POST /x`, `GET /x/{id}`, `PATCH /x/{id}`, `POST /x/{id}/archive`)
exists for: `accounts`, `contacts`, `leads`, `opportunities`, `schedule-lines`, `initiatives`,
`initiative-notes` (create/list only — append-only), `activities`, `tenders`, `targets`,
`budget-lines`, `users` (admin), `ref-values` (admin), `settings` (admin). Non-obvious
behaviour below.

### Leads
- `POST /leads` — duplicate check runs automatically; response may include
  `"possible_duplicates": [{account_id, name, score}]` (FR-ACC-02).
- `POST /leads/{id}/convert` — atomic conversion (FR-LEAD-04).
  Body: `{ account_id | new_account:{...}, contact_id, opportunity: { name, stage_code:
  "PROSPECT"|"INFO", owner_id, unit_id, sector_id, expected_close_date, ... } }`
  Fails 422 citing the unmet condition(s) of the four conversion criteria.

### Opportunities
- `POST /opportunities/{id}/stage` — the **only** way stage changes.
  Body: `{ to_stage_code, probability_override?, override_note? }`.
  Writes `stage_history`, resets `stage_entered_at`, applies stage default probability unless
  overridden-with-note (BR-OPP-05), enforces BR-OPP-03 (schedule line required past QUOTE).
- `POST /opportunities/{id}/close` — body `{ outcome: "won"|"lost"|"on_hold"|"withdrawn",
  loss_reason_id?, loss_reason_text?, hold_reason_id?, actual_amounts?: [{line_id, amount}] }`.
  Enforces BR-OPP-04; stage is retained (stage-of-loss analysis). Won prompts actuals (D-09).
- `POST /opportunities/{id}/reopen` — outcome back to `open`; audited; requires next action in
  the same call (BR-OPP-02).
- `POST /opportunities/{id}/reassign` — body `{ to_owner_id, reason }`; writes
  `owner_reassignment` (FR-OPP-05).
- `POST /opportunities/{id}/support-requests` and
  `POST /support-requests/{id}/resolve` (FR-OPP-07).
- `GET /opportunities?owner_id=&unit_id=&stage=&outcome=&initiative_id=&exception=stale|no_next_action|overdue|past_close|no_lines`

### Targets
- `POST /targets/set` — saves a whole target set (e.g. all units for a year) transactionally;
  enforces BR-TGT-01 reconciliation; response includes `unallocated_remainder` while drafting
  (save-as-draft flag).
- `POST /targets/{id}/revise` — creates v+1, marks predecessor superseded (FR-TGT-02).

### Snapshots & reports (read model)
- `POST /snapshots` (admin) — manual month-end snapshot; scheduled job uses the same code path.
- `GET /snapshots` / `GET /snapshots/{month}`
- `GET /reports/pipeline?group_by=stage|owner|unit`
- `GET /reports/forecast?basis=won|committed|weighted|best_case|landing&from=YYYY-MM&to=YYYY-MM&group_by=month,unit,owner,initiative`
- `GET /reports/movement?from=YYYY-MM&to=YYYY-MM` — decomposition per doc 08 §3.
- `GET /reports/initiative-scorecard`
- `GET /reports/owner-performance?year=`
- `GET /reports/win-loss?group_by=product|sector|unit|source&period=`
- `GET /reports/funnel?year=`
- `GET /reports/support-register`
- `GET /reports/exceptions` — hygiene feed (FR-RPT-12)
- `GET /reports/workload` · `GET /reports/workload/rebalancing` ·
  `GET /reports/workload/bogged-down` · `GET /reports/initiative-load` ·
  `GET /reports/unowned`
- Every report response carries `"status": "ok" | "insufficient_data"`, and when insufficient:
  `"meaningful_from": "YYYY-MM-DD"` (FR-RPT-11). Clients must render that message, never an
  empty chart.
- `GET /reports/{name}/export.xlsx` — same data as the JSON, for the monthly pack until I8 is
  settled.

### Tenders
- `POST /tenders/{id}/link-opportunity` body `{opportunity_id}`.
- `GET /tenders?type=&status=&deadline_within_days=` — deadline filter feeds the alert job.

### Audit
- `GET /audit?entity=&entity_id=` (admin; record owners see their own records' trail).

## 4. Jobs (no public API)

| Job | Schedule | Behaviour |
|---|---|---|
| Month-end snapshot | Last day 23:55 EAT + retry window | Same code path as `POST /snapshots`; alert on failure (NFR-OPS-02) |
| Hygiene recompute + digest | Nightly | Evaluates `v_opportunity_hygiene`, emails owners their exceptions |
| Tender deadline alert | Daily | Alerts owner + unit head at T-14/T-7/T-2 before `submission_deadline` |
