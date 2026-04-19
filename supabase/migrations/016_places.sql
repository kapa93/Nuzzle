-- Generalized Places system
-- Creates a canonical places table for dog-friendly locations,
-- then links dog_location_checkins to places via place_id FK.

-- ─── places table ────────────────────────────────────────────────────────────

CREATE TABLE places (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT          NOT NULL,
  slug                    TEXT          UNIQUE NOT NULL,
  place_type              TEXT          NOT NULL
                            CHECK (place_type IN ('dog_beach', 'dog_park', 'trail', 'park', 'other')),
  city                    TEXT,
  neighborhood            TEXT,
  latitude                DOUBLE PRECISION,
  longitude               DOUBLE PRECISION,
  check_in_radius_meters  INTEGER       NOT NULL DEFAULT 400,
  check_in_duration_minutes INTEGER     NOT NULL DEFAULT 60,
  description             TEXT,
  is_active               BOOLEAN       NOT NULL DEFAULT true,
  supports_check_in       BOOLEAN       NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_places_slug ON places(slug);
CREATE INDEX idx_places_active ON places(is_active) WHERE is_active = true;

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read places; only service role can write.
CREATE POLICY "places_select_auth"
  ON places FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Seed: Ocean Beach Dog Beach ─────────────────────────────────────────────

INSERT INTO places (
  name, slug, place_type,
  city, neighborhood,
  latitude, longitude,
  check_in_radius_meters, check_in_duration_minutes,
  supports_check_in, is_active
) VALUES (
  'Ocean Beach Dog Beach', 'ocean-beach-dog-beach', 'dog_beach',
  'San Francisco', 'Ocean Beach',
  37.7597, -122.5108,
  400, 60,
  true, true
);

-- ─── Link dog_location_checkins to places ────────────────────────────────────

ALTER TABLE dog_location_checkins
  ADD COLUMN place_id UUID REFERENCES places(id) ON DELETE SET NULL;

-- Backfill existing OB check-ins
UPDATE dog_location_checkins
SET place_id = (SELECT id FROM places WHERE slug = 'ocean-beach-dog-beach')
WHERE location_key = 'ob_dog_beach';

CREATE INDEX idx_dog_location_checkins_place_active
  ON dog_location_checkins(place_id)
  WHERE ended_at IS NULL;
