import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CirclePlus } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getGooglePlacePhotoUrl,
  getGooglePlacePreview,
  importGooglePlace,
} from '@/api/places';
import { supabase } from '@/lib/supabase';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type Props = {
  route: { params: { googlePlaceId: string; initialName?: string } };
  navigation: {
    navigate: (screen: string, params?: object) => void;
    setOptions: (opts: object) => void;
  };
};

export function GooglePlacePreviewScreen({ route, navigation }: Props) {
  const { googlePlaceId, initialName } = route.params;
  const headerHeight = useStackHeaderHeight();
  const queryClient = useQueryClient();

  const placeQuery = useQuery({
    queryKey: ['googlePlacePreview', googlePlaceId],
    queryFn: () => getGooglePlacePreview(googlePlaceId),
  });

  const [photoAccessToken, setPhotoAccessToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPhotoAccessToken(session?.access_token ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setPhotoAccessToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const bestPhotoName = useMemo(() => {
    const photos = placeQuery.data?.photos ?? [];
    if (photos.length === 0) return null;
    return [...photos].sort(
      (a, b) =>
        (b.widthPx ?? 0) / (b.heightPx ?? 1) -
        (a.widthPx ?? 0) / (a.heightPx ?? 1)
    )[0]?.name ?? null;
  }, [placeQuery.data?.photos]);

  // Explicit user tap overrides the default; falls back to best landscape photo once loaded
  const [userSelectedPhotoName, setUserSelectedPhotoName] = useState<string | null>(null);
  const selectedPhotoName = userSelectedPhotoName ?? bestPhotoName;

  const importMutation = useMutation({
    mutationFn: ({ googlePlaceId, bannerPhotoName }: { googlePlaceId: string; bannerPhotoName: string | null }) =>
      importGooglePlace(googlePlaceId, bannerPhotoName),
    onSuccess: async (place) => {
      await queryClient.invalidateQueries({ queryKey: ['places'] });
      navigation.navigate('PlaceDetail', { placeId: place.id });
    },
  });

  useEffect(() => {
    navigation.setOptions({ title: placeQuery.data?.displayName ?? initialName ?? 'Place Preview' });
  }, [initialName, navigation, placeQuery.data?.displayName]);


  const hoursLines = formatOpeningHours(placeQuery.data?.currentOpeningHours);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {placeQuery.isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.stateText}>Loading place preview…</Text>
          </View>
        ) : placeQuery.isError ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>Couldn’t load place details</Text>
            <Text style={styles.stateText}>
              {placeQuery.error instanceof Error ? placeQuery.error.message : 'Try again in a moment.'}
            </Text>
          </View>
        ) : placeQuery.data ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.title}>{placeQuery.data.displayName}</Text>
              <InfoRow
                icon="paw-outline"
                label="Category"
                value={formatPlaceCategory(placeQuery.data.placeType)}
              />
              <InfoRow
                icon="location-outline"
                label="Address"
                value={placeQuery.data.shortFormattedAddress ?? 'Not available'}
              />
              <InfoRow
                icon="star-outline"
                label="Rating"
                value={formatRating(placeQuery.data.rating, placeQuery.data.ratingCount)}
              />
              {placeQuery.data.openNow != null ? (
                <InfoRow
                  icon="time-outline"
                  label="Status"
                  value={placeQuery.data.openNow ? 'Open now' : 'Closed right now'}
                />
              ) : null}
              <Pressable
                onPress={() => importMutation.mutate({ googlePlaceId, bannerPhotoName: selectedPhotoName })}
                disabled={importMutation.isPending}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && !importMutation.isPending && styles.saveButtonPressed,
                  importMutation.isPending && styles.saveButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save place to Nuzzle"
              >
                {importMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <CirclePlus size={21} color={colors.surface} />
                )}
                <Text style={styles.saveButtonText}>
                  {importMutation.isPending ? 'Saving…' : 'Create Nuzzle Feed'}
                </Text>
              </Pressable>
            </View>

            <Section title="Photos">
              {placeQuery.data.photos.length > 0 && photoAccessToken ? (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoStrip}
                  >
                    {placeQuery.data.photos.map((photo, index) => {
                      const isSelected = photo.name === selectedPhotoName;
                      return (
                        <Pressable
                          key={photo.name}
                          onPress={() => setUserSelectedPhotoName(photo.name)}
                          accessibilityRole="button"
                          accessibilityLabel={`Photo ${index + 1}${isSelected ? ', selected as cover' : ', tap to use as cover'}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Image
                            source={{ uri: getGooglePlacePhotoUrl(photo.name, photoAccessToken!) }}
                            style={[styles.photo, isSelected && styles.photoSelected]}
                            accessibilityLabel={`${placeQuery.data?.displayName ?? 'Place'} photo ${index + 1}`}
                          />
                          {isSelected && (
                            <View style={styles.photoCheckmark}>
                              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.photoHint}>Tap a photo to use as the cover</Text>
                </>
              ) : (
                <Text style={styles.emptyValue}>No photos returned.</Text>
              )}
            </Section>

            <Section title="Hours">
              {hoursLines.length > 0 ? (
                hoursLines.map((line) => (
                  <Text key={line} style={styles.valueText}>
                    {line}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyValue}>Not available.</Text>
              )}
            </Section>

            {importMutation.isError ? (
              <Text style={styles.errorText}>
                {importMutation.error instanceof Error
                  ? importMutation.error.message
                  : 'Couldn’t save this place.'}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={colors.textMuted} />
      <View style={styles.infoBody}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function formatOpeningHours(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const maybeHours = value as { weekdayDescriptions?: unknown; openNow?: unknown };
  if (Array.isArray(maybeHours.weekdayDescriptions)) {
    return maybeHours.weekdayDescriptions.filter((line): line is string => typeof line === 'string');
  }
  if (typeof maybeHours.openNow === 'boolean') {
    return [`openNow: ${maybeHours.openNow ? 'true' : 'false'}`];
  }
  return [JSON.stringify(value, null, 2)];
}

function formatPlaceCategory(placeType: string): string {
  if (placeType === 'dog_park') return 'Dog Park';
  if (placeType === 'dog_beach') return 'Beach';
  if (placeType === 'trail') return 'Hiking Area / Trail';
  if (placeType === 'park') return 'Park';
  return 'Other';
}

function formatRating(rating: number | null, ratingCount: number | null): string {
  if (rating == null) return 'Not available';
  if (ratingCount == null) return `${rating.toFixed(1)}`;
  return `${rating.toFixed(1)} (${ratingCount.toLocaleString()} reviews)`;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl + 75,
    gap: spacing.lg,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  stateText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  title: {
    ...typography.titleMD,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_700Bold',
  },
  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  photoStrip: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  photo: {
    width: 220,
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  photoSelected: {
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  photoCheckmark: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.surface,
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  valueText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  emptyValue: {
    ...typography.bodyMuted,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  saveButtonPressed: {
    opacity: 0.88,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.surface,
    fontFamily: 'Inter_700Bold',
  },
});
