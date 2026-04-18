import { supabase } from '@/lib/supabase';
import type { CommentWithAuthor } from '@/types';

export async function getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      profiles:author_id (id, name)
    `
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const comments = (data ?? []) as Array<{
    id: string;
    post_id: string;
    author_id: string;
    content_text: string;
    created_at: string;
    profiles: { id: string; name: string } | null;
  }>;

  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const dogMap = new Map<string, { name: string; dog_image_url: string | null }>();

  if (authorIds.length > 0) {
    const { data: dogsData } = await supabase
      .from('dogs')
      .select('owner_id, name, dog_image_url')
      .in('owner_id', authorIds)
      .order('created_at', { ascending: true });

    for (const dog of dogsData ?? []) {
      if (!dogMap.has(dog.owner_id)) {
        dogMap.set(dog.owner_id, { name: dog.name, dog_image_url: dog.dog_image_url });
      }
    }
  }

  return comments.map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    const dog = dogMap.get(c.author_id);
    return {
      id: c.id,
      post_id: c.post_id,
      author_id: c.author_id,
      content_text: c.content_text,
      created_at: c.created_at,
      author_name: profile?.name ?? 'Unknown',
      author_dog_image_url: dog?.dog_image_url ?? null,
      author_dog_name: dog?.name ?? null,
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

export async function createCommentWithNotification(
  postId: string,
  authorId: string,
  contentText: string,
  _postAuthorId: string
) {
  return createComment(postId, authorId, contentText);
}
