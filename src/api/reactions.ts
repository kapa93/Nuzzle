import { supabase } from '@/lib/supabase';
import type { ReactionEnum } from '@/types';

export async function setReaction(postId: string, userId: string, reaction: ReactionEnum | null) {
  if (reaction === null) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from('post_reactions')
    .upsert(
      {
        post_id: postId,
        user_id: userId,
        reaction_type: reaction,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'post_id,user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReactionsByPost(postId: string) {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId);

  if (error) throw error;
  return data ?? [];
}

export async function getMyReaction(postId: string, userId: string) {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.reaction_type ?? null;
}
