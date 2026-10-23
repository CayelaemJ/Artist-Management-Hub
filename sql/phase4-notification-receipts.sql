-- Add read receipts to account-scoped in-app booking messages.
ALTER TABLE hub_notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
