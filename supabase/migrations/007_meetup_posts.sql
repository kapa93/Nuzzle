-- Meetup post type and related tables
-- Run after 001_initial_schema.sql

-- Add MEETUP to post_type_enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'post_type_enum' AND e.enumlabel = 'MEETUP'
  ) THEN
    ALTER TYPE post_type_enum ADD VALUE 'MEETUP';
  END IF;
END$$;

-- Meetup-specific details (one row per meetup post)
CREATE TABLE meetup_details (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  meetup_kind TEXT,
  spots_available INT,
  host_notes TEXT,
  is_recurring_seeded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVP / join table
CREATE TABLE meetup_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meetup_post_id, user_id)
);

-- Indexes
CREATE INDEX idx_meetup_details_post ON meetup_details(post_id);
CREATE INDEX idx_meetup_rsvps_post ON meetup_rsvps(meetup_post_id);
CREATE INDEX idx_meetup_rsvps_user ON meetup_rsvps(user_id);

-- RLS for meetup_details
ALTER TABLE meetup_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetup_details_select_all" ON meetup_details FOR SELECT USING (true);
CREATE POLICY "meetup_details_insert_own_post" ON meetup_details FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()));
CREATE POLICY "meetup_details_update_own_post" ON meetup_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()));
CREATE POLICY "meetup_details_delete_own_post" ON meetup_details FOR DELETE
  USING (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()));

-- RLS for meetup_rsvps
ALTER TABLE meetup_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetup_rsvps_select_all" ON meetup_rsvps FOR SELECT USING (true);
CREATE POLICY "meetup_rsvps_insert_own" ON meetup_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meetup_rsvps_delete_own" ON meetup_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Trigger for meetup_details updated_at
CREATE TRIGGER meetup_details_updated_at
  BEFORE UPDATE ON meetup_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
