-- Allow admins to delete any comment (currently only authors can delete)
CREATE POLICY "admin_delete_comments" ON comments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
