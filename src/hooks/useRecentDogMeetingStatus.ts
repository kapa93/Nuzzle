import { useQuery } from '@tanstack/react-query';
import { getRecentlyMetDogIds } from '@/api/dogInteractions';

export function useRecentDogMeetingStatus({
  dogIds,
  targetDogId,
}: {
  dogIds: string[];
  targetDogId?: string | null;
}) {
  const normalizedDogIds = Array.from(new Set(dogIds)).sort();

  return useQuery({
    queryKey: ['recentDogMeetings', targetDogId ?? null, normalizedDogIds],
    queryFn: () =>
      getRecentlyMetDogIds({
        dogIds: normalizedDogIds,
        targetDogId: targetDogId!,
      }),
    enabled: normalizedDogIds.length > 0 && !!targetDogId,
  });
}
