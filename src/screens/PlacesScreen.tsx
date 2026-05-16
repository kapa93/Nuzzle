import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getGooglePlacePhotoUrl, listActivePlaces } from '@/api/places';
import { PlaceRow } from '@/components/PlaceRow';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { useSavedPlaces, useToggleSavedPlace } from '@/hooks/useSavedPlaces';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme';
import { getPlaceHeroImage } from '@/utils/placeHeroImage';
import type { Place } from '@/types';
import type { ImageSourcePropType } from 'react-native';

function getPlaceImageSource(
  place: Place,
  accessToken: string | null,
): ImageSourcePropType | null {
  const bundled = getPlaceHeroImage(place);
  if (bundled) return bundled;
  if (place.photos[0] && accessToken) {
    return { uri: getGooglePlacePhotoUrl(place.photos[0], accessToken) };
  }
  return null;
}

type Props = {
  navigation: { navigate: (screen: string, params?: object) => void };
};

export function PlacesScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const headerHeight = useStackHeaderHeight();

  const { data: allPlaces = [], isLoading: placesLoading } = useQuery({
    queryKey: ['places'],
    queryFn: listActivePlaces,
  });

  const { savedPlaceIds, isLoading: savesLoading } = useSavedPlaces(user?.id);
  const toggleSave = useToggleSavedPlace();
  const [photoAccessToken, setPhotoAccessToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPhotoAccessToken(session?.access_token ?? null);
    });
  }, []);

  const savedPlaces = allPlaces.filter((p) => savedPlaceIds.has(p.id));
  const isLoading = placesLoading || savesLoading;

  const handlePlacePress = (placeId: string) => {
    navigation.navigate('PlaceDetail', { placeId });
  };

  const handleSaveToggle = (placeId: string, isSaved: boolean) => {
    toggleSave.mutate({ placeId, isSaved });
  };

  return (
    <ScreenWithWallpaper>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Saved section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved</Text>
            {isLoading ? (
              <Text style={styles.helperText}>Loading...</Text>
            ) : savedPlaces.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No saved places yet</Text>
                <Text style={styles.emptyBody}>
                  Tap the bookmark on any place below to save it for quick access.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {savedPlaces.map((place) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    isSaved={true}
                    onPress={() => handlePlacePress(place.id)}
                    onSaveToggle={() => handleSaveToggle(place.id, true)}
                    saveLoading={toggleSave.isPending}
                    showTypeChip={false}
                    heroImageSource={getPlaceImageSource(place, photoAccessToken)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* All Places section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Places</Text>
            {isLoading ? (
              <Text style={styles.helperText}>Loading...</Text>
            ) : allPlaces.length === 0 ? (
              <Text style={styles.helperText}>No places available yet.</Text>
            ) : (
              <View style={styles.list}>
                {allPlaces.map((place) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    isSaved={savedPlaceIds.has(place.id)}
                    onPress={() => handlePlacePress(place.id)}
                    onSaveToggle={() => handleSaveToggle(place.id, savedPlaceIds.has(place.id))}
                    saveLoading={toggleSave.isPending}
                    showTypeChip={false}
                    heroImageSource={getPlaceImageSource(place, photoAccessToken)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl + 75,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleMD,
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  helperText: {
    ...typography.bodyMuted,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.subtitle,
  },
  emptyBody: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
});
