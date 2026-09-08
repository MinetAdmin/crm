-- ============================================================================
-- BD CRM — PostgreSQL schema, v1.0 (2026-09-09)
-- Source of truth for the data model in docs/04-data-model.md.
-- Traceable to Spec §4, §5, §6, §8, §15, §16 and PRD requirement IDs.
-- Conventions: snake_case; surrogate bigint identity PKs; soft delete via
-- archived_at; created/updated stamps on business tables; money numeric(18,2);
-- months stored as DATE pinned to the 1st.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Enums: structural values only. Everything user-manageable is a table row.
-- ---------------------------------------------------------------------------
CREATE TYPE outcome_t            AS ENUM ('open','won','lost','on_hold','withdrawn');
CREATE TYPE close_confidence_t   AS ENUM ('confirmed','estimated','tbc');
CREATE TYPE forecast_category_t  AS ENUM ('prior_forecast','additional_forecast');
CREATE TYPE lead_status_t        AS ENUM ('new','contacted','qualifying','qualified','disqualified','dormant','converted');
CREATE TYPE revenue_type_t       AS ENUM ('new_business','renewal','cross_sell','upsell');
CREATE TYPE tender_type_t        AS ENUM ('prequalification','tender');
CREATE TYPE tender_status_t      AS ENUM ('to_submit','submitted','in_evaluation','prequalified','won','lost','withdrawn');
CREATE TYPE value_basis_t        AS ENUM ('brokerage_income','sum_insured','premium');  -- BR-TEN-01
CREATE TYPE target_level_t       AS ENUM ('company','unit','initiative','owner','product');
CREATE TYPE support_type_t       AS ENUM ('management','mrs');                          -- pending I6
CREATE TYPE activity_type_t      AS ENUM ('meeting','call','submission','task','next_action');
CREATE TYPE user_role_t          AS ENUM ('bd_owner','unit_head','bd_leadership','executive_ro','admin');
CREATE TYPE complexity_t         AS ENUM ('light','standard','complex');

-- ---------------------------------------------------------------------------
-- Reference / organisational structure  (Spec §15 correction: unit ⊃ sector;
-- department retired — Decision D-05)
-- ---------------------------------------------------------------------------
CREATE TABLE unit (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text NOT NULL UNIQUE,          -- 'UNIT1','UNIT2','UNIT3'
  name        text NOT NULL,
  active      boolean NOT NULL DEFAULT true
);

CREATE TABLE sector (                         -- the workbook's "Dept" = pack's "Sector"
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  unit_id     bigint NOT NULL REFERENCES unit(id),   -- fixed hierarchy, pending I7
  code        text NOT NULL UNIQUE,          -- 'EMT','IND','SPE','SME','EBM'
  name        text NOT NULL,
  active      boolean NOT NULL DEFAULT true
);

CREATE TABLE product (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,                 -- ~16 real products after F3 sign-off
  default_complexity complexity_t NOT NULL DEFAULT 'standard',  -- BR-OPP-07 default source
  active      boolean NOT NULL DEFAULT true
);

CREATE TABLE pipeline_stage (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code                text NOT NULL UNIQUE,  -- 'PROSPECT','INFO','ENGAGED','QUOTE','SUBMITTED','SHORTLIST'
  name                text NOT NULL,
  sort_order          int  NOT NULL UNIQUE,
  default_probability numeric(5,2) NOT NULL CHECK (default_probability BETWEEN 0 AND 100),
  exit_criterion      text NOT NULL,         -- shown in UI on stage change (FR-OPP-02)
  active              boolean NOT NULL DEFAULT true
);

-- Generic managed picklists (lead source, loss reason, disqualification reason,
-- hold reason, initiative status, cost category, tender outcome reason, ...)
CREATE TABLE ref_list (
  id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code  text NOT NULL UNIQUE                 -- 'lead_source','loss_reason',...
);
CREATE TABLE ref_value (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id   bigint NOT NULL REFERENCES ref_list(id),
  code      text NOT NULL,
  label     text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active    boolean NOT NULL DEFAULT true,   -- deactivate, never delete (FR-ADM-01)
  UNIQUE (list_id, code)
);

CREATE TABLE system_setting (                -- FR-ADM-03
  key   text PRIMARY KEY,                    -- 'committed_threshold_pct'=50,
  value text NOT NULL                        -- 'ageing_days'=30, 'coverage_min'=3.0,
);                                           -- 'concentration_threshold_pct', 'fy_end_month'

