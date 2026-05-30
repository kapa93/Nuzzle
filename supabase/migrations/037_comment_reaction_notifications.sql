-- Add notification type for comment reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'COMMENT_REACTION'
  ) THEN
    ALTER TYPE notification_type_enum ADD VALUE 'COMMENT_REACTION';
  END IF;
END;
$$;

-- Notify comment author when someone reacts to their comment
CREATE OR REPLACE FUNCTION public.create_comment_reaction_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comment_author_id UUID;
  comment_post_id   UUID;
BEGIN
  SELECT author_id, post_id
    INTO comment_author_id, comment_post_id
    FROM public.comments
   WHERE id = NEW.comment_id;

  -- Comment not found or user reacted to their own comment
  IF comment_author_id IS NULL OR comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- No-op UPDATE when reaction type hasn't changed
  IF TG_OP = 'UPDATE' AND OLD.reaction_type IS NOT DISTINCT FROM NEW.reaction_type THEN
    RETURN NEW;
  END IF;

  -- Deduplicate: remove prior notification for same actor + comment
  DELETE FROM public.notifications
  WHERE user_id  = comment_author_id
    AND actor_id = NEW.user_id
    AND comment_id = NEW.comment_id
    AND type = 'COMMENT_REACTION';

  INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id)
  VALUES (comment_author_id, NEW.user_id, 'COMMENT_REACTION', comment_post_id, NEW.comment_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comment_reactions_create_notification ON public.comment_reactions;
CREATE TRIGGER comment_reactions_create_notification
AFTER INSERT OR UPDATE OF reaction_type ON public.comment_reactions
FOR EACH ROW
EXECUTE FUNCTION public.create_comment_reaction_notification();
