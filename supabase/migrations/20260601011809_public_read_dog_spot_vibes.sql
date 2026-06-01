-- Allow unauthenticated (guest) users to read dog spot vibes so the Dog Friendly
-- screen shows vibe chips without requiring a Supabase auth session.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dog_spot_vibe_options'
      AND policyname = 'Public read dog_spot_vibe_options'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read dog_spot_vibe_options" ON public.dog_spot_vibe_options FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dog_spot_vibes'
      AND policyname = 'Public read dog_spot_vibes'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read dog_spot_vibes" ON public.dog_spot_vibes FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;
