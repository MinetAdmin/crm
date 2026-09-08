-- Production-safe reference data, idempotent. Starting values from Spec §6
-- and §15; the controlled-list workshop (doc 09 §1) may amend them via the
-- admin UI.
BEGIN;

-- Pipeline stages (Spec §6)
INSERT INTO pipeline_stage (code, name, sort_order, default_probability, exit_criterion) VALUES
  ('PROSPECT',  'Prospecting',                     1, 10, 'A named contact has responded.'),
  ('INFO',      'Information gathering',           2, 20, 'Enough information held to price or scope.'),
  ('ENGAGED',   'Engaged',                         3, 35, 'Client has invited a quotation, proposal or bid.'),
  ('QUOTE',     'Quotation prepared',              4, 50, 'Quotation issued to the client.'),
  ('SUBMITTED', 'Proposal or tender submitted',    5, 70, 'Client confirms receipt and evaluation is underway.'),
  ('SHORTLIST', 'Shortlisted or final negotiation',6, 85, 'Award decision communicated.')
ON CONFLICT (code) DO NOTHING;

-- Units and sectors (Spec §15: Unit 1 = EMT+IND, Unit 2 = SPE+SME, Unit 3 = EBM)
INSERT INTO unit (code, name) VALUES
  ('UNIT1', 'Unit 1'), ('UNIT2', 'Unit 2'), ('UNIT3', 'Unit 3')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sector (unit_id, code, name)
SELECT u.id, s.code, s.name
FROM (VALUES
  ('UNIT1', 'EMT', 'EMT'),
  ('UNIT1', 'IND', 'IND'),
  ('UNIT2', 'SPE', 'SPE'),
  ('UNIT2', 'SME', 'SME'),
  ('UNIT3', 'EBM', 'EBM')
) AS s(unit_code, code, name)
JOIN unit u ON u.code = s.unit_code
ON CONFLICT (code) DO NOTHING;

-- Managed picklists (Spec §5.1, §5.4, §8.2; workshop refines)
INSERT INTO ref_list (code) VALUES
  ('lead_source'), ('loss_reason'), ('disqualification_reason'),
  ('hold_reason'), ('initiative_status'), ('cost_category'),
  ('tender_outcome_reason')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ref_value (list_id, code, label, sort_order)
SELECT l.id, v.code, v.label, v.sort_order
FROM (VALUES
  -- lead_source (Spec §5.1)
  ('lead_source', 'referral',        'Referral',               1),
  ('lead_source', 'tender_notice',   'Tender notice',          2),
  ('lead_source', 'bancassurance',   'Bancassurance partner',  3),
  ('lead_source', 'cross_sell',      'Cross-sell',             4),
  ('lead_source', 'event',           'Event',                  5),
  ('lead_source', 'inbound',         'Inbound',                6),
  ('lead_source', 'outbound',        'Outbound',               7),
  ('lead_source', 'existing_client', 'Existing client',        8),
  -- initiative_status (Spec §5.4)
  ('initiative_status', 'not_started', 'Not started', 1),
  ('initiative_status', 'active',      'Active',      2),
  ('initiative_status', 'delayed',     'Delayed',     3),
  ('initiative_status', 'on_hold',     'On hold',     4),
  ('initiative_status', 'closed',      'Closed',      5),
  -- cost_category (Spec §8.2)
  ('cost_category', 'client_engagement', 'Client engagement and travel', 1),
  ('cost_category', 'tender_bid',        'Tender and bid costs',         2),
  ('cost_category', 'events_forums',     'Events and forums',            3),
  ('cost_category', 'marketing',         'Marketing and collateral',     4),
  ('cost_category', 'partner_channel',   'Partner and channel costs',    5),
  ('cost_category', 'people_incentive',  'People and incentive',         6)
) AS v(list_code, code, label, sort_order)
JOIN ref_list l ON l.code = v.list_code
ON CONFLICT (list_id, code) DO NOTHING;
-- loss_reason, disqualification_reason, hold_reason and tender_outcome_reason
-- are unseeded; their values come from the workshop (doc 09 §1, B3).

-- System settings (FR-ADM-03; doc 08 thresholds)
INSERT INTO system_setting (key, value) VALUES
  ('committed_threshold_pct',    '50'),
  ('ageing_days',                '30'),
  ('coverage_min',               '3.0'),
  ('concentration_threshold_pct','50'),
  ('fy_end_month',               '12'),
  ('complexity_weight_light',    '1'),
  ('complexity_weight_standard', '2'),
  ('complexity_weight_complex',  '4')
ON CONFLICT (key) DO NOTHING;

COMMIT;
