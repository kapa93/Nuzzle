import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CalendarDays, MessageSquareText, UserPen } from 'lucide-react-native';
import { DogsMetSection } from '@/components/DogsMetSection';
import { MetThisDogButton } from '@/components/MetThisDogButton';
import { DogAvatar } from '@/components/DogAvatar';
import { ProfileDogCard } from '@/components/ProfileDogCard';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, radius, spacing, typography } from '@/theme';
import {
  BREED_LABELS,
  POST_TAG_LABELS,
  POST_TYPE_LABELS,
  formatRelativeTime,
} from '@/utils/breed';

type Props = {
  profileUserId: string;
  viewerUserId?: string | null;
  showPrivateAccountInfo?: boolean;
  onOpenPost?: (postId: string) => void;
  onOpenDogProfile?: (dogId: string) => void;
  onEditProfile?: () => void;
  onAddDog?: () => void;
  onEditDog?: (dogId: string) => void;
  onDeleteDog?: (dogId: string, dogName: string) => void;
  onChangePhoto?: () => void;
  onSignOut?: () => void;
  isPhotoUpdating?: boolean;
};

const BUTTON_PRESS_ANIMATION = { duration: 180 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TapFeedbackPressable({
  children,
  style,
  onPress,
  disabled,
  fromBackgroundColor,
  toBackgroundColor,
}: {
  children: React.ReactNode;
  style?: object | object[];
  onPress?: () => void;
  disabled?: boolean;
  fromBackgroundColor: string;
  toBackgroundColor: string;
}) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.06 }],
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      [fromBackgroundColor, toBackgroundColor]
    ),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withTiming(1, BUTTON_PRESS_ANIMATION);
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, BUTTON_PRESS_ANIMATION);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

function formatJoinedDate(createdAt?: string) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

function Section({
  title,
  titleStyle,
  rightLabel,
  children,
}: {
  title: string;
  titleStyle?: object;
  rightLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>
        {rightLabel ? <Text style={styles.sectionMeta}>{rightLabel}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement;
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.quickStat}>
      <View style={styles.quickStatLabelRow}>
        {icon}
        <Text style={styles.quickStatLabel}>{label}</Text>
      </View>
      <Text style={styles.quickStatValue}>{value}</Text>
    </View>
  );
}

