SET session_replication_role = replica;

TRUNCATE TABLE
  public.notifications,
  public.comment_reactions,
  public.post_reactions,
  public.comments,
  public.post_images,
  public.posts,
  public.meetup_rsvps,
  public.meetup_details,
  public.dog_interactions,
  public.dog_location_checkins,
  public.dog_spot_vibes,
  public.user_place_saves,
  public.place_community_interests,
  public.user_breed_joins,
  public.push_tokens,
  public.blocked_users,
  public.reports,
  public.dogs,
  public.profiles,
  public.places,
  public.dog_spot_vibe_options
CASCADE;

TRUNCATE auth.users CASCADE;

TRUNCATE storage.objects CASCADE;
