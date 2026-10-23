-- Phase 7: hashed one-time password reset challenges.
-- Raw recovery tokens are never stored.
CREATE TABLE IF NOT EXISTS account_password_resets (
 token_hash CHAR(64) PRIMARY KEY,
 account_id UUID NOT NULL REFERENCES hub_accounts(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 consumed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_account_password_resets_account_created ON account_password_resets(account_id,created_at DESC);
