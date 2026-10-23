-- Phase 6: immutable contract acceptance records, restricted to a booking's verified customer in application authorization.
ALTER TABLE booking_contracts ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS contract_acceptances (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 contract_id UUID NOT NULL UNIQUE REFERENCES booking_contracts(id),
 customer_account_id UUID NOT NULL REFERENCES hub_accounts(id),
 signer_name TEXT NOT NULL CHECK(char_length(signer_name) BETWEEN 2 AND 120),
 terms_sha256 CHAR(64) NOT NULL,
 accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 acceptance_kind TEXT NOT NULL DEFAULT 'electronic_acknowledgement' CHECK(acceptance_kind='electronic_acknowledgement')
);
