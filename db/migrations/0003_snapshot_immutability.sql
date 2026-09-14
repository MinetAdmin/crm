-- Snapshot tables are insert and select only. Enforced by trigger rather than
-- by grants, so it holds whichever role the app connects as.
BEGIN;

CREATE OR REPLACE FUNCTION refuse_snapshot_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'snapshots are immutable: % on % is not allowed', TG_OP, TG_TABLE_NAME
    USING HINT = 'Take a new snapshot instead of changing a stored one.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forecast_snapshot_immutable
  BEFORE UPDATE OR DELETE ON forecast_snapshot
  FOR EACH ROW EXECUTE FUNCTION refuse_snapshot_change();

CREATE TRIGGER forecast_snapshot_line_immutable
  BEFORE UPDATE OR DELETE ON forecast_snapshot_line
  FOR EACH ROW EXECUTE FUNCTION refuse_snapshot_change();

COMMIT;
