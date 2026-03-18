import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDogInteractions } from '@/api/dogInteractions';

export function useDogInteractionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDogInteractions,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dogsMet'] });
      queryClient.invalidateQueries({ queryKey: ['recentDogMeetings'] });
      variables.dogIds.forEach((dogId) => {
        queryClient.invalidateQueries({ queryKey: ['dog', dogId] });
      });
      queryClient.invalidateQueries({ queryKey: ['dog', variables.metDogId] });
    },
  });
}