export function UserProfileContent({
  profileUserId,
  viewerUserId,
  showPrivateAccountInfo = false,
  onOpenPost,
  onOpenDogProfile,
  onEditProfile,
  onAddDog,
  onEditDog,
  onDeleteDog,
  onChangePhoto,
  onSignOut,
  isPhotoUpdating = false,
}: Props) {
  const headerHeight = useStackHeaderHeight();
  const {
    isOwnProfile,
    profile,
    dogs,
    viewerDogs,
    posts,
    joinedBreeds,
    dogsLoading,
    postsLoading,
    joinedBreedsLoading,
    isLoading,
    error,
    refetchAll,
  } = useUserProfile({
    profileUserId,
    viewerUserId,
    recentPostsLimit: 4,
    includeJoinedBreeds: true,
  });

  const primaryDog = dogs[0];
  const canManageProfile = isOwnProfile;
  const joinedLabel = formatJoinedDate(profile?.created_at);

  if (isLoading && !profile) {
    return (
      <View style={styles.screen}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Couldn&apos;t load this profile</Text>
          <Text style={styles.stateText}>
            {(error as Error).message || 'Please try again in a moment.'}
          </Text>
          <TapFeedbackPressable
            style={styles.primaryButton}
            onPress={() => void refetchAll()}
            fromBackgroundColor={colors.primary}
            toBackgroundColor={colors.primaryDark}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TapFeedbackPressable>
          {onSignOut && (
            <TapFeedbackPressable
              style={styles.signOutButton}
              onPress={onSignOut}
              fromBackgroundColor={colors.dangerSurface}
              toBackgroundColor={colors.dangerPressedSurface}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TapFeedbackPressable>
          )}
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.screen}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Profile not found</Text>
          <Text style={styles.stateText}>This member profile isn&apos;t available.</Text>
          {onSignOut && (
            <TapFeedbackPressable
              style={styles.signOutButton}
              onPress={onSignOut}
              fromBackgroundColor={colors.dangerSurface}
              toBackgroundColor={colors.dangerPressedSurface}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TapFeedbackPressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: headerHeight + 15 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Pressable
            disabled={!canManageProfile || !onChangePhoto || isPhotoUpdating}
            onPress={onChangePhoto}
            style={styles.heroAvatarWrap}
          >
            <DogAvatar
              imageUrl={profile.profile_image_url ?? primaryDog?.dog_image_url}
              name={profile.name ?? primaryDog?.name}
              size={135}
            />
            {canManageProfile && onChangePhoto ? (
              <View style={styles.heroAvatarBadge}>
                {isPhotoUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={15} color="#FFFFFF" />
                )}
              </View>
            ) : null}
          </Pressable>

          <Text style={styles.heroName}>{profile.name}</Text>

          {profile.city ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={styles.locationText}>{profile.city}</Text>
            </View>
          ) : null}

          <View style={styles.quickStatsRow}>
            <QuickStat icon={<Ionicons name="paw-outline" size={18} color={colors.primaryDark} />} label={dogs.length === 1 ? 'Dog' : 'Dogs'} value={dogs.length} />
            <QuickStat icon={<MessageSquareText size={16} color={colors.primaryDark} />} label="Posts" value={posts.length} />
            {joinedLabel ? <QuickStat icon={<CalendarDays size={16} color={colors.primaryDark} />} label="Joined" value={joinedLabel} /> : null}
          </View>

          {canManageProfile && (onEditProfile || onAddDog) ? (
            <View style={styles.heroActions}>
              {onEditProfile ? (
                <TapFeedbackPressable
                  style={[styles.primaryButton, styles.heroActionButton, styles.heroActionPrimary]}
                  onPress={onEditProfile}
                  fromBackgroundColor={colors.primary}
                  toBackgroundColor={colors.primaryDark}
                >
                  <Text style={styles.heroActionPrimaryText}>Edit Profile</Text>
                  <UserPen size={20} color="#FFFFFF" strokeWidth={1.85} />
                </TapFeedbackPressable>
              ) : null}
              {onAddDog ? (
                <TapFeedbackPressable
                  style={[styles.secondaryButton, styles.heroActionButton, styles.heroActionSecondary]}
                  onPress={onAddDog}
                  fromBackgroundColor={colors.surfaceMuted}
                  toBackgroundColor={colors.border}
                >
                  <Text style={styles.heroActionSecondaryText}>Add Dog</Text>
                  <Image source={require('../../assets/dog-white.png')} style={styles.addDogIcon} />
                </TapFeedbackPressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <Section
          title={canManageProfile ? 'My Dogs' : 'Dogs'}
          titleStyle={{ marginLeft: 5 }}
        >
          {dogsLoading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.inlineLoadingText}>Loading dogs...</Text>
            </View>
          ) : dogs.length > 0 ? (
            <View style={styles.sectionStack}>
              {dogs.map((dog) => (
                <ProfileDogCard
                  key={dog.id}
                  dog={dog}
                  onPress={onOpenDogProfile ? () => onOpenDogProfile(dog.id) : undefined}
                  onEdit={canManageProfile && onEditDog ? () => onEditDog(dog.id) : undefined}
                  onDelete={
                    canManageProfile && onDeleteDog
                      ? () => onDeleteDog(dog.id, dog.name)
                      : undefined
                  }
                  headerAction={
                    <MetThisDogButton
                      viewerUserId={viewerUserId}
                      viewerDogs={viewerDogs}
                      targetDog={dog}
                    />
                  }
                  footer={
                    <DogsMetSection
                      dogId={dog.id}
                      onOpenDogProfile={onOpenDogProfile}
                      title="Friends"
                    />
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionTitle}>
                {canManageProfile ? 'Add your first dog profile' : 'No dogs shared yet'}
              </Text>
              <Text style={styles.emptySectionText}>
                {canManageProfile
                  ? 'Dog profiles power identity across Nuzzle, from feeds to meetups.'
                  : 'This member hasn&apos;t added any dog details yet.'}
              </Text>
              {canManageProfile && onAddDog ? (
                <TapFeedbackPressable
                  style={styles.secondaryButton}
                  onPress={onAddDog}
                  fromBackgroundColor={colors.surfaceMuted}
                  toBackgroundColor={colors.border}
                >
                  <Text style={styles.secondaryButtonText}>Add Dog</Text>
                </TapFeedbackPressable>
              ) : null}
            </View>
          )}
        </Section>

        {(joinedBreedsLoading || joinedBreeds.length > 0) ? (
          <Section title="Communities">
            {joinedBreedsLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.inlineLoadingText}>Loading communities...</Text>
              </View>
            ) : (
              <View style={styles.communityRow}>
                {joinedBreeds.map((breed) => (
                  <View key={breed} style={styles.communityChip}>
                    <Text style={styles.communityChipText}>{BREED_LABELS[breed] ?? breed}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>
        ) : null}

        <Section title="Recent Posts">
          {postsLoading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.inlineLoadingText}>Loading recent posts...</Text>
            </View>
          ) : posts.length > 0 ? (
            <View style={styles.sectionStack}>
              {posts.map((post) => (
                <Pressable
                  key={post.id}
                  style={styles.postCard}
                  onPress={onOpenPost ? () => onOpenPost(post.id) : undefined}
                >
                  <View style={styles.postMetaRow}>
                    <View style={styles.postTypeChip}>
                      <Text style={styles.postTypeChipText}>
                        {POST_TYPE_LABELS[post.type] ?? post.type}
                      </Text>
                    </View>
                    <Text style={styles.postTimestamp}>{formatRelativeTime(post.created_at)}</Text>
                  </View>

                  {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}

                  <Text style={styles.postBody} numberOfLines={3}>
                    {post.content_text}
                  </Text>

                  <View style={styles.postFooter}>
                    <Text style={styles.postFooterText}>{POST_TAG_LABELS[post.tag] ?? post.tag}</Text>
                    <Text style={styles.postFooterText}>
                      {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionTitle}>No posts yet</Text>
              <Text style={styles.emptySectionText}>
                {canManageProfile
                  ? 'Your recent posts will show up here after you share with the pack.'
                  : 'This member hasn&apos;t posted in the community yet.'}
              </Text>
            </View>
          )}
        </Section>

        {showPrivateAccountInfo && onSignOut ? (
          <TapFeedbackPressable
            style={[styles.signOutButton, styles.signOutButtonFooter]}
            onPress={onSignOut}
            fromBackgroundColor={colors.dangerSurface}
            toBackgroundColor={colors.dangerPressedSurface}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TapFeedbackPressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 86,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  stateTitle: {
    ...typography.titleMD,
    textAlign: 'center',
  },
  stateText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  heroCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginHorizontal: -spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  heroAvatarWrap: {
    position: 'relative',
  },
  heroAvatarBadge: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    ...typography.titleMD,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  locationText: {
    ...typography.bodyMuted,
  },
  quickStatsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: spacing.xs - 2,
    width: '100%',
    marginVertical: spacing.xs,
  },
  quickStat: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primarySoft,
    borderRadius: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickStatLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
  quickStatValue: {
    ...typography.caption,
    color: colors.primaryDark,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  heroActions: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 0,
    marginBottom: 0,
  },
  section: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginHorizontal: -spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.subtitle,
  },
  sectionMeta: {
    ...typography.caption,
  },
  sectionStack: {
    gap: spacing.md,
  },
  accountValue: {
    ...typography.body,
  },
  emptySection: {
    gap: spacing.sm,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineLoadingText: {
    ...typography.bodyMuted,
  },
  emptySectionTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  emptySectionText: {
    ...typography.bodyMuted,
  },
  communityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  communityChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  communityChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  postCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: -spacing.lg,
    gap: spacing.sm,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  postTypeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  postTypeChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  postTimestamp: {
    ...typography.caption,
  },
  postTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  postBody: {
    ...typography.bodyMuted,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  postFooterText: {
    ...typography.caption,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  heroActionButton: {
    flex: 1,
  },
  heroActionPrimary: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroActionSecondary: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addDogIcon: {
    width: 23,
    height: 23,
    resizeMode: 'contain',
  },
  heroActionPrimaryText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  heroActionSecondaryText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  signOutButton: {
    marginTop: spacing.sm,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  signOutButtonFooter: {
    marginBottom: spacing.xxl,
  },
  signOutText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '700',
  },
});
