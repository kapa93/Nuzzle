-- Prevent JWT-authenticated users from self-escalating is_admin on their own profile row.
-- Service-role connections (Supabase dashboard / server-side scripts) have no JWT,
-- so auth.uid() returns NULL for them — the trigger is a no-op in that case,
-- preserving the ability to grant/revoke admin status from the dashboard.

CREATE OR REPLACE FUNCTION prevent_is_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin
     AND auth.uid() IS NOT NULL
  THEN
    RAISE EXCEPTION 'Modifying is_admin is not permitted'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_admin_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_admin_escalation();
