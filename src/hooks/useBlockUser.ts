import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockUser, unblockUser, isUserBlocked } from '@/api/blocking';

export function useBlockUser(viewerUserId: string | null | undefined, targetUserId: string) {
  const queryClient = useQueryClient();
  const enabled = !!viewerUserId && viewerUserId !== targetUserId;

  const { data: isBlocked = false, isLoading: isCheckingBlock } = useQuery({
    queryKey: ['blockStatus', viewerUserId, targetUserId],
    queryFn: () => isUserBlocked(viewerUserId!, targetUserId),
    enabled,
  });

  function invalidateBlockCaches() {
    queryClient.invalidateQueries({ queryKey: ['blockedUsers', viewerUserId] });
    queryClient.invalidateQueries({ queryKey: ['blockStatus', viewerUserId, targetUserId] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['comments'] });
  }

  const blockMutation = useMutation({
    mutationFn: () => blockUser(viewerUserId!, targetUserId),
    onSuccess: invalidateBlockCaches,
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockUser(viewerUserId!, targetUserId),
    onSuccess: invalidateBlockCaches,
  });

  function confirmBlock() {
    Alert.alert(
      'Block this member?',
      'Their posts and comments will be hidden from your feeds. You can unblock them from their profile at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => blockMutation.mutate(),
        },
      ]
    );
  }

  function confirmUnblock() {
    Alert.alert(
      'Unblock this member?',
      'Their posts and comments will become visible again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => unblockMutation.mutate(),
        },
      ]
    );
  }

  const isPending = blockMutation.isPending || unblockMutation.isPending;

  return {
    isBlocked,
    isCheckingBlock,
    isPending,
    confirmBlock,
    confirmUnblock,
    enabled,
  };
}
