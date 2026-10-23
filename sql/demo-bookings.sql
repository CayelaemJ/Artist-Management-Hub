-- Fictional booking workflow is isolated from live booking_enquiries.
CREATE TABLE IF NOT EXISTS demo_booking_enquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 artist_id bigint NOT NULL REFERENCES artists(id),
 customer_email text NOT NULL,
 contact_name text NOT NULL,
 event_type text NOT NULL,
 event_date date NOT NULL,
 venue text NOT NULL,
 budget_zar numeric(12,2),
 message text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'enquiry',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_booking_created ON demo_booking_enquiries(created_at DESC);
