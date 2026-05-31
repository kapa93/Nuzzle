import { supabase } from '@/lib/supabase';

export interface AdminNewUsersData {
  total_users: number;
  users_this_week: number;
  recent_users: Array<{
    id: string;
    name: string;
    email: string;
    city: string | null;
    profile_image_url: string | null;
    created_at: string;
  }>;
}

export interface AdminActiveUser {
  id: string;
  name: string;
  profile_image_url: string | null;
  post_count: number;
  comment_count: number;
  last_active_at: string | null;
}

export interface AdminCommunityAtRisk {
  id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  place_type: string;
  member_count: number;
  posts_last_14_days: number;
  last_activity_at: string | null;
}

export async function fetchNewUsers(): Promise<AdminNewUsersData> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [allResult, recentResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id, name, email, city, profile_image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (allResult.error) throw allResult.error;
  if (recentResult.error) throw recentResult.error;

  const allUsers = recentResult.data ?? [];
  const users_this_week = allUsers.filter((u) => u.created_at >= oneWeekAgo).length;

  return {
    total_users: allResult.count ?? 0,
    users_this_week,
    recent_users: allUsers,
  };
}

export async function fetchMostActiveUsers(): Promise<AdminActiveUser[]> {
  const [postsResult, commentsResult] = await Promise.all([
    supabase
      .from('posts')
      .select('author_id, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('comments')
      .select('author_id, created_at')
      .order('created_at', { ascending: false }),
  ]);

  if (postsResult.error) throw postsResult.error;
  if (commentsResult.error) throw commentsResult.error;

  const postCountByUser: Record<string, number> = {};
  const lastActiveByUser: Record<string, string> = {};

  for (const post of postsResult.data ?? []) {
    postCountByUser[post.author_id] = (postCountByUser[post.author_id] ?? 0) + 1;
    if (!lastActiveByUser[post.author_id]) {
      lastActiveByUser[post.author_id] = post.created_at;
    }
  }

  const commentCountByUser: Record<string, number> = {};
  for (const comment of commentsResult.data ?? []) {
    commentCountByUser[comment.author_id] = (commentCountByUser[comment.author_id] ?? 0) + 1;
    if (!lastActiveByUser[comment.author_id] || comment.created_at > lastActiveByUser[comment.author_id]) {
      lastActiveByUser[comment.author_id] = comment.created_at;
    }
  }

  const allUserIds = Array.from(
    new Set([
      ...Object.keys(postCountByUser),
      ...Object.keys(commentCountByUser),
    ])
  );

  if (allUserIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, profile_image_url')
    .in('id', allUserIds);

  if (profilesError) throw profilesError;

  return (profiles ?? [])
    .map((profile) => ({
      id: profile.id,
      name: profile.name,
      profile_image_url: profile.profile_image_url,
      post_count: postCountByUser[profile.id] ?? 0,
      comment_count: commentCountByUser[profile.id] ?? 0,
      last_active_at: lastActiveByUser[profile.id] ?? null,
    }))
    .sort((a, b) => b.post_count + b.comment_count - (a.post_count + a.comment_count))
    .slice(0, 20);
}

export async function fetchCommunitiesAtRisk(): Promise<AdminCommunityAtRisk[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: places, error } = await supabase
    .from('places')
    .select(`
      id,
      name,
      city,
      neighborhood,
      place_type,
      user_place_saves (count)
    `)
    .eq('status', 'active');

  if (error) throw error;

  const placeIds = (places ?? []).map((p) => p.id);
  if (placeIds.length === 0) return [];

  const [recentPostsResult, lastPostResult] = await Promise.all([
    supabase
      .from('posts')
      .select('place_id, created_at')
      .in('place_id', placeIds)
      .gte('created_at', fourteenDaysAgo),
    supabase
      .from('posts')
      .select('place_id, created_at')
      .in('place_id', placeIds)
      .order('created_at', { ascending: false }),
  ]);

  if (recentPostsResult.error) throw recentPostsResult.error;
  if (lastPostResult.error) throw lastPostResult.error;

  const recentCountByPlace: Record<string, number> = {};
  for (const post of recentPostsResult.data ?? []) {
    if (!post.place_id) continue;
    recentCountByPlace[post.place_id] = (recentCountByPlace[post.place_id] ?? 0) + 1;
  }

  const lastActivityByPlace: Record<string, string> = {};
  for (const post of lastPostResult.data ?? []) {
    if (!post.place_id) continue;
    if (!lastActivityByPlace[post.place_id]) {
      lastActivityByPlace[post.place_id] = post.created_at;
    }
  }

  return (places ?? [])
    .map((place) => {
      const savesRows = place.user_place_saves as unknown as { count: number }[];
      const member_count =
        Array.isArray(savesRows) && savesRows.length > 0 ? Number(savesRows[0].count) : 0;
      const posts_last_14_days = recentCountByPlace[place.id] ?? 0;
      const last_activity_at = lastActivityByPlace[place.id] ?? null;

      return {
        id: place.id,
        name: place.name,
        city: place.city,
        neighborhood: place.neighborhood,
        place_type: place.place_type,
        member_count,
        posts_last_14_days,
        last_activity_at,
      };
    })
    .filter((p) => p.posts_last_14_days === 0 || p.posts_last_14_days <= 2)
    .sort((a, b) => a.posts_last_14_days - b.posts_last_14_days);
}
