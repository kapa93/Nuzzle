-- Nuzzle v1 - Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE breed_enum AS ENUM (
  'AUSTRALIAN_SHEPHERD',
  'HUSKY',
  'GOLDEN_RETRIEVER',
  'FRENCH_BULLDOG',
  'PIT_BULL',
  'LABRADOR_RETRIEVER'
);

CREATE TYPE post_type_enum AS ENUM (
  'QUESTION',
  'UPDATE_STORY',
  'TIP'
);

CREATE TYPE post_tag_enum AS ENUM (
  'TRAINING',
  'BEHAVIOR',
  'HEALTH',
  'GROOMING',
  'FOOD',
  'GEAR',
  'PUPPY',
  'ADOLESCENT',
  'ADULT',
  'SENIOR',
  'PLAYDATE'
);

CREATE TYPE age_group_enum AS ENUM (
  'PUPPY',
  'ADOLESCENT',
  'ADULT',
  'SENIOR'
);

CREATE TYPE energy_level_enum AS ENUM (
  'LOW',
  'MED',
  'HIGH'
);

CREATE TYPE reaction_enum AS ENUM (
  'LIKE',
  'LOVE',
  'HAHA',
  'WOW',
  'SAD',
  'ANGRY'
);

CREATE TYPE notification_type_enum AS ENUM (
  'COMMENT',
  'REACTION'
);

CREATE TYPE report_type_enum AS ENUM (
  'POST',
  'COMMENT'
);

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dogs (one per user for v1)
CREATE TABLE dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed breed_enum NOT NULL,
  age_group age_group_enum NOT NULL,
  energy_level energy_level_enum NOT NULL,
  dog_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  breed breed_enum NOT NULL,
  type post_type_enum NOT NULL,
  tag post_tag_enum NOT NULL,
  content_text TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post images (multiple per post) - stores full public URL from Storage
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post reactions (one per user per post)
CREATE TABLE post_reactions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type reaction_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Reports (insert-only for regular users)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reportable_type report_type_enum NOT NULL,
  reportable_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_posts_breed_created_at ON posts(breed, created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_tag ON posts(tag);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC);
CREATE INDEX idx_post_images_post_sort ON post_images(post_id, sort_order);
CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: select all; insert/update only own
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Dogs: select all; insert/update/delete only where owner_id = auth.uid()
CREATE POLICY "dogs_select_all" ON dogs FOR SELECT USING (true);
CREATE POLICY "dogs_insert_own" ON dogs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "dogs_update_own" ON dogs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "dogs_delete_own" ON dogs FOR DELETE USING (auth.uid() = owner_id);

-- Posts: select all; insert authenticated; update/delete only author
CREATE POLICY "posts_select_all" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_auth" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_author" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_author" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Post images: select all; insert/delete only if post belongs to auth.uid()
CREATE POLICY "post_images_select_all" ON post_images FOR SELECT USING (true);
CREATE POLICY "post_images_insert_own_post" ON post_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()));
CREATE POLICY "post_images_delete_own_post" ON post_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()));

-- Comments: select all; insert authenticated; update/delete only author
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_author" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "comments_delete_author" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Post reactions: select all; insert/update/delete only own
CREATE POLICY "post_reactions_select_all" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "post_reactions_insert_own" ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_reactions_update_own" ON post_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "post_reactions_delete_own" ON post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Notifications: select only where user_id = auth.uid(); update only own (mark read)
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reports: insert only authenticated; restrict select for non-admin
CREATE POLICY "reports_insert_auth" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_none" ON reports FOR SELECT USING (false);

-- ============================================
-- TRIGGERS / FUNCTIONS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on posts
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER dogs_updated_at
  BEFORE UPDATE ON dogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER post_reactions_updated_at
  BEFORE UPDATE ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
