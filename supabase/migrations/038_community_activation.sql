-- Allow system-generated notifications to have no actor (e.g. community activation).
ALTER TABLE notifications ALTER COLUMN actor_id DROP NOT NULL;

-- Store a direct place reference on notifications for community activation events.
ALTER TABLE notifications
  ADD COLUMN place_id UUID REFERENCES places(id) ON DELETE CASCADE;

-- Register the new notification type.
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'COMMUNITY_ACTIVATED';

-- ---------------------------------------------------------------------------
-- Update the push-notification trigger to forward place_id to the edge function.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  service_role_key TEXT;
BEGIN
  SELECT decrypted_secret
    INTO service_role_key
    FROM vault.decrypted_secrets
   WHERE name = 'service_role_key'
   LIMIT 1;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    -- NOTE: This URL must match the project's own edge function endpoint.
    -- Dev:  https://wdyhhdaetermrtrgzorw.supabase.co/functions/v1/send-push-notification
    -- Prod: https://kpdvjbuwwrpmqgljoixw.supabase.co/functions/v1/send-push-notification
    url     := 'https://wdyhhdaetermrtrgzorw.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body    := jsonb_build_object(
      'record', jsonb_build_object(
        'id',       NEW.id,
        'user_id',  NEW.user_id,
        'actor_id', NEW.actor_id,
        'type',     NEW.type::text,
        'post_id',  NEW.post_id,
        'place_id', NEW.place_id
      )
    )
  );

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Auto-join + notify when a pending community becomes active.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_place_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    -- Automatically save the place for every user who expressed interest.
    INSERT INTO user_place_saves (user_id, place_id)
    SELECT user_id, NEW.id
    FROM place_community_interests
    WHERE place_id = NEW.id
    ON CONFLICT (user_id, place_id) DO NOTHING;

    -- Create a notification for each interested user.
    INSERT INTO notifications (user_id, actor_id, type, place_id)
    SELECT user_id, NULL, 'COMMUNITY_ACTIVATED', NEW.id
    FROM place_community_interests
    WHERE place_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_place_status_activated
  AFTER UPDATE ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_place_activation();
