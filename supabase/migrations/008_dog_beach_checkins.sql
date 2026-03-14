-- Dog beach check-ins for lightweight local presence utility

CREATE TABLE dog_location_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  location_key TEXT NOT NULL,
  location_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_dog_location_checkins_location_active
  ON dog_location_checkins(location_key, created_at DESC)
  WHERE ended_at IS NULL;

CREATE INDEX idx_dog_location_checkins_expires_at
  ON dog_location_checkins(expires_at);

CREATE INDEX idx_dog_location_checkins_user_location_active
  ON dog_location_checkins(user_id, location_key)
  WHERE ended_at IS NULL;

CREATE UNIQUE INDEX uq_dog_location_checkins_user_location_active
  ON dog_location_checkins(user_id, location_key)
  WHERE ended_at IS NULL;

CREATE UNIQUE INDEX uq_dog_location_checkins_dog_location_active
  ON dog_location_checkins(dog_id, location_key)
  WHERE ended_at IS NULL;

ALTER TABLE dog_location_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dog_location_checkins_select_auth"
  ON dog_location_checkins FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "dog_location_checkins_insert_own"
  ON dog_location_checkins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM dogs d
      WHERE d.id = dog_id
        AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "dog_location_checkins_update_own"
  ON dog_location_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dog_location_checkins_delete_own"
  ON dog_location_checkins FOR DELETE
  USING (auth.uid() = user_id);
