import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getGooglePlacePhotoUrl,
  getGooglePlacePreview,
} from '@/api/places';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, radius, spacing, typography } from '@/theme';

const PLACEHOLDER_VIBES = [
  { icon: 'water-outline' as const, label: 'Water bowls', count: 8 },
  { icon: 'umbrella-outline' as const, label: 'Dog-friendly patio', count: 6 },
  { icon: 'gift-outline' as const, label: 'Gives treats', count: 4 },
  { icon: 'partly-sunny-outline' as const, label: 'Great after beach', count: 3 },
  { icon: 'people-outline' as const, label: 'Dog-friendly staff', count: 2 },
];

const ADD_VIBES = [
  'Quiet',
  'Shady seating',
  'Spacious patio',
  'Good for small dogs',
  'Good for social dogs',
  'Usually busy',
  'Loud',
  'Limited parking',
];

type Props = {
  route: { params: { googlePlaceId: string; initialName?: string } };
  navigation: {
    setOptions: (opts: object) => void;
  };
};

export function DogSpotPreviewScreen({ route, navigation }: Props) {
  const { googlePlaceId, initialName } = route.params;
  const headerHeight = useStackHeaderHeight();

  const placeQuery = useQuery({
    queryKey: ['googlePlacePreview', googlePlaceId],
    queryFn: () => getGooglePlacePreview(googlePlaceId),
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
            </View>

            <Section title="Dog Vibes">
              <View style={styles.vibeApprovedRow}>
                <Ionicons name="paw" size={16} color={colors.primary} />
                <Text style={styles.vibeApprovedText}>Dog Approved by 12 locals</Text>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              </View>
              <Text style={styles.vibeSubtitle}>What dog owners love about this place</Text>
              <View style={styles.vibeChipRow}>
                {PLACEHOLDER_VIBES.map((vibe) => (
                  <View key={vibe.label} style={styles.vibeChip}>
                    <Ionicons name={vibe.icon} size={15} color={colors.primary} />
                    <Text style={styles.vibeChipLabel}>{vibe.label}</Text>
                    <Text style={styles.vibeChipCount}>{vibe.count}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.vibeSeparator} />
              <Text style={styles.vibeAddTitle}>Add your vibe</Text>
              <Text style={styles.vibeAddSubtitle}>Tap any that apply {'👆'}</Text>
              <View style={styles.vibeChipRow}>
                {ADD_VIBES.map((label) => (
                  <View key={label} style={styles.vibeAddChip}>
                    <Ionicons name="add" size={15} color={colors.primary} />
                    <Text style={styles.vibeAddChipLabel}>{label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.vibeFooter}>
                <Ionicons name="people-outline" size={15} color={colors.textMuted} />
                <Text style={styles.vibeFooterText}>Vibes from local dog owners like you</Text>
              </View>
            </Section>

            <Section title="Photos">
              {placeQuery.data.photos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoStrip}
                >
                  {placeQuery.data.photos.map((photo, index) => (
                    <Image
                      key={photo.name}
                      source={{ uri: getGooglePlacePhotoUrl(photo.name) }}
                      style={styles.photo}
                      accessibilityLabel={`${placeQuery.data?.displayName ?? 'Place'} photo ${index + 1}`}
                    />
                  ))}
                </ScrollView>
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
  valueText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  emptyValue: {
    ...typography.bodyMuted,
  },

  vibeApprovedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  vibeApprovedText: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  vibeSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  vibeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  vibeChipLabel: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  vibeChipCount: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  vibeSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  vibeAddTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  vibeAddSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.xxs,
  },
  vibeAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  vibeAddChipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  vibeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  vibeFooterText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
