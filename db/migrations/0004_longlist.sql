-- The longlist is the step before a lead (D-29): a deliberately dirty register
-- of names worth pursuing. Planned entries come from the budget-year planning
-- list and are followed automatically through lead, pipeline and outcome;
-- anytime entries are contingency and future work.
BEGIN;

CREATE TYPE longlist_track_t AS ENUM ('planned', 'anytime');
CREATE TYPE longlist_status_t AS ENUM ('unworked', 'picked', 'parked', 'dropped');

CREATE TABLE longlist_entry (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_name       text NOT NULL,
  track              longlist_track_t NOT NULL DEFAULT 'anytime',
  plan_year          smallint,
  source             text,
  sector_id          bigint REFERENCES sector(id),
  unit_id            bigint REFERENCES unit(id),
  notes              text,
  status             longlist_status_t NOT NULL DEFAULT 'unworked',
  drop_reason        text,
  matched_account_id bigint REFERENCES account(id),
  promoted_lead_id   bigint REFERENCES lead(id),
  created_by         bigint NOT NULL REFERENCES app_user(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  archived_at        timestamptz,
  -- BR-LL-01: a planned entry names its budget year
  CONSTRAINT longlist_planned_needs_year CHECK (track <> 'planned' OR plan_year IS NOT NULL),
  -- BR-LL-02: picked means promoted, with the lead linked
  CONSTRAINT longlist_picked_needs_lead CHECK (status <> 'picked' OR promoted_lead_id IS NOT NULL),
  -- BR-LL-03: dropping a name requires saying why
  CONSTRAINT longlist_dropped_needs_reason CHECK (status <> 'dropped' OR drop_reason IS NOT NULL)
);

CREATE INDEX longlist_entry_track_idx ON longlist_entry (track, plan_year) WHERE archived_at IS NULL;
CREATE INDEX longlist_entry_status_idx ON longlist_entry (status) WHERE archived_at IS NULL;

COMMIT;
