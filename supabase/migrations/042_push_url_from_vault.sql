-- Replace the push-notification trigger function so the project URL is read
-- from Vault instead of being hardcoded to the dev project.
--
-- Before running this migration, add the secret to Vault on each project:
--   SELECT vault.create_secret('<https://YOUR_PROJECT_REF.supabase.co>', 'project_url');
--
-- Dev:  https://wdyhhdaetermrtrgzorw.supabase.co
-- Prod: https://kpdvjbuwwrpmqgljoixw.supabase.co
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  service_role_key TEXT;
  project_url      TEXT;
BEGIN
  SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  SELECT decrypted_secret INTO project_url
    FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;

  IF service_role_key IS NULL OR service_role_key = ''
  OR project_url      IS NULL OR project_url      = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := project_url || '/functions/v1/send-push-notification',
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
