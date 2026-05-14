import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NUZZLE_TAB_BAR_LAYOUT_EXTENDS_BELOW_SCREEN } from '@/navigation/NuzzleTabBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapPinCheck, MapPinPlus } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DogAvatar } from '@/components/DogAvatar';
import { MetThisDogButton } from '@/components/MetThisDogButton';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { useSavedPlaces, useToggleSavedPlace } from '@/hooks/useSavedPlaces';
import { getActivePlaceCheckins, getGooglePlacePhotoUrl, getPlaceById } from '@/api/places';
import { supabase } from '@/lib/supabase';
import { deletePost, getPlaceMeetupPosts, getPlacePosts } from '@/api/posts';
import { rsvpMeetup, unrsvpMeetup } from '@/api/meetups';
import { setReaction } from '@/api/reactions';
import { FeedItem } from '@/components/FeedItem';
import { getDogsByOwner } from '@/api/dogs';
import { useAuthStore } from '@/store/authStore';
import { BREED_LABELS, PLAY_STYLE_LABELS, formatRelativeTime } from '@/utils/breed';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import type { ActivePlaceCheckin, Dog, Place, PostWithDetails, ReactionEnum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 230;
const FIESTA_ISLAND_HERO_IMAGE = require('../../assets/banners/fiesta-island.jpg');
const OB_DOG_BEACH_HERO_IMAGE = require('../../assets/banners/ob-dogbeach.jpg');

function getPlaceHeroImage(place: Place): ImageSourcePropType | null {
  const slug = place.slug.toLowerCase();
  const name = place.name.toLowerCase();
  if (slug.includes('fiesta-island') || name.includes('fiesta island')) {
    return FIESTA_ISLAND_HERO_IMAGE;
  }
  if (slug.includes('ocean-beach-dog-beach') || name.includes('ocean beach dog beach')) {
    return OB_DOG_BEACH_HERO_IMAGE;
  }
  return null;
}

type PlaceDetailTab = 'feed' | 'dogs' | 'meetups';
const TABS: { key: PlaceDetailTab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'dogs', label: 'Dogs' },
  { key: 'meetups', label: 'Meetups' },
];

type Props = {
  route: { params: { placeId: string } };
  navigation: {
    navigate: (screen: string, params?: object) => void;
    setOptions: (opts: object) => void;
  };
};

