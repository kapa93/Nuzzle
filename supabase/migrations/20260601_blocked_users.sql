CREATE TABLE blocked_users (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_users_select_own" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "blocked_users_insert_own" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocked_users_delete_own" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);
