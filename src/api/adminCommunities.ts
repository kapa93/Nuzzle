import { supabase } from '@/lib/supabase';

export interface AdminPendingCommunity {
  id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  place_type: string;
  created_at: string;
  interest_count: number;
}

export interface AdminActiveCommunity {
  id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  place_type: string;
  member_count: number;
  posts_last_7_days: number;
  last_activity_at: string | null;
}

const READY_TO_LAUNCH_THRESHOLD = 3;

export async function fetchPendingCommunities(): Promise<AdminPendingCommunity[]> {
  const { data, error } = await supabase
    .from('places')
    .select(`
      id,
      name,
      city,
      neighborhood,
      place_type,
      created_at,
      place_community_interests (count)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((place) => {
      const interestRows = place.place_community_interests as unknown as { count: number }[];
      const interest_count =
        Array.isArray(interestRows) && interestRows.length > 0
          ? Number(interestRows[0].count)
          : 0;
      return {
        id: place.id,
        name: place.name,
        city: place.city,
        neighborhood: place.neighborhood,
        place_type: place.place_type,
        created_at: place.created_at,
        interest_count,
      };
    })
    .filter((p) => p.interest_count >= READY_TO_LAUNCH_THRESHOLD);
}

export async function fetchAllPendingCommunities(): Promise<AdminPendingCommunity[]> {
  const { data, error } = await supabase
    .from('places')
    .select(`
      id,
      name,
      city,
      neighborhood,
      place_type,
      created_at,
      place_community_interests (count)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((place) => {
    const interestRows = place.place_community_interests as unknown as { count: number }[];
    const interest_count =
      Array.isArray(interestRows) && interestRows.length > 0
        ? Number(interestRows[0].count)
        : 0;
    return {
      id: place.id,
      name: place.name,
      city: place.city,
      neighborhood: place.neighborhood,
      place_type: place.place_type,
      created_at: place.created_at,
      interest_count,
    };
  });
}

export async function fetchActiveCommunities(): Promise<AdminActiveCommunity[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('places')
    .select(`
      id,
      name,
      city,
      neighborhood,
      place_type,
      user_place_saves (count)
    `)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) throw error;

  const places = data ?? [];
  const placeIds = places.map((p) => p.id);

  if (placeIds.length === 0) return [];

  // Fetch recent posts and last activity per place
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('place_id, created_at')
    .in('place_id', placeIds)
    .gte('created_at', sevenDaysAgo);

  if (postsError) throw postsError;

  const { data: lastPostData, error: lastPostError } = await supabase
    .from('posts')
    .select('place_id, created_at')
    .in('place_id', placeIds)
    .order('created_at', { ascending: false });

  if (lastPostError) throw lastPostError;

  const recentPostCountByPlace: Record<string, number> = {};
  for (const post of postsData ?? []) {
    if (!post.place_id) continue;
    recentPostCountByPlace[post.place_id] = (recentPostCountByPlace[post.place_id] ?? 0) + 1;
  }

  const lastActivityByPlace: Record<string, string> = {};
  for (const post of lastPostData ?? []) {
    if (!post.place_id) continue;
    if (!lastActivityByPlace[post.place_id]) {
      lastActivityByPlace[post.place_id] = post.created_at;
    }
  }

  return places.map((place) => {
    const savesRows = place.user_place_saves as unknown as { count: number }[];
    const member_count =
      Array.isArray(savesRows) && savesRows.length > 0 ? Number(savesRows[0].count) : 0;

    return {
      id: place.id,
      name: place.name,
      city: place.city,
      neighborhood: place.neighborhood,
      place_type: place.place_type,
      member_count,
      posts_last_7_days: recentPostCountByPlace[place.id] ?? 0,
      last_activity_at: lastActivityByPlace[place.id] ?? null,
    };
  });
}

export async function launchCommunity(placeId: string): Promise<void> {
  const { error } = await supabase
    .from('places')
    .update({ status: 'active', is_active: true, supports_check_in: true })
    .eq('id', placeId);
  if (error) throw error;
}

export async function rejectCommunity(placeId: string): Promise<void> {
  const { error } = await supabase
    .from('places')
    .update({ status: 'rejected', is_active: false })
    .eq('id', placeId);
  if (error) throw error;
}
