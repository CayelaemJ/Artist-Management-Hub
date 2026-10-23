-- CABO Artist Hub: fictional demo roster and isolated production enquiries.
-- Idempotent schema/bootstrap for initial environments.
CREATE TABLE IF NOT EXISTS artists (
 id BIGSERIAL PRIMARY KEY, slug TEXT NOT NULL UNIQUE, stage_name TEXT NOT NULL,
 genre TEXT NOT NULL, city TEXT NOT NULL, tagline TEXT NOT NULL, bio TEXT NOT NULL,
 starting_fee_zar INTEGER NOT NULL CHECK(starting_fee_zar>=0), art_theme TEXT NOT NULL,
 pr_factors JSONB NOT NULL, health_factors JSONB NOT NULL,
 synthetic BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gigs (
 id BIGSERIAL PRIMARY KEY, artist_id BIGINT NOT NULL REFERENCES artists(id),
 event_date DATE NOT NULL, event_name TEXT NOT NULL,
 fee_zar INTEGER NOT NULL CHECK(fee_zar>=0), expense_zar INTEGER NOT NULL CHECK(expense_zar>=0),
 status TEXT NOT NULL CHECK(status IN ('completed','confirmed','proposed')),
 synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS social_mentions (
 id BIGSERIAL PRIMARY KEY, artist_id BIGINT NOT NULL REFERENCES artists(id),
 platform TEXT NOT NULL, topic TEXT NOT NULL, sentiment TEXT NOT NULL
 CHECK(sentiment IN ('positive','neutral','mixed','negative')),
 occurred_on DATE NOT NULL, synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS booking_enquiries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), artist_id BIGINT NOT NULL REFERENCES artists(id),
 contact_name VARCHAR(120) NOT NULL, contact_email VARCHAR(254) NOT NULL,
 event_type VARCHAR(100) NOT NULL, event_date DATE NOT NULL, start_time TIME,
 end_time TIME, venue VARCHAR(180) NOT NULL, budget_zar NUMERIC(12,2),
 message VARCHAR(1000) NOT NULL DEFAULT '',
 status VARCHAR(32) NOT NULL DEFAULT 'enquiry'
 CHECK(status IN ('enquiry','availability_check','negotiation','quoted','contracted','deposit_pending','confirmed','completed','declined','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 synthetic BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS booking_audit (
 id BIGSERIAL PRIMARY KEY, enquiry_id UUID NOT NULL REFERENCES booking_enquiries(id),
 from_status TEXT, to_status TEXT NOT NULL, changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 changed_by TEXT NOT NULL DEFAULT 'demo_admin'
);

CREATE INDEX IF NOT EXISTS booking_enquiries_artist_date_idx ON booking_enquiries (artist_id,event_date,status);

CREATE INDEX IF NOT EXISTS gigs_artist_date_idx ON gigs (artist_id,event_date);

INSERT INTO artists(slug,stage_name,genre,city,tagline,bio,starting_fee_zar,art_theme,pr_factors,health_factors) VALUES
('echo-dune','Echo Dune','Amapiano / DJ','Johannesburg','The next pulse of the city.','An emerging selector blending warm keys, deep log drums and late-night township energy.','6500','clay','[73,80,86,76,70,78,82]','[72,81,79,91,75]'),
('auri-sol','Auri Sol','Afro-pop / Live','Cape Town','Soul in full colour.','A vibrant live storyteller with infectious harmonies and a growing touring audience.','28000','gold','[84,88,92,80,86,82,90]','[65,88,80,81,69]'),
('kinetic-moko','Kinetic Moko','Hip-hop / Rap','Pretoria','Made of motion.','An independent lyricist finding a fearless voice through community performances.','10000','teal','[67,83,77,70,73,84,70]','[61,76,80,92,78]'),
('velvet-umoya','Velvet Umoya','R&B / Soul','Durban','Soft edges. Powerful stories.','An intimate vocalist turning small venues into unforgettable live experiences.','14000','rust','[88,90,89,84,78,91,86]','[76,78,86,83,82]'),
('moya-chorus','Moya Chorus','Gospel / Vocal','Gqeberha','A sound that lifts.','A spirited ensemble combining traditional harmonies with contemporary arrangements.','22000','clay','[91,85,94,87,83,91,94]','[81,85,74,78,86]'),
('milo-static','Milo Static','Comedy / Stand-up','Johannesburg','A new kind of punchline.','An observational comic with an energetic stage presence and a fresh touring perspective.','12000','teal','[79,74,86,75,78,80,76]','[68,90,84,81,64]'),
('copper-atlas','Copper Atlas','Jazz / Ensemble','Stellenbosch','Improvisation without borders.','An experimental live quartet weaving African jazz textures and modern improvisation.','24000','gold','[88,92,94,91,84,85,92]','[85,76,71,94,80]'),
('night-current','Night Current','Electronic / Producer','Soweto','Future sound, grounded roots.','A producer and DJ developing cross-border collaborations and immersive live sets.','18000','rust','[81,85,88,79,79,87,80]','[74,83,87,89,70]')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO gigs(artist_id,event_date,event_name,fee_zar,expense_zar,status)
SELECT a.id,v.event_date::date,v.event_name,v.fee,v.expense,v.status
FROM (VALUES
('echo-dune','2026-09-03','City Sessions',5850,2405,'completed'),
('echo-dune','2026-11-04','Nights in Sound',6500,1950,'confirmed'),
('auri-sol','2026-09-04','Evening Stage',25200,10360,'completed'),
('auri-sol','2026-11-05','Art Walk Festival',28000,8400,'confirmed'),
('kinetic-moko','2026-09-05','Creative Live',9000,3700,'completed'),
('kinetic-moko','2026-11-06','Private Showcase',10000,3000,'confirmed'),
('velvet-umoya','2026-09-06','Cultural Nights',12600,5180,'completed'),
('velvet-umoya','2026-11-07','Weekend Live',14000,4200,'confirmed'),
('moya-chorus','2026-09-07','City Sessions',19800,8140,'completed'),
('moya-chorus','2026-11-08','Nights in Sound',22000,6600,'confirmed'),
('milo-static','2026-09-08','Evening Stage',10800,4440,'completed'),
('milo-static','2026-11-09','Art Walk Festival',12000,3600,'confirmed'),
('copper-atlas','2026-09-09','Creative Live',21600,8880,'completed'),
('copper-atlas','2026-11-10','Private Showcase',24000,7200,'confirmed'),
('night-current','2026-09-10','Cultural Nights',16200,6660,'completed'),
('night-current','2026-11-11','Weekend Live',18000,5400,'confirmed')
) AS v(slug,event_date,event_name,fee,expense,status)
JOIN artists a ON a.slug=v.slug
WHERE NOT EXISTS (SELECT 1 FROM gigs WHERE synthetic=TRUE);

INSERT INTO social_mentions(artist_id,platform,topic,sentiment,occurred_on)
SELECT a.id,v.platform,v.topic,v.sentiment,'2026-10-18'::date
FROM (VALUES ('echo-dune','YouTube','Performance highlight','positive'),('auri-sol','Instagram','Fans sharing new release','mixed'),('kinetic-moko','TikTok','Upcoming collaboration','neutral'),('velvet-umoya','Press','Recent gig review','positive'),('moya-chorus','YouTube','Performance highlight','positive'),('milo-static','Instagram','Fans sharing new release','mixed'),('copper-atlas','TikTok','Upcoming collaboration','neutral'),('night-current','Press','Recent gig review','positive'))
AS v(slug,platform,topic,sentiment)
JOIN artists a ON a.slug=v.slug
WHERE NOT EXISTS (SELECT 1 FROM social_mentions WHERE synthetic=TRUE);
