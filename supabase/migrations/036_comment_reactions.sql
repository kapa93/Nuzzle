-- Comment reactions (one per user per comment, reuses existing reaction_enum)
CREATE TABLE comment_reactions (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type reaction_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_reactions_select_all" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "comment_reactions_insert_auth" ON comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_reactions_update_auth" ON comment_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comment_reactions_delete_auth" ON comment_reactions FOR DELETE USING (auth.uid() = user_id);
