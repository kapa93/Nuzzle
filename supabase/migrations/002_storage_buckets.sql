-- Nuzzle - Storage buckets
-- Run in Supabase SQL Editor or use Supabase Dashboard > Storage to create buckets

-- Create dog-images bucket (public for profile avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-images',
  'dog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create post-images bucket (public for post images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage: allow authenticated uploads to own paths
CREATE POLICY "Users can upload dog images to own path"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload post images to own path"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for both buckets (public buckets already allow this)
CREATE POLICY "Public read dog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dog-images');

CREATE POLICY "Public read post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');
