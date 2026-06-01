import { supabase } from '@/lib/supabase';
import type { CommentWithAuthor, ReactionEnum } from '@/types';

export async function getCommentsByPost(
  postId: string,
  userId?: string | null,
  blockedIds: string[] = []
): Promise<CommentWithAuthor[]> {
  let query = supabase
    .from('comments')
    .select(
      `
      *,
      profiles:author_id (id, name)
    `
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (blockedIds.length > 0) {
    query = query.not('author_id', 'in', `(${blockedIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error) throw error;

  const comments = (data ?? []) as Array<{
    id: string;
    post_id: string;
    author_id: string;
    content_text: string;
    created_at: string;
    profiles: { id: string; name: string } | null;
  }>;

  const commentIds = comments.map((c) => c.id);
  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const dogMap = new Map<string, { name: string; dog_image_url: string | null }>();

  const [dogsResult, reactionsResult] = await Promise.all([
    authorIds.length > 0
      ? supabase
          .from('dogs')
          .select('owner_id, name, dog_image_url')
          .in('owner_id', authorIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    commentIds.length > 0
      ? supabase
          .from('comment_reactions')
          .select('comment_id, user_id, reaction_type')
          .in('comment_id', commentIds)
      : Promise.resolve({ data: [] }),
  ]);

  for (const dog of (dogsResult.data ?? []) as Array<{ owner_id: string; name: string; dog_image_url: string | null }>) {
    if (!dogMap.has(dog.owner_id)) {
      dogMap.set(dog.owner_id, { name: dog.name, dog_image_url: dog.dog_image_url });
    }
  }

  type ReactionRow = { comment_id: string; user_id: string; reaction_type: ReactionEnum };
  const reactionRows = (reactionsResult.data ?? []) as ReactionRow[];
  const reactionMap = new Map<string, { counts: Partial<Record<ReactionEnum, number>>; userReaction: ReactionEnum | null }>();

  for (const r of reactionRows) {
    if (!reactionMap.has(r.comment_id)) {
      reactionMap.set(r.comment_id, { counts: {}, userReaction: null });
    }
    const entry = reactionMap.get(r.comment_id)!;
    entry.counts[r.reaction_type] = (entry.counts[r.reaction_type] ?? 0) + 1;
    if (userId && r.user_id === userId) {
      entry.userReaction = r.reaction_type;
    }
  }

  return comments.map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    const dog = dogMap.get(c.author_id);
    const reactions = reactionMap.get(c.id) ?? { counts: {}, userReaction: null };
    return {
      id: c.id,
      post_id: c.post_id,
      author_id: c.author_id,
      content_text: c.content_text,
      created_at: c.created_at,
      author_name: profile?.name ?? 'Unknown',
      author_dog_image_url: dog?.dog_image_url ?? null,
      author_dog_name: dog?.name ?? null,
      reaction_counts: reactions.counts,
      user_reaction: reactions.userReaction,
    } as CommentWithAuthor;
  });
}

export async function createComment(
  postId: string,
  authorId: string,
  contentText: string
) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      content_text: contentText,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setCommentReaction(commentId: string, userId: string, reaction: ReactionEnum | null) {
  if (reaction === null) {
    const { error } = await supabase
      .from('comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from('comment_reactions')
    .upsert(
      {
        comment_id: commentId,
        user_id: userId,
        reaction_type: reaction,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'comment_id,user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

export async function createCommentWithNotification(
  postId: string,
  authorId: string,
  contentText: string,
  _postAuthorId: string
) {
  return createComment(postId, authorId, contentText);
}
