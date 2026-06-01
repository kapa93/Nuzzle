import { useQuery } from '@tanstack/react-query';
import { getBlockedUserIds } from '@/api/blocking';

export function useBlockedUserIds(userId: string | null | undefined): string[] {
  const { data } = useQuery({
    queryKey: ['blockedUsers', userId],
    queryFn: () => getBlockedUserIds(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
  return data ?? [];
}
