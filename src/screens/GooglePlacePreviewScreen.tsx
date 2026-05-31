import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Users } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getGooglePlacePhotoUrl,
  getGooglePlacePreview,
} from '@/api/places';
import { suggestLocalCommunity } from '@/api/communityInterests';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type Props = {
  route: { params: { googlePlaceId: string; initialName?: string } };
  navigation: {
    navigate: (screen: string, params?: object) => void;
    setOptions: (opts: object) => void;
    goBack: () => void;
  };
};

export function GooglePlacePreviewScreen({ route, navigation }: Props) {
  const { googlePlaceId, initialName } = route.params;
  const headerHeight = useStackHeaderHeight();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showGuestPrompt } = useUIStore();

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

  const [selectedPhotoName, setSelectedPhotoName] = useState<string | null>(null);

  const suggestMutation = useMutation({
    mutationFn: ({ googlePlaceId, bannerPhotoName }: {
      googlePlaceId: string;
      bannerPhotoName: string | null;
    }) => {
      if (!user) throw new Error('You must be signed in to suggest a community.');
      return suggestLocalCommunity(googlePlaceId, bannerPhotoName, user.id);
    },
    onSuccess: async (outcome) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['places'] }),
        queryClient.invalidateQueries({ queryKey: ['pendingPlaces'] }),
      ]);

      if (outcome.kind === 'navigated_to_active') {
        navigation.navigate('PlaceDetail', { placeId: outcome.place.id });
        return;
      }

      if (outcome.kind === 'already_interested') {
        Alert.alert(
          "You're already on the list",
          "You've already expressed interest in this community. We'll let you know when it goes live.",
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      // outcome.kind === 'suggested'
      Alert.alert(
        'Community suggested',
        "Thanks! We'll review this place and notify you when the community goes live.",
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    },
    onError: (error) => {
      Alert.alert(
        'Could not submit suggestion',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      );
    },
  });

  useEffect(() => {
    navigation.setOptions({ title: placeQuery.data?.displayName ?? initialName ?? 'Place Preview' });
  }, [initialName, navigation, placeQuery.data?.displayName]);

  const hoursLines = formatOpeningHours(placeQuery.data?.currentOpeningHours);

  const handleSuggest = () => {
    if (!user) {
      showGuestPrompt();
      return;
    }
    if (!selectedPhotoName) {
      Alert.alert(
        'Select a cover photo',
        'Please select an image below that you feel best showcases this place.',
      );
      return;
    }
    suggestMutation.mutate({ googlePlaceId, bannerPhotoName: selectedPhotoName });
  };

  if (placeQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Loading place preview…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {placeQuery.isError ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>Couldn't load place details</Text>
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

              <View style={styles.suggestionNote}>
                <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
                <Text style={styles.suggestionNoteText}>
                  Suggesting a place lets us know there's interest. Communities go live once enough
                  people have joined the list.
                </Text>
              </View>

              <Pressable
                onPress={handleSuggest}
                disabled={suggestMutation.isPending}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && !suggestMutation.isPending && styles.saveButtonPressed,
                  suggestMutation.isPending && styles.saveButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Suggest a local community for this place"
              >
                {suggestMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Users size={19} color={colors.surface} />
                )}
                <Text style={styles.saveButtonText}>
                  {suggestMutation.isPending ? 'Submitting…' : 'Suggest Local Community'}
                </Text>
              </Pressable>
            </View>

            <Section title="Photos">
              {placeQuery.data.photos.length > 0 ? (
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
                          onPress={() => setSelectedPhotoName(photo.name)}
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
                  <Text style={styles.photoHint}>
                    {selectedPhotoName ? 'Cover photo selected ✓' : 'Tap a photo to use as the cover'}
                  </Text>
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
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  suggestionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  suggestionNoteText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.xs,
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
