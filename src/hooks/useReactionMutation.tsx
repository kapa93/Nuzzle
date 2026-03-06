import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setReaction } from '@/api/reactions';
import { useAuthStore } from '@/store/authStore';
import { ReactionPicker } from '@/components/ReactionPicker';
import { useUIStore } from '@/store/uiStore';
import type { PostWithDetails, ReactionEnum } from '@/types';

export function useReactionMutation() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { reactionPickerPost, setReactionPickerPost } = useUIStore();

  const mutation = useMutation({
    mutationFn: ({
      postId,
      reaction,
    }: {
      postId: string;
      reaction: ReactionEnum | null;
    }) => setReaction(postId, user!.id, reaction),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      setReactionPickerPost(null);
    },
  });

  const handleSelect = (reaction: ReactionEnum) => {
    if (!reactionPickerPost || !user) return;
    mutation.mutate({
      postId: reactionPickerPost.id,
      reaction: reactionPickerPost.user_reaction === reaction ? null : reaction,
    });
  };

  const picker = reactionPickerPost ? (
    <ReactionPicker
      visible={!!reactionPickerPost}
      onClose={() => setReactionPickerPost(null)}
      onSelect={handleSelect}
      currentReaction={reactionPickerPost.user_reaction}
    />
  ) : null;

  return {
    openPicker: (post: PostWithDetails) => setReactionPickerPost(post),
    picker,
  };
}
