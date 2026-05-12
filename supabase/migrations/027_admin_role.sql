-- Add admin role to profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Replace author-only update/delete policies with admin-or-author variants
DROP POLICY "posts_update_author" ON posts;
DROP POLICY "posts_delete_author" ON posts;

CREATE POLICY "posts_update_admin_or_author" ON posts FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "posts_delete_admin_or_author" ON posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admin to manage post_images for any post
DROP POLICY "post_images_insert_own_post" ON post_images;
DROP POLICY "post_images_delete_own_post" ON post_images;

CREATE POLICY "post_images_insert_admin_or_author" ON post_images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts WHERE id = post_id AND (
      author_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    )
  ));

CREATE POLICY "post_images_delete_admin_or_author" ON post_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM posts WHERE id = post_id AND (
      author_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    )
  ));
