import { supabase } from '@/lib/supabase';
import type {
  Post,
  PostWithDetails,
  BreedEnum,
  PostTypeEnum,
  PostTagEnum,
  ReactionEnum,
  MeetupDetails,
  MeetupKind,
} from '@/types';

export type FeedSort = 'newest' | 'trending';

const INITIAL_REACTION_COUNTS: Partial<Record<ReactionEnum, number>> = {};

async function enrichPosts(rawPosts: RawPostRow[], userId: string | null): Promise<PostWithDetails[]> {
  if (rawPosts.length === 0) return [];

  const authorIds = [...new Set(rawPosts.map((p) => p.author_id))];
  const meetupPostIds = rawPosts.filter((p) => p.type === 'MEETUP').map((p) => p.id);

  const [
    profilesRes,
    dogsRes,
    commentCountsRes,
    meetupDetailsRes,
    meetupRsvpsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', authorIds),
    supabase.from('dogs').select('owner_id, name, dog_image_url').in('owner_id', authorIds).order('created_at', { ascending: true }),
    Promise.all(
      rawPosts.map((p) =>
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', p.id)
      )
    ),
    meetupPostIds.length > 0
      ? supabase.from('meetup_details').select('*').in('post_id', meetupPostIds)
      : Promise.resolve({ data: [] as MeetupDetails[] }),
    meetupPostIds.length > 0 && userId
      ? supabase.from('meetup_rsvps').select('meetup_post_id').eq('user_id', userId).in('meetup_post_id', meetupPostIds)
      : Promise.resolve({ data: [] as { meetup_post_id: string }[] }),
  ]);

  const profilesMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );
  const dogsMap = new Map<string, { owner_id: string; name: string; dog_image_url: string | null }>();
  for (const d of dogsRes.data ?? []) {
    if (!dogsMap.has(d.owner_id)) dogsMap.set(d.owner_id, d);
  }
  const meetupDetailsMap = new Map<string, MeetupDetails>();
  for (const md of meetupDetailsRes.data ?? []) {
    meetupDetailsMap.set(md.post_id, {
      ...md,
      meetup_kind: (md.meetup_kind as MeetupKind) ?? null,
    } as MeetupDetails);
  }
  const userRsvpedPostIds = new Set((meetupRsvpsRes.data ?? []).map((r: { meetup_post_id: string }) => r.meetup_post_id));

  // Batch fetch attendee counts for all meetup posts
  const attendeeCountMap = new Map<string, number>();
  if (meetupPostIds.length > 0) {
    const rsvpsRes = await supabase
      .from('meetup_rsvps')
      .select('meetup_post_id')
      .in('meetup_post_id', meetupPostIds);
    const rsvps = (rsvpsRes.data ?? []) as { meetup_post_id: string }[];
    const counts = new Map<string, number>();
    for (const r of rsvps) {
      counts.set(r.meetup_post_id, (counts.get(r.meetup_post_id) ?? 0) + 1);
    }
    for (const pid of meetupPostIds) {
      attendeeCountMap.set(pid, counts.get(pid) ?? 0);
    }
  }

  return rawPosts.map((post, idx) => {
    const profile = profilesMap.get(post.author_id);
    const dog = dogsMap.get(post.author_id);
    const commentCount = commentCountsRes[idx]?.count ?? 0;

    const reactions = (post.post_reactions ?? []) as Array<{ user_id: string; reaction_type: ReactionEnum }>;
    const reaction_counts = { ...INITIAL_REACTION_COUNTS } as Partial<Record<ReactionEnum, number>>;
    let user_reaction: ReactionEnum | null = null;

    for (const r of reactions) {
      reaction_counts[r.reaction_type] = (reaction_counts[r.reaction_type] ?? 0) + 1;
      if (userId && r.user_id === userId) {
        user_reaction = r.reaction_type;
      }
    }

    const images = ((post.post_images ?? []) as Array<{ image_url: string; sort_order: number }>)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pi) => pi.image_url);

    const meetup_details = meetupDetailsMap.get(post.id);
    const attendee_count = post.type === 'MEETUP' ? attendeeCountMap.get(post.id) ?? 0 : undefined;
    const user_rsvped = post.type === 'MEETUP' && userId ? userRsvpedPostIds.has(post.id) : undefined;

    return {
      ...post,
      author_name: profile?.name ?? 'Unknown',
      author_dog_image_url: dog?.dog_image_url ?? null,
      author_dog_name: dog?.name ?? null,
      images,
      reaction_counts,
      user_reaction,
      comment_count: typeof commentCount === 'number' ? commentCount : 0,
      meetup_details: meetup_details ?? undefined,
      attendee_count,
      user_rsvped,
    } as PostWithDetails;
  });
}

