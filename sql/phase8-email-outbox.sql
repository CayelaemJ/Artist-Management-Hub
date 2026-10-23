-- Phase 8: durable, idempotent, verified-customer email outbox.
ALTER TABLE hub_notifications ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;
ALTER TABLE hub_notifications ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE hub_notifications ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE hub_notifications ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE hub_notifications ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
ALTER TABLE hub_notifications ADD COLUMN IF NOT EXISTS dedupe_key TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_hub_notifications_due ON hub_notifications(state,next_attempt_at) WHERE channel='email';
