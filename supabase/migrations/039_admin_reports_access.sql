-- Add status to reports for moderation workflow
ALTER TABLE reports
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed'));

-- Prevent duplicate reports from the same user on the same content
ALTER TABLE reports
  ADD CONSTRAINT unique_report_per_user
    UNIQUE (reporter_id, reportable_id, reportable_type);

-- Admin can read all reports
CREATE POLICY "admin_select_reports" ON reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can update report status (reviewed / dismissed)
CREATE POLICY "admin_update_reports" ON reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can delete reports
CREATE POLICY "admin_delete_reports" ON reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