-- ---------------------------------------------------------------------------
-- Users  (Spec §4 User and Team; §16 capacity additions)
-- ---------------------------------------------------------------------------
CREATE TABLE app_user (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email             text NOT NULL UNIQUE,
  full_name         text NOT NULL,
  role              user_role_t NOT NULL,
  unit_id           bigint REFERENCES unit(id),
  capacity_pursuits int,                      -- nominal concurrent pursuits (§16)
  pipeline_split_pct numeric(5,2),            -- share of time on pipeline vs initiatives
  availability_pct  numeric(5,2) NOT NULL DEFAULT 100,  -- leave / part-time (§16)
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Accounts and contacts
-- ---------------------------------------------------------------------------
CREATE TABLE account (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            text NOT NULL,
  normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(name,'\s+',' ','g'))) STORED,
  sector_id       bigint REFERENCES sector(id),
  unit_id         bigint REFERENCES unit(id),
  country         char(2) NOT NULL DEFAULT 'UG',
  operations_ref  text,                      -- reference to the post-win account (Spec §1)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz
);
CREATE UNIQUE INDEX account_normalized_name_uq ON account (normalized_name) WHERE archived_at IS NULL;  -- FR-ACC-02

CREATE TABLE contact (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id        bigint NOT NULL REFERENCES account(id),
  full_name         text NOT NULL,
  role_title        text,
  email             text,
  phone             text,
  is_decision_maker boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  archived_at       timestamptz
);

-- ---------------------------------------------------------------------------
-- Leads  (Spec §5.1)
-- ---------------------------------------------------------------------------
CREATE TABLE lead (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- Lead ID, never edited
  company_name      text NOT NULL,
  matched_account_id bigint REFERENCES account(id),
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  source_id         bigint NOT NULL REFERENCES ref_value(id),  -- list 'lead_source'
  sector_id         bigint REFERENCES sector(id),
  unit_id           bigint NOT NULL REFERENCES unit(id),
  estimated_value   numeric(18,2),            -- order of magnitude, never in forecast
  currency          char(3) NOT NULL DEFAULT 'UGX',
  owner_id          bigint NOT NULL REFERENCES app_user(id),
  status            lead_status_t NOT NULL DEFAULT 'new',
  disqualification_reason_id bigint REFERENCES ref_value(id),  -- list 'disqualification_reason'
  converted_opportunity_id bigint,            -- FK added after opportunity table
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  archived_at       timestamptz,
  -- BR-LEAD-02: disqualified requires a reason
  CONSTRAINT lead_disqualified_needs_reason CHECK
    (status <> 'disqualified' OR disqualification_reason_id IS NOT NULL),
  -- BR-LEAD-01 (part): qualified/converted requires a contact method
  CONSTRAINT lead_qualified_needs_contact CHECK
    (status NOT IN ('qualified','converted') OR contact_email IS NOT NULL OR contact_phone IS NOT NULL)
);

