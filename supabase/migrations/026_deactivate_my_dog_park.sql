-- Deactivate stray/test place so it no longer appears in Explore "On Nuzzle",
-- Places, and other flows that use listActivePlaces (is_active = true).

UPDATE places
SET
  is_active = false,
  updated_at = NOW()
WHERE lower(trim(name)) = 'my dog park';
