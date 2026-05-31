-- Add 'rejected' to places status so admins can reject pending communities
ALTER TABLE places
  DROP CONSTRAINT IF EXISTS places_status_check;

ALTER TABLE places
  ADD CONSTRAINT places_status_check
    CHECK (status IN ('active', 'pending', 'rejected'));

-- Allow admins to update places (to launch or reject pending communities)
CREATE POLICY "admin_update_places" ON places
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
