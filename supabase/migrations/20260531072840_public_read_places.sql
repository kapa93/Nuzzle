-- Allow unauthenticated (guest) users to read places and community interests.
-- places data is non-sensitive public information; read access is intentionally open.

DROP POLICY IF EXISTS places_select_auth ON places;
DROP POLICY IF EXISTS places_select_public ON places;
CREATE POLICY places_select_public ON places FOR SELECT USING (true);

DROP POLICY IF EXISTS place_community_interests_select_public ON place_community_interests;
CREATE POLICY place_community_interests_select_public ON place_community_interests FOR SELECT USING (true);
