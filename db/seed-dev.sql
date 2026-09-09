-- Dev and staging fixtures. seed.ts refuses to apply this file in production.
BEGIN;

INSERT INTO app_user (email, full_name, role, unit_id, capacity_pursuits, availability_pct) VALUES
  ('dev.admin@example.test',  'Dev Admin',   'admin',        NULL,                                      NULL, 100),
  ('dev.head1@example.test',  'Unit One Head','unit_head',   (SELECT id FROM unit WHERE code='UNIT1'),  10,  100),
  ('dev.owner1@example.test', 'Owner One',   'bd_owner',     (SELECT id FROM unit WHERE code='UNIT1'),  8,   100),
  ('dev.owner2@example.test', 'Owner Two',   'bd_owner',     (SELECT id FROM unit WHERE code='UNIT3'),  8,   60),
  ('dev.lead@example.test',   'BD Lead',     'bd_leadership',NULL,                                      NULL, 100)
ON CONFLICT (email) DO NOTHING;

INSERT INTO product (code, name, default_complexity) VALUES
  ('MED',    'Medical',     'standard'),
  ('MOTOR',  'Motor',       'light'),
  ('CREDIT', 'Credit Life', 'standard'),
  ('WIBA',   'WIBA',        'light')
ON CONFLICT (code) DO NOTHING;

INSERT INTO account (name, sector_id, unit_id) VALUES
  ('Memnon Capital',   (SELECT id FROM sector WHERE code='EMT'), (SELECT id FROM unit WHERE code='UNIT1')),
  ('Kampala Logistics',(SELECT id FROM sector WHERE code='IND'), (SELECT id FROM unit WHERE code='UNIT1')),
  ('Nile Microfinance',(SELECT id FROM sector WHERE code='EBM'), (SELECT id FROM unit WHERE code='UNIT3'))
ON CONFLICT DO NOTHING;

-- Opportunity with a two-line schedule
INSERT INTO opportunity (account_id, name, unit_id, sector_id, owner_id, stage_id, probability,
                         expected_close_date, close_confidence, created_by)
SELECT a.id, 'Memnon Capital Medical 2026', u.id, s.id, o.id, st.id, st.default_probability,
       '2026-11-30', 'estimated', o.id
FROM account a, unit u, sector s, app_user o, pipeline_stage st
WHERE a.name='Memnon Capital' AND u.code='UNIT1' AND s.code='EMT'
  AND o.email='dev.owner1@example.test' AND st.code='QUOTE'
ON CONFLICT DO NOTHING;

INSERT INTO revenue_schedule_line (opportunity_id, product_id, effective_month, expected_amount)
SELECT o.id, p.id, m.month::date, m.amount
FROM opportunity o
JOIN product p ON p.code='MED'
CROSS JOIN (VALUES ('2026-10-01', 45000000::numeric), ('2026-11-01', 45000000::numeric)) AS m(month, amount)
WHERE o.name='Memnon Capital Medical 2026'
  AND NOT EXISTS (SELECT 1 FROM revenue_schedule_line r WHERE r.opportunity_id = o.id);

INSERT INTO stage_history (opportunity_id, from_stage_id, to_stage_id, changed_by)
SELECT o.id, NULL, o.stage_id, o.created_by FROM opportunity o
WHERE o.name='Memnon Capital Medical 2026'
  AND NOT EXISTS (SELECT 1 FROM stage_history h WHERE h.opportunity_id = o.id);

-- Opportunity with no schedule lines, no next action, and a stale timestamp
INSERT INTO opportunity (account_id, name, unit_id, sector_id, owner_id, stage_id, probability,
                         expected_close_date, close_confidence, created_by, updated_at)
SELECT a.id, 'Nile Microfinance Credit Life 2026', u.id, s.id, o.id, st.id, st.default_probability,
       '2026-08-15', 'tbc', o.id, now() - interval '45 days'
FROM account a, unit u, sector s, app_user o, pipeline_stage st
WHERE a.name='Nile Microfinance' AND u.code='UNIT3' AND s.code='EBM'
  AND o.email='dev.owner2@example.test' AND st.code='PROSPECT'
ON CONFLICT DO NOTHING;

-- Initiative
INSERT INTO strategic_initiative (name, unit_id, sector_id, champion_id, annual_target, target_year, status_id)
SELECT 'NGO Forum', u.id, s.id, c.id, 800000000, 2026, rv.id
FROM unit u, sector s, app_user c, ref_value rv
JOIN ref_list rl ON rl.id = rv.list_id
WHERE u.code='UNIT1' AND s.code='EMT' AND c.email='dev.owner1@example.test'
  AND rl.code='initiative_status' AND rv.code='active'
ON CONFLICT (name) DO NOTHING;

UPDATE opportunity SET initiative_id = (SELECT id FROM strategic_initiative WHERE name='NGO Forum')
WHERE name='Memnon Capital Medical 2026' AND initiative_id IS NULL;

-- Prequalification and the tender it enabled, on different value bases
INSERT INTO tender (tender_type, issuing_body, title, sector_id, unit_id, recorded_value, value_basis,
                    status, submission_deadline, owner_id)
SELECT 'prequalification', 'Uganda Revenue Authority', 'URA-PQ-2026-014', s.id, u.id,
       1500000000, 'sum_insured', 'prequalified', '2026-07-01', o.id
FROM sector s, unit u, app_user o
WHERE s.code='IND' AND u.code='UNIT1' AND o.email='dev.owner1@example.test'
  AND NOT EXISTS (SELECT 1 FROM tender WHERE title='URA-PQ-2026-014');

INSERT INTO tender (tender_type, issuing_body, title, sector_id, unit_id, recorded_value, value_basis,
                    status, submission_deadline, owner_id, parent_prequalification_id)
SELECT 'tender', 'Uganda Revenue Authority', 'URA-T-2026-031', s.id, u.id,
       120000000, 'brokerage_income', 'to_submit', CURRENT_DATE + 10, o.id, pq.id
FROM sector s, unit u, app_user o, tender pq
WHERE s.code='IND' AND u.code='UNIT1' AND o.email='dev.owner1@example.test'
  AND pq.title='URA-PQ-2026-014'
  AND NOT EXISTS (SELECT 1 FROM tender WHERE title='URA-T-2026-031');

COMMIT;