export function PlaceDetailScreen({ route, navigation }: Props) {
  const { placeId } = route.params;
  const { user } = useAuthStore();
  const tabBarHeight = useBottomTabBarHeight();
  const tabBarScrollPad = Math.max(0, tabBarHeight - NUZZLE_TAB_BAR_LAYOUT_EXTENDS_BELOW_SCREEN);
  const headerHeight = useStackHeaderHeight();
  const [activeTab, setActiveTab] = useState<PlaceDetailTab>('feed');

  const { data: place, isLoading: placeLoading } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlaceById(placeId),
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

  const { data: activeCheckins = [], isLoading: checkinsLoading } = useQuery({
    queryKey: ['placeActiveCheckins', placeId],
    queryFn: () => getActivePlaceCheckins(placeId),
    refetchInterval: 60_000,
  });

  const { data: placeMeetups = [], isLoading: meetupsLoading } = useQuery({
    queryKey: ['placeMeetups', placeId],
    queryFn: () => getPlaceMeetupPosts(placeId, user?.id ?? null),
  });

  const { data: placePosts = [], isLoading: feedLoading } = useQuery({
    queryKey: ['placePosts', placeId],
    queryFn: () => getPlacePosts(placeId, user?.id ?? null),
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['dogs', user?.id],
    queryFn: () => getDogsByOwner(user!.id),
    enabled: !!user?.id,
  });

  const { savedPlaceIds } = useSavedPlaces(user?.id);
  const toggleSave = useToggleSavedPlace();

  const queryClient = useQueryClient();
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);

  const placePostsQueryKey = useMemo(() => ['placePosts', placeId] as const, [placeId]);
  const placeMeetupsQueryKey = useMemo(() => ['placeMeetups', placeId] as const, [placeId]);

  const patchPostReactions = useCallback(
    (old: PostWithDetails[] | undefined, postId: string, reaction: ReactionEnum | null) => {
      if (!old) return old;
      return old.map((p) => {
        if (p.id !== postId) return p;
        const prevReaction = p.user_reaction;
        const counts = { ...(p.reaction_counts ?? {}) } as Partial<Record<ReactionEnum, number>>;
        if (prevReaction) {
          counts[prevReaction] = Math.max(0, (counts[prevReaction] ?? 1) - 1);
        }
        if (reaction) {
          counts[reaction] = (counts[reaction] ?? 0) + 1;
        }
        return { ...p, user_reaction: reaction, reaction_counts: counts };
      });
    },
    [],
  );

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: ReactionEnum | null }) =>
      setReaction(postId, user!.id, reaction),
    onMutate: async ({ postId, reaction }) => {
      await queryClient.cancelQueries({ queryKey: placePostsQueryKey });
      await queryClient.cancelQueries({ queryKey: placeMeetupsQueryKey });
      const prevPosts = queryClient.getQueryData<PostWithDetails[]>(placePostsQueryKey);
      const prevMeetups = queryClient.getQueryData<PostWithDetails[]>(placeMeetupsQueryKey);
      queryClient.setQueryData<PostWithDetails[]>(placePostsQueryKey, (old) =>
        patchPostReactions(old, postId, reaction),
      );
      queryClient.setQueryData<PostWithDetails[]>(placeMeetupsQueryKey, (old) =>
        patchPostReactions(old, postId, reaction),
      );
      return { prevPosts, prevMeetups };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevPosts !== undefined) queryClient.setQueryData(placePostsQueryKey, ctx.prevPosts);
      if (ctx?.prevMeetups !== undefined) queryClient.setQueryData(placeMeetupsQueryKey, ctx.prevMeetups);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: placePostsQueryKey });
      queryClient.invalidateQueries({ queryKey: placeMeetupsQueryKey });
    },
  });

  const patchMeetupRsvp = useCallback((old: PostWithDetails[] | undefined, postId: string, rsvped: boolean) => {
    if (!old) return old;
    return old.map((p) => {
      if (p.id !== postId || p.type !== 'MEETUP') return p;
      const wasRsvped = p.user_rsvped ?? false;
      const delta = rsvped ? -1 : 1;
      return {
        ...p,
        user_rsvped: !wasRsvped,
        attendee_count: Math.max(0, (p.attendee_count ?? 0) + delta),
      };
    });
  }, []);

  const rsvpMutation = useMutation({
    mutationFn: ({ postId, rsvped }: { postId: string; rsvped: boolean }) =>
      rsvped ? unrsvpMeetup(postId, user!.id) : rsvpMeetup(postId, user!.id),
    onMutate: async ({ postId, rsvped }) => {
      await queryClient.cancelQueries({ queryKey: placePostsQueryKey });
      await queryClient.cancelQueries({ queryKey: placeMeetupsQueryKey });
      const prevPosts = queryClient.getQueryData<PostWithDetails[]>(placePostsQueryKey);
      const prevMeetups = queryClient.getQueryData<PostWithDetails[]>(placeMeetupsQueryKey);
      queryClient.setQueryData<PostWithDetails[]>(placePostsQueryKey, (old) =>
        patchMeetupRsvp(old, postId, rsvped),
      );
      queryClient.setQueryData<PostWithDetails[]>(placeMeetupsQueryKey, (old) =>
        patchMeetupRsvp(old, postId, rsvped),
      );
      return { prevPosts, prevMeetups };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevPosts !== undefined) queryClient.setQueryData(placePostsQueryKey, ctx.prevPosts);
      if (ctx?.prevMeetups !== undefined) queryClient.setQueryData(placeMeetupsQueryKey, ctx.prevMeetups);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: placePostsQueryKey });
      queryClient.invalidateQueries({ queryKey: placeMeetupsQueryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placePostsQueryKey });
      queryClient.invalidateQueries({ queryKey: placeMeetupsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });

  // Update nav header title when place loads
  React.useEffect(() => {
    if (place?.name) {
      navigation.setOptions({ title: place.name });
    }
  }, [place?.name, navigation]);

  const isSaved = place ? savedPlaceIds.has(place.id) : false;
  const handleDogPress = useCallback(
    (dogId: string) => navigation.navigate('DogProfile', { dogId }),
    [navigation],
  );
  const handleCheckinPress = useCallback(
    () => navigation.navigate('PlaceNow', { placeId }),
    [navigation, placeId],
  );

  const handlePostPress = useCallback(
    (postId: string) => navigation.navigate('PostDetail', { postId }),
    [navigation],
  );
  const handleAuthorPress = useCallback(
    (authorId: string) => navigation.navigate('UserProfile', { userId: authorId }),
    [navigation],
  );
  const handleReactionSelect = useCallback(
    (postId: string, reaction: ReactionEnum | null) => {
      if (!user) return;
      reactionMutation.mutate({ postId, reaction });
    },
    [reactionMutation, user],
  );
  const handleRsvpToggle = useCallback(
    (postId: string, rsvped: boolean) => {
      if (!user) return;
      rsvpMutation.mutate({ postId, rsvped });
    },
    [rsvpMutation, user],
  );
  const handleEditPost = useCallback(
    (postId: string) => navigation.navigate('EditPost', { postId }),
    [navigation],
  );
  const handleDeletePost = useCallback(
    (postId: string) => {
      Alert.alert(
        'Delete post',
        'Are you sure you want to delete this post? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(postId) },
        ],
      );
    },
    [deleteMutation],
  );

  const dogListData = useMemo(() => activeCheckins, [activeCheckins]);

  const renderFeedItem = useCallback(
    ({ item }: { item: PostWithDetails }) => (
      <FeedItem
        item={item}
        onPostPress={handlePostPress}
        onAuthorPress={handleAuthorPress}
        onReactionSelect={handleReactionSelect}
        onReactionMenuOpenChange={setReactionMenuOpen}
        onRsvpToggle={handleRsvpToggle}
        currentUserId={user?.id ?? null}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />
    ),
    [
      handlePostPress,
      handleAuthorPress,
      handleReactionSelect,
      handleRsvpToggle,
      handleEditPost,
      handleDeletePost,
      user?.id,
    ],
  );

  const renderMeetupFeedItem = useCallback(
    ({ item }: { item: PostWithDetails }) => (
      <FeedItem
        item={item}
        onPostPress={handlePostPress}
        onAuthorPress={handleAuthorPress}
        onReactionSelect={handleReactionSelect}
        onReactionMenuOpenChange={setReactionMenuOpen}
        onRsvpToggle={handleRsvpToggle}
        currentUserId={user?.id ?? null}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />
    ),
    [
      handlePostPress,
      handleAuthorPress,
      handleReactionSelect,
      handleRsvpToggle,
      handleEditPost,
      handleDeletePost,
      user?.id,
    ],
  );

  const renderFeedSeparator = useCallback(() => <View style={styles.feedSeparator} />, []);

  const keyExtractPost = useCallback((item: PostWithDetails) => item.id, []);

  // ── Stable single-FlatList header (prevents hero flicker on tab switch) ─────
  type AnyTabItem =
    | { _tab: 'feed'; item: PostWithDetails }
    | { _tab: 'dogs'; item: ActivePlaceCheckin }
    | { _tab: 'meetups'; item: PostWithDetails };

  const activeTabRef = useRef(activeTab);
  const placeHeaderRef = useRef<React.ReactNode>(null);

  const tabData = useMemo<AnyTabItem[]>(() => {
    if (activeTab === 'feed') return (feedLoading ? [] : placePosts).map(item => ({ _tab: 'feed' as const, item }));
    if (activeTab === 'dogs') return (checkinsLoading ? [] : activeCheckins).map(item => ({ _tab: 'dogs' as const, item }));
    return (meetupsLoading ? [] : placeMeetups).map(item => ({ _tab: 'meetups' as const, item }));
  }, [activeTab, feedLoading, placePosts, checkinsLoading, activeCheckins, meetupsLoading, placeMeetups]);

  const tabKeyExtractor = useCallback((tabItem: AnyTabItem) => tabItem.item.id, []);

  const tabItemSeparator = useCallback(() => <View style={styles.feedSeparator} />, []);

  const renderTabItem = useCallback(({ item: tabItem }: { item: AnyTabItem }) => {
    if (tabItem._tab === 'dogs') {
      return (
        <View style={styles.dogRowWrap}>
          <DogRow
            item={tabItem.item}
            userId={user?.id ?? null}
            myDogs={myDogs}
            placeName={place?.name ?? ''}
            onDogPress={handleDogPress}
          />
        </View>
      );
    }
    return (
      <FeedItem
        item={tabItem.item}
        onPostPress={handlePostPress}
        onAuthorPress={handleAuthorPress}
        onReactionSelect={handleReactionSelect}
        onReactionMenuOpenChange={setReactionMenuOpen}
        onRsvpToggle={handleRsvpToggle}
        currentUserId={user?.id ?? null}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />
    );
  }, [place?.name, user?.id, myDogs, handleDogPress, handlePostPress, handleAuthorPress, handleReactionSelect, handleRsvpToggle, handleEditPost, handleDeletePost]);

  const ListHeader = useCallback(function PlaceDetailListHeader() {
    return <>{placeHeaderRef.current}</>;
  }, []); // empty deps — stable reference so FlatList never remounts the hero

  if (placeLoading) {
    return (
      <View style={styles.screenRoot}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          <View style={[styles.centered, { paddingTop: headerHeight + spacing.xl }]}>
            <Text style={styles.helperText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.screenRoot}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          <View style={[styles.centered, { paddingTop: headerHeight + spacing.xl }]}>
            <Text style={styles.helperText}>Place not found.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Sync refs after early-return guards
  activeTabRef.current = activeTab;

  const locationLine = [place.neighborhood, place.city].filter(Boolean).join(', ');
  const bundledHeroImage = getPlaceHeroImage(place);
  const googleHeroUri =
    !bundledHeroImage && place.photos[0] && photoAccessToken
      ? getGooglePlacePhotoUrl(place.photos[0], photoAccessToken)
      : null;
  const heroImageSource: ImageSourcePropType | null = bundledHeroImage ?? (googleHeroUri ? { uri: googleHeroUri } : null);
  const hasHeroImage = heroImageSource !== null;
  const placeHeader = (
    <View style={[styles.heroContainer, { paddingTop: headerHeight }]}>
      <View style={styles.heroPage}>
        {hasHeroImage ? (
          <ImageBackground
            source={heroImageSource}
            style={styles.heroPageInner}
            imageStyle={styles.heroImage}
            resizeMode="cover"
          >
            <PlaceHeroContent
              place={place}
              locationLine={locationLine}
              isSaved={isSaved}
              hasHeroImage
              onToggleSave={() => toggleSave.mutate({ placeId: place.id, isSaved })}
              onPostHere={() => navigation.navigate('CreatePost', {
                initialPlaceId: place.id,
                initialPlaceName: place.name,
              })}
              onCheckIn={handleCheckinPress}
            />
          </ImageBackground>
        ) : (
          <View style={styles.heroPageInner}>
            <PlaceHeroContent
              place={place}
              locationLine={locationLine}
              isSaved={isSaved}
              hasHeroImage={false}
              onToggleSave={() => toggleSave.mutate({ placeId: place.id, isSaved })}
              onPostHere={() => navigation.navigate('CreatePost', {
                initialPlaceId: place.id,
                initialPlaceName: place.name,
              })}
              onCheckIn={handleCheckinPress}
            />
          </View>
        )}
      </View>

      <View style={styles.stickyHeader}>
        <View style={styles.tabBar}>
          {TABS.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.tab, activeTabRef.current === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTabRef.current === key }}
            >
              <Text style={[styles.tabText, activeTabRef.current === key && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
  placeHeaderRef.current = placeHeader;

  return (
    <View style={styles.screenRoot}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <FlatList
          data={tabData}
          keyExtractor={tabKeyExtractor}
          extraData={activeTab}
          contentContainerStyle={[styles.tabContent, { paddingBottom: tabBarScrollPad }]}
          scrollEnabled={!reactionMenuOpen}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          renderItem={renderTabItem}
          ItemSeparatorComponent={activeTab === 'dogs' ? undefined : tabItemSeparator}
          ListEmptyComponent={
            (activeTab === 'feed' ? feedLoading : activeTab === 'dogs' ? checkinsLoading : meetupsLoading) ? (
              <InlineLoader />
            ) : activeTab === 'feed' ? (
              <EmptyState
                icon="newspaper-outline"
                title="No posts here yet"
                body="Be the first to post at this place."
                cta="Post here"
                onCtaPress={() => navigation.navigate('CreatePost', {
                  initialPlaceId: place.id,
                  initialPlaceName: place.name,
                })}
              />
            ) : activeTab === 'dogs' ? (
              <EmptyState
                icon="paw-outline"
                title="No dogs here right now"
                body="Check back soon — dogs who check in will appear here."
              />
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="No meetups scheduled here"
                body="Meetups at this place will show up here once they're added."
              />
            )
          }
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
        />
      </SafeAreaView>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type PlaceHeroContentProps = {
  place: Place;
  locationLine: string;
  isSaved: boolean;
  hasHeroImage: boolean;
  onToggleSave: () => void;
  onPostHere: () => void;
  onCheckIn: () => void;
};
function PlaceHeroContent({
  place,
  locationLine,
  isSaved,
  hasHeroImage,
  onToggleSave,
  onPostHere,
  onCheckIn,
}: PlaceHeroContentProps) {
  return (
    <>
      {hasHeroImage && <View style={styles.heroImageOverlay} />}
      <Pressable
        onPress={onToggleSave}
        hitSlop={10}
        style={({ pressed }) => [styles.heroBookmark, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Unsave place' : 'Save place'}
        accessibilityState={{ selected: isSaved }}
      >
        <Text style={isSaved ? styles.heroBookmarkText : styles.heroBookmarkTextJoin}>{isSaved ? 'Joined' : 'Join'}</Text>
          {isSaved
            ? <MapPinCheck size={15} color="#2E3834" strokeWidth={2.5} />
            : <MapPinPlus size={17} color="#2E3834" strokeWidth={2.5} />
          }
      </Pressable>

      <View style={styles.heroPageContent}>
        <View style={styles.heroTitleBlock}>
          {locationLine ? (
            <Text style={[styles.locationText, hasHeroImage && styles.heroLocationText]} numberOfLines={1}>
              {locationLine}
            </Text>
          ) : null}
          <Text style={[styles.placeName, hasHeroImage && styles.heroPlaceName]} numberOfLines={2} allowFontScaling={false}>
            {place.name}
          </Text>
        </View>

        <View style={styles.heroActions}>
          <Pressable
            onPress={onPostHere}
            style={({ pressed }) => [styles.postHereBtn, hasHeroImage && styles.heroPostHereBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Post here"
          >
            <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
            <Text style={[styles.postHereBtnText, hasHeroImage && styles.heroPostHereBtnText]}>Post here</Text>
          </Pressable>
          {place.supports_check_in && (
            <Pressable
              onPress={onCheckIn}
              style={({ pressed }) => [styles.checkinBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Check in at this place"
            >
              <Ionicons name="paw" size={12} color={colors.surface} />
              <Text style={styles.checkinBtnText}>Check In</Text>
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}

function InlineLoader() {
  return (
    <View style={styles.inlineLoader}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

type EmptyStateProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  cta?: string;
  onCtaPress?: () => void;
};
function EmptyState({ icon, title, body, cta, onCtaPress }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={36} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {cta && onCtaPress ? (
        <Pressable
          onPress={onCtaPress}
          style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={cta}
        >
          <Text style={styles.emptyCtaText}>{cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type DogRowProps = {
  item: ActivePlaceCheckin;
  userId: string | null;
  myDogs: Dog[];
  placeName: string;
  onDogPress: (dogId: string) => void;
};
function DogRow({ item, userId, myDogs, placeName, onDogPress }: DogRowProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={() => onDogPress(item.dog_id)} style={styles.rowIdentity}>
        <DogAvatar imageUrl={item.dog_image_url} name={item.dog_name} size={44} />
        <View style={styles.rowText}>
          <View style={styles.rowNameRow}>
            <Text style={styles.dogName}>{item.dog_name}</Text>
            {item.dog_play_style ? (
              <View style={styles.playStyleChip}>
                <Text style={styles.playStyleChipText}>
                  {PLAY_STYLE_LABELS[item.dog_play_style]}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowMeta}>
            {BREED_LABELS[item.dog_breed]}
            {item.owner_name ? ` • ${item.owner_name}` : ''}
          </Text>
        </View>
      </Pressable>

      <View style={styles.rowSide}>
        <Text style={styles.rowTime}>{formatRelativeTime(item.created_at)}</Text>
        <MetThisDogButton
          viewerUserId={userId}
          viewerDogs={myDogs}
          targetDog={{ id: item.dog_id, name: item.dog_name }}
          sourceType="dog_beach"
          locationName={placeName}
          compact
          alignRight
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  feedSeparator: { height: 0, borderBottomWidth: 1.5, borderBottomColor: colors.border },

  heroContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heroPage: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  heroPageInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 5,
    paddingBottom: spacing.md,
  },
  heroImage: {
    top: -10,
    height: HERO_HEIGHT + 10,
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  heroPageContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroTitleBlock: {
    gap: spacing.xxs,
    paddingRight: spacing.xxl,
  },
  locationText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    flexShrink: 1,
  },
  heroLocationText: {
    color: '#FFFFFF',
  },
  placeName: {
    fontSize: 31,
    lineHeight: 34,
    letterSpacing: 0.1,
    ...Platform.select({
      ios: { fontFamily: 'System', fontWeight: '700' as const },
      android: { fontFamily: 'sans-serif', fontWeight: '700' as const },
      default: {
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: '700' as const,
      },
    }),
    color: colors.textPrimary,
    flexShrink: 1,
    maxWidth: '72%',
    marginBottom: spacing.xxs,
  },
  heroPlaceName: {
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 0.75 },
    textShadowRadius: 1.5,
    color: '#FFFFFF',
  },
  heroActions: {
    alignSelf: 'stretch',
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: 5,
  },
  heroBookmark: {
    position: 'absolute',
    top: spacing.md + 10,
    right: spacing.lg,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  heroBookmarkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E3834',
  },
  heroBookmarkTextJoin: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E3834',
  },
  postHereBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 0,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs - 1,
    paddingBottom: spacing.xs - 1,
  },
  heroPostHereBtn: {
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  postHereBtnText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  heroPostHereBtnText: {
    color: colors.textPrimary,
  },
  checkinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs - 1,
    paddingBottom: spacing.xs - 1,
    transform: [{ translateY: 1 }],
  },
  checkinBtnText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.surface,
    fontFamily: 'Inter_700Bold',
  },

  // Tab bar
  stickyHeader: {
    backgroundColor: colors.surface,
    alignSelf: 'stretch',
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.sm + 3,
    paddingBottom: spacing.sm + 1.5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1.5,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    ...typography.caption,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
    ...(Platform.OS === 'web'
      ? { fontFamily: "'Inter', sans-serif", fontWeight: '600' as const }
      : { fontFamily: 'Inter_600SemiBold' as const }),
  },
  tabTextActive: {
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },

  // Shared content containers
  tabContent: {
    flexGrow: 1,
  },
  inlineLoader: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    marginBottom: 20,
  },
  emptyTitle: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  emptyCtaText: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },

  // Dog row
  dogRowWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  rowIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowText: { flex: 1, marginLeft: spacing.md },
  rowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  dogName: { ...typography.subtitle },
  playStyleChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  playStyleChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  rowMeta: { ...typography.caption, marginTop: spacing.xxs },
  rowSide: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    marginRight: 5,
  },
  rowTime: { ...typography.caption, flexShrink: 0, textAlign: 'right', marginRight: 5 },

  // Loading/helper
  helperText: { ...typography.bodyMuted },
  pressed: { opacity: 0.9 },
});
