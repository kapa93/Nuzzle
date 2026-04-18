import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setReaction } from '@/api/reactions';
import type { ReactionEnum } from '@/types';

export function useReactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      reaction,
    }: {
      postId: string;
      userId: string;
      reaction: ReactionEnum | null;
    }) => setReaction(postId, userId, reaction),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
}
