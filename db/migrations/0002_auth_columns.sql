-- Auth columns for Entra SSO: azure_oid (unique) and last_login_at.
BEGIN;

ALTER TABLE app_user
  ADD COLUMN azure_oid     text UNIQUE,
  ADD COLUMN last_login_at timestamptz;

COMMIT;