type RawPostRow = {
  id: string;
  author_id: string;
  breed: BreedEnum;
  type: PostTypeEnum;
  tag: PostTagEnum;
  title: string | null;
  content_text: string;
  created_at: string;
  updated_at: string;
  profiles?: { id: string; name: string } | null;
  post_images?: Array<{ image_url: string; sort_order: number }>;
  post_reactions?: Array<{ user_id: string; reaction_type: ReactionEnum }>;
};

export async function getFeed(
  breed: BreedEnum,
  sort: FeedSort = 'newest',
  limit = 20,
  offset = 0,
  userId: string | null = null,
  typeFilter: PostTypeEnum | null = null
): Promise<PostWithDetails[]> {
  let query = supabase
    .from('posts')
    .select(
      `
      *,
      profiles:author_id (id, name),
      post_images (image_url, sort_order),
      post_reactions (user_id, reaction_type)
    `
    )
    .eq('breed', breed)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (typeFilter) {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rawPosts = (data ?? []) as RawPostRow[];

  const enriched = await enrichPosts(rawPosts, userId);

  if (sort === 'trending') {
    enriched.sort((a, b) => {
      const activityA = Object.values(a.reaction_counts).reduce((s, c) => s + (c ?? 0), 0) + a.comment_count;
      const activityB = Object.values(b.reaction_counts).reduce((s, c) => s + (c ?? 0), 0) + b.comment_count;
      if (activityB !== activityA) return activityB - activityA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return enriched;
}

export async function getPostById(
  postId: string,
  userId: string | null = null
): Promise<PostWithDetails | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      profiles:author_id (id, name),
      post_images (image_url, sort_order),
      post_reactions (user_id, reaction_type)
    `
    )
    .eq('id', postId)
    .single();

  if (error || !data) return null;

  const enriched = await enrichPosts([data as RawPostRow], userId);
  return enriched[0] ?? null;
}

export type CreateMeetupDetails = {
  location_name: string;
  start_time: string; // ISO datetime string
  end_time?: string | null;
  meetup_kind?: string | null;
  spots_available?: number | null;
  host_notes?: string | null;
  is_recurring_seeded?: boolean;
};

export async function createPost(
  authorId: string,
  post: {
    breed: BreedEnum;
    type: PostTypeEnum;
    tag: PostTagEnum;
    content_text: string;
    title?: string | null;
    meetup_details?: CreateMeetupDetails;
  },
  imageUrls: string[] = []
) {
  const { meetup_details, ...postData } = post;
  const { data: insertedPost, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      ...postData,
    })
    .select()
    .single();

  if (postError) throw postError;
  const newPost = insertedPost as Post;

  if (post.type === 'MEETUP' && meetup_details) {
    const { error: mdError } = await supabase.from('meetup_details').insert({
      post_id: newPost.id,
      location_name: meetup_details.location_name,
      start_time: meetup_details.start_time,
      end_time: meetup_details.end_time ?? null,
      meetup_kind: meetup_details.meetup_kind ?? null,
      spots_available: meetup_details.spots_available ?? null,
      host_notes: meetup_details.host_notes ?? null,
      is_recurring_seeded: meetup_details.is_recurring_seeded ?? false,
    });
    if (mdError) throw mdError;
  }

  if (imageUrls.length > 0) {
    const inserts = imageUrls.map((url, i) => ({
      post_id: newPost.id,
      image_url: url,
      sort_order: i,
    }));
    await supabase.from('post_images').insert(inserts);
  }

  return newPost;
}

export async function updatePost(
  postId: string,
  authorId: string,
  updates: Partial<Pick<Post, 'content_text' | 'title' | 'type' | 'tag'>>
) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .eq('author_id', authorId)
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(postId: string, authorId: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', authorId);

  if (error) throw error;
}

export async function searchPosts(
  params: {
    query?: string;
    breed?: BreedEnum;
    tag?: PostTagEnum;
    type?: PostTypeEnum;
    limit?: number;
  },
  userId: string | null = null
): Promise<PostWithDetails[]> {
  const { query: searchQuery, breed, tag, type, limit = 20 } = params;

  let q = supabase
    .from('posts')
    .select(
      `
      *,
      profiles:author_id (id, name),
      post_images (image_url, sort_order),
      post_reactions (user_id, reaction_type)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (searchQuery?.trim()) {
    q = q.or(
      `content_text.ilike.%${searchQuery.trim()}%,title.ilike.%${searchQuery.trim()}%`
    );
  }
  if (breed) q = q.eq('breed', breed);
  if (tag) q = q.eq('tag', tag);
  if (type) q = q.eq('type', type);

  const { data, error } = await q;
  if (error) throw error;

  const rawPosts = (data ?? []) as RawPostRow[];
  return enrichPosts(rawPosts, userId);
}
