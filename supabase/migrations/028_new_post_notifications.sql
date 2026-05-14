-- Notify feed members when a new post is created in a breed or place feed they follow.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'NEW_BREED_POST'
  ) THEN
    ALTER TYPE notification_type_enum ADD VALUE 'NEW_BREED_POST';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'NEW_PLACE_POST'
  ) THEN
    ALTER TYPE notification_type_enum ADD VALUE 'NEW_PLACE_POST';
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.create_new_post_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower RECORD;
BEGIN
  -- Notify users who have joined the breed feed
  IF NEW.breed IS NOT NULL THEN
    FOR follower IN
      SELECT user_id
      FROM public.user_breed_joins
      WHERE breed = NEW.breed
        AND user_id <> NEW.author_id
    LOOP
      INSERT INTO public.notifications (user_id, actor_id, type, post_id)
      VALUES (follower.user_id, NEW.author_id, 'NEW_BREED_POST', NEW.id);
    END LOOP;
  END IF;

  -- Notify users who have saved the place
  IF NEW.place_id IS NOT NULL THEN
    FOR follower IN
      SELECT user_id
      FROM public.user_place_saves
      WHERE place_id = NEW.place_id
        AND user_id <> NEW.author_id
    LOOP
      INSERT INTO public.notifications (user_id, actor_id, type, post_id)
      VALUES (follower.user_id, NEW.author_id, 'NEW_PLACE_POST', NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_create_new_post_notification ON public.posts;
CREATE TRIGGER posts_create_new_post_notification
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.create_new_post_notification();
