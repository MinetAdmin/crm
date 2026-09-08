-- Auth columns for invite-only Entra SSO (doc 03 §2.1 / doc 06 §0).
-- azure_oid: linked on first successful SSO login; unique — one Microsoft
-- identity maps to at most one user. last_login_at: observability only.
BEGIN;

ALTER TABLE app_user
  ADD COLUMN azure_oid     text UNIQUE,
  ADD COLUMN last_login_at timestamptz;

COMMIT;
