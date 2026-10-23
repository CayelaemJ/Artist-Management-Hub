-- Yoco Sandbox Integration. Payment card data stays on Yoco.
-- Checkout records cannot mark an invoice paid from a browser redirect.
CREATE TABLE IF NOT EXISTS yoco_checkouts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 invoice_id UUID NOT NULL REFERENCES booking_invoices(id),
 checkout_ref TEXT NOT NULL UNIQUE,
 amount_cents BIGINT NOT NULL CHECK(amount_cents>0),
 mode TEXT NOT NULL CHECK(mode IN ('test','live')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','test_succeeded','paid','failed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