CREATE TABLE lead_product_interest (          -- multi-select (§5.1)
  lead_id    bigint NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES product(id),
  PRIMARY KEY (lead_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Strategic initiatives  (Spec §5.4, §16)
-- ---------------------------------------------------------------------------
CREATE TABLE strategic_initiative (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            text NOT NULL UNIQUE,       -- managed name; resolves case variants
  unit_id         bigint NOT NULL REFERENCES unit(id),
  sector_id       bigint NOT NULL REFERENCES sector(id),   -- mandatory (§5.4)
  champion_id     bigint NOT NULL REFERENCES app_user(id),
  effort_share_pct numeric(5,2),              -- expected share of champion's time (§16)
  annual_target   numeric(18,2) NOT NULL,     -- the one legitimately entered figure
  target_year     int NOT NULL,
  status_id       bigint NOT NULL REFERENCES ref_value(id), -- list 'initiative_status'
  next_milestone  text,
  next_milestone_date date,                   -- real date; prose stays in the text
  milestone_completed_at date,                -- §16 action-completion addition
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz
);
-- Revenue delivered / expected-by-period / gap / linked opportunities: DERIVED. See views.

CREATE TABLE initiative_co_champion (
  initiative_id bigint NOT NULL REFERENCES strategic_initiative(id) ON DELETE CASCADE,
  user_id       bigint NOT NULL REFERENCES app_user(id),
  PRIMARY KEY (initiative_id, user_id)
);

CREATE TABLE initiative_note (                -- append-only evidence log (FR-INIT-03)
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  initiative_id bigint NOT NULL REFERENCES strategic_initiative(id),
  author_id     bigint NOT NULL REFERENCES app_user(id),
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Opportunities  (Spec §5.2, §6, §15, §16)
-- ---------------------------------------------------------------------------
CREATE TABLE opportunity (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id            bigint NOT NULL REFERENCES account(id),
  name                  text NOT NULL,        -- convention: account, product family, year
  unit_id               bigint NOT NULL REFERENCES unit(id),
  sector_id             bigint NOT NULL REFERENCES sector(id),
  owner_id              bigint NOT NULL REFERENCES app_user(id),   -- BR-OPP-01
  stage_id              bigint NOT NULL REFERENCES pipeline_stage(id),
  outcome               outcome_t NOT NULL DEFAULT 'open',
  probability           numeric(5,2) NOT NULL CHECK (probability BETWEEN 0 AND 100),
  probability_override_note text,             -- BR-OPP-05: required when != stage default (app-enforced)
  expected_close_date   date NOT NULL,        -- BR-OPP-06: a true date
  close_confidence      close_confidence_t NOT NULL DEFAULT 'estimated',
  initiative_id         bigint REFERENCES strategic_initiative(id), -- one-to-many (D-10, pending E1)
  forecast_category     forecast_category_t,
  key_blocker           text,                 -- blank means none; NIL/None/N-A retired
  loss_reason_id        bigint REFERENCES ref_value(id),  -- list 'loss_reason'
  loss_reason_text      text,
  hold_reason_id        bigint REFERENCES ref_value(id),  -- list 'hold_reason'
  source_lead_id        bigint REFERENCES lead(id),       -- set on conversion, read-only
  complexity            complexity_t NOT NULL DEFAULT 'standard',  -- §16
  complexity_override_note text,              -- BR-OPP-07
  stage_entered_at      timestamptz NOT NULL DEFAULT now(),
  stage_entry_backfilled boolean NOT NULL DEFAULT false,  -- migration backfill flag (§16)
  created_by            bigint NOT NULL REFERENCES app_user(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_by            bigint REFERENCES app_user(id),
  updated_at            timestamptz NOT NULL DEFAULT now(),  -- system stamp, never typed
  archived_at           timestamptz,
  -- BR-OPP-04: lost / on hold require a reason
  CONSTRAINT opp_lost_needs_reason CHECK
    (outcome <> 'lost'    OR loss_reason_id IS NOT NULL),
  CONSTRAINT opp_hold_needs_reason CHECK
    (outcome <> 'on_hold' OR hold_reason_id IS NOT NULL)
);
CREATE INDEX opp_owner_idx  ON opportunity (owner_id) WHERE outcome = 'open';
CREATE INDEX opp_stage_idx  ON opportunity (stage_id);
CREATE INDEX opp_init_idx   ON opportunity (initiative_id);

ALTER TABLE lead ADD CONSTRAINT lead_converted_opp_fk
  FOREIGN KEY (converted_opportunity_id) REFERENCES opportunity(id);

CREATE TABLE opportunity_co_owner (           -- replaces Helen/Evelyn/Edgar in one cell
  opportunity_id bigint NOT NULL REFERENCES opportunity(id) ON DELETE CASCADE,
  user_id        bigint NOT NULL REFERENCES app_user(id),
  PRIMARY KEY (opportunity_id, user_id)
);

-- Typed management-support interventions (§15 correction; FR-OPP-07)
CREATE TABLE support_request (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id bigint NOT NULL REFERENCES opportunity(id),
  support_type   support_type_t NOT NULL,
  ask            text NOT NULL,               -- what is needed
  requested_by   bigint NOT NULL REFERENCES app_user(id),
  requested_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  resolution     text
);

-- Owner reassignment as audited event (FR-OPP-05, J2 / D-13)
CREATE TABLE owner_reassignment (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id bigint NOT NULL REFERENCES opportunity(id),
  from_owner_id  bigint NOT NULL REFERENCES app_user(id),
  to_owner_id    bigint NOT NULL REFERENCES app_user(id),
  reason         text NOT NULL,
  decided_by     bigint NOT NULL REFERENCES app_user(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Stage history — the 14th entity; written automatically, never edited (FR-OPP-04)
CREATE TABLE stage_history (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id bigint NOT NULL REFERENCES opportunity(id),
  from_stage_id  bigint REFERENCES pipeline_stage(id),   -- NULL on creation
  to_stage_id    bigint NOT NULL REFERENCES pipeline_stage(id),
  changed_by     bigint NOT NULL REFERENCES app_user(id),
  changed_at     timestamptz NOT NULL DEFAULT now(),
  backfilled     boolean NOT NULL DEFAULT false          -- exclude from throughput (§16)
);
CREATE INDEX stage_history_opp_idx ON stage_history (opportunity_id, changed_at);

-- ---------------------------------------------------------------------------
-- Revenue schedule lines  (Spec §5.3) — where the money lives
-- ---------------------------------------------------------------------------
CREATE TABLE revenue_schedule_line (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id       bigint NOT NULL REFERENCES opportunity(id),
  product_id           bigint NOT NULL REFERENCES product(id),
  effective_month      date NOT NULL CHECK (extract(day FROM effective_month) = 1), -- BR-RSL-02
  expected_amount      numeric(18,2) NOT NULL CHECK (expected_amount > 0),          -- BR-RSL-01
  currency             char(3) NOT NULL DEFAULT 'UGX',
  probability_override numeric(5,2) CHECK (probability_override BETWEEN 0 AND 100), -- per-line, rare
  probability_override_note text,
  revenue_type         revenue_type_t NOT NULL DEFAULT 'new_business',
  recurring            boolean NOT NULL DEFAULT false,
  actual_amount        numeric(18,2),         -- D-09 (pending C3): recorded when won
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  archived_at          timestamptz
  -- Weighted amount is NOT a column. See v_schedule_line_weighted.
  -- C1-contingent (if amounts turn out to be premium): add premium_amount,
  -- commission_rate; expected_amount becomes derived. Isolated to this table.
);
CREATE INDEX rsl_opp_idx   ON revenue_schedule_line (opportunity_id);
CREATE INDEX rsl_month_idx ON revenue_schedule_line (effective_month);

-- ---------------------------------------------------------------------------
-- Activities / next actions  (Spec §4 Activity; §16 completion date)
-- ---------------------------------------------------------------------------
CREATE TABLE activity (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activity_type  activity_type_t NOT NULL,
  subject        text NOT NULL,
  lead_id        bigint REFERENCES lead(id),
  opportunity_id bigint REFERENCES opportunity(id),
  account_id     bigint REFERENCES account(id),
  owner_id       bigint NOT NULL REFERENCES app_user(id),
  due_date       date,
  completed_at   timestamptz,                 -- absent+past-due = overdue (§16)
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_has_parent CHECK
    (lead_id IS NOT NULL OR opportunity_id IS NOT NULL OR account_id IS NOT NULL)
);
CREATE INDEX activity_open_idx ON activity (owner_id, due_date) WHERE completed_at IS NULL;
-- BR-OPP-02 ("open opportunity must have a next action with due date") is enforced in the
-- app layer: an open opportunity must always reference exactly one open activity of type
-- 'next_action' with a due_date. Exceptions surface on the hygiene report.

-- ---------------------------------------------------------------------------
-- Tenders  (Spec §15) — the 13th entity
-- ---------------------------------------------------------------------------
CREATE TABLE tender (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tender_type         tender_type_t NOT NULL,
  issuing_body        text NOT NULL,
  title               text NOT NULL,          -- tender reference
  sector_id           bigint NOT NULL REFERENCES sector(id),
  unit_id             bigint NOT NULL REFERENCES unit(id),
  recorded_value      numeric(18,2) NOT NULL,
  currency            char(3) NOT NULL DEFAULT 'UGX',
  value_basis         value_basis_t NOT NULL, -- BR-TEN-01: never sum across bases
  status              tender_status_t NOT NULL DEFAULT 'to_submit',
  published_date      date,
  submission_deadline date,                   -- drives the time-critical alert (FR-TEN-02)
  submitted_date      date,
  decision_date       date,
  outcome_reason_id   bigint REFERENCES ref_value(id),   -- list 'tender_outcome_reason'
  outcome_text        text,
  linked_opportunity_id bigint REFERENCES opportunity(id),  -- optional; most tenders have none
  parent_prequalification_id bigint REFERENCES tender(id),  -- prequal → tender conversion
  owner_id            bigint REFERENCES app_user(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  archived_at         timestamptz,
  -- BR-TEN-02: decided states need an outcome reason
  CONSTRAINT tender_decided_needs_reason CHECK
    (status NOT IN ('won','lost') OR outcome_reason_id IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Targets  (Spec §8.1, §15 monthly phasing, D5 versioning)
-- ---------------------------------------------------------------------------
CREATE TABLE target (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_year   int NOT NULL,
  level         target_level_t NOT NULL,
  unit_id       bigint REFERENCES unit(id),
  initiative_id bigint REFERENCES strategic_initiative(id),
  owner_id      bigint REFERENCES app_user(id),
  product_id    bigint REFERENCES product(id),
  amount        numeric(18,2) NOT NULL,
  version       int NOT NULL DEFAULT 1,       -- FR-TGT-02: revisions supersede, never overwrite
  superseded_by bigint REFERENCES target(id),
  approved_by   bigint REFERENCES app_user(id),
  approved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- exactly the dimension implied by level is set
  CONSTRAINT target_level_dims CHECK (
    (level='company'    AND unit_id IS NULL AND initiative_id IS NULL AND owner_id IS NULL) OR
    (level='unit'       AND unit_id IS NOT NULL AND initiative_id IS NULL AND owner_id IS NULL) OR
    (level='initiative' AND initiative_id IS NOT NULL) OR
    (level='owner'      AND owner_id IS NOT NULL) OR
    (level='product'    AND product_id IS NOT NULL)
  )
);
CREATE TABLE target_phasing (                 -- §15: budget is phased to the month
  target_id bigint NOT NULL REFERENCES target(id) ON DELETE CASCADE,
  month     date NOT NULL CHECK (extract(day FROM month) = 1),
  amount    numeric(18,2) NOT NULL,
  PRIMARY KEY (target_id, month)
);
-- BR-TGT-01 (unit set must reconcile to company target) is app-enforced at save-set time.

-- ---------------------------------------------------------------------------
-- Budget lines  (Spec §8.2; deferred if D3 says so)
-- ---------------------------------------------------------------------------
CREATE TABLE budget_line (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cost_category_id bigint NOT NULL REFERENCES ref_value(id),  -- list 'cost_category'
  unit_id          bigint NOT NULL REFERENCES unit(id),
  period_month     date NOT NULL CHECK (extract(day FROM period_month) = 1),
  budgeted_amount  numeric(18,2) NOT NULL,
  actual_amount    numeric(18,2),
  opportunity_id   bigint REFERENCES opportunity(id),   -- cost per bid / per win
  initiative_id    bigint REFERENCES strategic_initiative(id),  -- return on initiative spend
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Forecast snapshots  (Spec §7) — immutable month-end copies
-- ---------------------------------------------------------------------------
CREATE TABLE forecast_snapshot (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_month date NOT NULL UNIQUE CHECK (extract(day FROM snapshot_month) = 1),
  taken_at       timestamptz NOT NULL DEFAULT now(),
  taken_by       bigint REFERENCES app_user(id)  -- NULL = scheduled job
);
CREATE TABLE forecast_snapshot_line (         -- denormalised on purpose: history must not
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- shift when masters change
  snapshot_id      bigint NOT NULL REFERENCES forecast_snapshot(id),
  opportunity_id   bigint NOT NULL,
  schedule_line_id bigint,
  account_name     text NOT NULL,
  owner_id         bigint NOT NULL,
  unit_code        text NOT NULL,
  sector_code      text NOT NULL,
  initiative_id    bigint,
  stage_code       text NOT NULL,
  outcome          outcome_t NOT NULL,
  product_code     text,
  effective_month  date,
  expected_amount  numeric(18,2),
  probability      numeric(5,2),
  weighted_amount  numeric(18,2),
  expected_close_date date
);
CREATE INDEX fsl_snapshot_idx ON forecast_snapshot_line (snapshot_id);
-- App role gets INSERT + SELECT only on both tables; no UPDATE/DELETE grants.

-- ---------------------------------------------------------------------------
-- Audit log  (FR-AUD-01) — append-only, written in-transaction by middleware
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity      text NOT NULL,                  -- 'opportunity','target',...
  entity_id   bigint NOT NULL,
  field       text NOT NULL,
  old_value   text,
  new_value   text,
  changed_by  bigint NOT NULL REFERENCES app_user(id),
  changed_at  timestamptz NOT NULL DEFAULT now(),
  request_id  uuid                            -- groups one save's changes
);
CREATE INDEX audit_entity_idx ON audit_log (entity, entity_id, changed_at);

-- ---------------------------------------------------------------------------
-- Phase-2 landing zone (I1/I2): monthly actuals & proformas by revenue line.
-- Created now so a finance CSV can load without a schema change; unused in Phase 1 UI.
-- ---------------------------------------------------------------------------
CREATE TABLE revenue_actual (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  period_month date NOT NULL CHECK (extract(day FROM period_month) = 1),
  revenue_line text NOT NULL,                 -- 'new_business','retention','policy_fees'
  sector_id    bigint REFERENCES sector(id),
  basis        text NOT NULL DEFAULT 'actual' CHECK (basis IN ('actual','proforma')),
  amount       numeric(18,2) NOT NULL,
  source       text NOT NULL DEFAULT 'manual_load',
  loaded_at    timestamptz NOT NULL DEFAULT now(),
  loaded_by    bigint REFERENCES app_user(id)
);

-- ---------------------------------------------------------------------------
-- Derived views — the single source of every formula (doc 08)
-- ---------------------------------------------------------------------------
CREATE VIEW v_schedule_line_weighted AS
SELECT rsl.*,
       o.outcome,
       o.owner_id,
       o.unit_id,
       o.sector_id,
       o.initiative_id,
       o.stage_id,
       COALESCE(rsl.probability_override, o.probability)                    AS effective_probability,
       rsl.expected_amount * COALESCE(rsl.probability_override, o.probability) / 100.0
                                                                            AS weighted_amount
FROM revenue_schedule_line rsl
JOIN opportunity o ON o.id = rsl.opportunity_id
WHERE rsl.archived_at IS NULL AND o.archived_at IS NULL;

CREATE VIEW v_initiative_rollup AS            -- Spec §5.4: derived, never typed
SELECT si.id AS initiative_id,
       si.annual_target,
       COALESCE(SUM(CASE WHEN w.outcome = 'won'  THEN COALESCE(w.actual_amount, w.expected_amount) END), 0) AS revenue_delivered,
       COALESCE(SUM(CASE WHEN w.outcome = 'open' THEN w.weighted_amount END), 0)                            AS weighted_expected,
       si.annual_target
         - COALESCE(SUM(CASE WHEN w.outcome = 'won'  THEN COALESCE(w.actual_amount, w.expected_amount) END), 0)
         - COALESCE(SUM(CASE WHEN w.outcome = 'open' THEN w.weighted_amount END), 0)                        AS gap_to_target
FROM strategic_initiative si
LEFT JOIN v_schedule_line_weighted w ON w.initiative_id = si.id
GROUP BY si.id, si.annual_target;

CREATE VIEW v_opportunity_hygiene AS          -- FR-RPT-12 exception feed
SELECT o.id,
       o.owner_id,
       o.updated_at,
       (now() - o.updated_at) > make_interval(days =>
          (SELECT value::int FROM system_setting WHERE key='ageing_days'))          AS is_stale,
       NOT EXISTS (SELECT 1 FROM activity a WHERE a.opportunity_id = o.id
                   AND a.activity_type='next_action' AND a.completed_at IS NULL)     AS missing_next_action,
       EXISTS (SELECT 1 FROM activity a WHERE a.opportunity_id = o.id
               AND a.activity_type='next_action' AND a.completed_at IS NULL
               AND a.due_date < CURRENT_DATE)                                        AS overdue_next_action,
       o.expected_close_date < CURRENT_DATE                                          AS close_date_past,
       NOT EXISTS (SELECT 1 FROM revenue_schedule_line r WHERE r.opportunity_id = o.id
                   AND r.archived_at IS NULL)                                        AS missing_schedule_lines
FROM opportunity o
WHERE o.outcome = 'open' AND o.archived_at IS NULL;

COMMIT;

-- Seed the structural rows (stages per Spec §6) — reference, adjust at workshop:
-- INSERT INTO pipeline_stage (code,name,sort_order,default_probability,exit_criterion) VALUES
--  ('PROSPECT','Prospecting',1,10,'A named contact has responded.'),
--  ('INFO','Information gathering',2,20,'Enough information held to price or scope.'),
--  ('ENGAGED','Engaged',3,35,'Client has invited a quotation, proposal or bid.'),
--  ('QUOTE','Quotation prepared',4,50,'Quotation issued to the client.'),
--  ('SUBMITTED','Proposal or tender submitted',5,70,'Client confirms receipt and evaluation is underway.'),
--  ('SHORTLIST','Shortlisted or final negotiation',6,85,'Award decision communicated.');
