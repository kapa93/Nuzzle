-- Update trigger_push_notification() to include the webhook secret as an
-- X-Webhook-Secret header so the edge function can verify the caller.
-- The secret must be stored in Vault as 'push_webhook_secret' on each project.
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  service_role_key TEXT;
  project_url      TEXT;
  webhook_secret   TEXT;
BEGIN
  SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  SELECT decrypted_secret INTO project_url
    FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;

  SELECT decrypted_secret INTO webhook_secret
    FROM vault.decrypted_secrets WHERE name = 'push_webhook_secret' LIMIT 1;

  IF service_role_key IS NULL OR service_role_key = ''
  OR project_url      IS NULL OR project_url      = ''
  OR webhook_secret   IS NULL OR webhook_secret   = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'Authorization',    'Bearer ' || service_role_key,
      'X-Webhook-Secret', webhook_secret
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
