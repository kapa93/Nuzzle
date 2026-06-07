import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSavedPlaces, savePlace, unsavePlace } from '@/api/savedPlaces';
import { getActivePlaceCheckinCounts } from '@/api/places';
import { useAuthStore } from '@/store/authStore';
import { onCommunityJoined } from '@/store/notificationPromptStore';
import type { Place } from '@/types';

export function useSavedPlaces(userId: string | undefined) {
  const { data: savedPlaces = [], isLoading } = useQuery({
    queryKey: ['savedPlaces', userId],
    queryFn: () => getSavedPlaces(userId!),
    enabled: !!userId,
  });

  const savedPlaceIds = new Set(savedPlaces.map((p: Place) => p.id));

  return { savedPlaces, savedPlaceIds, isLoading };
}

export function useToggleSavedPlace() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ placeId, isSaved }: { placeId: string; isSaved: boolean }) =>
      isSaved ? unsavePlace(user!.id, placeId) : savePlace(user!.id, placeId),
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savedPlaces', user?.id] });
      if (!variables.isSaved) {
        onCommunityJoined();
      }
    },
  });
}

/**
 * Like useSavedPlaces but enriches each saved place with a `dogCount`
 * representing the number of currently active dog check-ins at that place.
 * Refreshes counts every 60 s.
 */
export function useSavedPlacesWithActivity(userId: string | undefined) {
  const { savedPlaces, isLoading: placesLoading } = useSavedPlaces(userId);
  const placeIds = savedPlaces.map((p: Place) => p.id);

  const { data: dogCounts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ['savedPlaceCheckinCounts', placeIds],
    queryFn: () => getActivePlaceCheckinCounts(placeIds),
    enabled: placeIds.length > 0,
    refetchInterval: 60_000,
  });

  return {
    savedPlaces,
    dogCounts,
    isLoading: placesLoading || (placeIds.length > 0 && countsLoading),
  };
}
