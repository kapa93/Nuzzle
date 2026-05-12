import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useScrollToTop } from '@react-navigation/native';
import { DogAvatar } from '@/components/DogAvatar';
import { FeedItem } from '@/components/FeedItem';
import { MetThisDogButton } from '@/components/MetThisDogButton';
import { useAuthStore } from '@/store/authStore';
import { checkIntoPlace, getActivePlaceCheckins, getMyActivePlaceCheckins, getPlaceById } from '@/api/places';
import { deletePost, getPlaceMeetupPosts, getPlacePosts } from '@/api/posts';
import { rsvpMeetup, unrsvpMeetup } from '@/api/meetups';
import { setReaction } from '@/api/reactions';
import { getDogsByOwner } from '@/api/dogs';
import { useToggleSavedPlace, useSavedPlacesWithActivity } from '@/hooks/useSavedPlaces';
import { NUZZLE_TAB_BAR_LAYOUT_EXTENDS_BELOW_SCREEN } from '@/navigation/NuzzleTabBar';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { useScrollDirectionUpdater, useScrollDirection } from '@/context/ScrollDirectionContext';
import { BREED_LABELS, PLAY_STYLE_LABELS, formatRelativeTime } from '@/utils/breed';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { captureHandledError } from '@/lib/sentry';
import { NotificationsSheet } from '@/components/NotificationsSheet';
import { Bell } from 'lucide-react-native';
import type { ActivePlaceCheckin, Dog, Place, PlaceTypeEnum, PostWithDetails, ReactionEnum } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 230;
const FIESTA_ISLAND_HERO_IMAGE = require('../../assets/banners/fiesta-island.jpg');
const OB_DOG_BEACH_HERO_IMAGE = require('../../assets/banners/ob-dogbeach.jpg');

const PLACE_TYPE_LABELS: Record<PlaceTypeEnum, string> = {
  dog_beach: 'Dog Beach',
  dog_park: 'Dog Park',
  trail: 'Trail',
  park: 'Park',
  other: 'Place',
};

type PlaceDetailTab = 'feed' | 'dogs' | 'meetups';
const TABS: { key: PlaceDetailTab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'dogs', label: 'Dogs' },
  { key: 'meetups', label: 'Meetups' },
];

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

type Props = {
  navigation: {
    navigate: (screen: string, params?: object) => void;
    setOptions: (opts: object) => void;
  };
};

export function SavedPlacesScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const tabBarHeight = useBottomTabBarHeight();
  const tabBarScrollPad = Math.max(0, tabBarHeight - NUZZLE_TAB_BAR_LAYOUT_EXTENDS_BELOW_SCREEN);
  const headerHeight = useStackHeaderHeight();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => setNotificationsOpen(true)}
          style={({ pressed }: { pressed: boolean }) => [styles.headerButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={24} color="#000000" />
        </Pressable>
      ),
    });
  }, [navigation]);

  const { savedPlaces, isLoading: savedPlacesLoading } = useSavedPlacesWithActivity(user?.id);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<PlaceDetailTab>('feed');
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const userScrollingRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);
  useScrollToTop(flatListRef);
  const { onScroll } = useScrollDirectionUpdater();
  const { scrollDirection } = useScrollDirection();
  const bottomPad = scrollDirection === 'down' ? spacing.sm : tabBarScrollPad;

  const selectedPlace: Place | undefined = savedPlaces[selectedIndex];
  const placeId = selectedPlace?.id ?? null;

  // Keep the visible carousel page aligned with selectedIndex if the header remounts.
  React.useEffect(() => {
    if (savedPlaces.length === 0) return;
    scrollRef.current?.scrollTo({
      x: selectedIndex * SCREEN_WIDTH,
      animated: false,
    });
  }, [savedPlaces.length, selectedIndex]);

  const handleCarouselMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!userScrollingRef.current) return;
      userScrollingRef.current = false;
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / SCREEN_WIDTH);
      if (index !== selectedIndex && index >= 0 && index < savedPlaces.length) {
        setSelectedIndex(index);
        setActiveTab('feed');
      }
    },
    [selectedIndex, savedPlaces.length],
  );

  // Place data (fetched individually so it stays up-to-date)
  const { data: place } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlaceById(placeId!),
    enabled: !!placeId,
  });

  const { data: activeCheckins = [], isLoading: checkinsLoading } = useQuery({
    queryKey: ['placeActiveCheckins', placeId],
    queryFn: () => getActivePlaceCheckins(placeId!),
    enabled: !!placeId,
    refetchInterval: 60_000,
  });

  const { data: placePosts = [], isLoading: feedLoading } = useQuery({
    queryKey: ['placePosts', placeId],
    queryFn: () => getPlacePosts(placeId!, user?.id ?? null),
    enabled: !!placeId,
  });

  const { data: placeMeetups = [], isLoading: meetupsLoading } = useQuery({
    queryKey: ['placeMeetups', placeId],
    queryFn: () => getPlaceMeetupPosts(placeId!, user?.id ?? null),
    enabled: !!placeId,
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['dogs', user?.id],
    queryFn: () => getDogsByOwner(user!.id),
    enabled: !!user?.id,
  });

  const { data: myActiveCheckins = [] } = useQuery({
    queryKey: ['placeMyCheckins', user?.id, placeId],
    queryFn: () => getMyActivePlaceCheckins(placeId!, user!.id),
    enabled: !!user?.id && !!placeId,
    refetchInterval: 60_000,
  });

  const toggleSave = useToggleSavedPlace();
  const queryClient = useQueryClient();

  const placePostsQueryKey = useMemo(() => ['placePosts', placeId] as const, [placeId]);
  const placeMeetupsQueryKey = useMemo(() => ['placeMeetups', placeId] as const, [placeId]);

  const patchPostReactions = useCallback(
    (old: PostWithDetails[] | undefined, postId: string, reaction: ReactionEnum | null) => {
      if (!old) return old;
      return old.map((p) => {
        if (p.id !== postId) return p;
        const prevReaction = p.user_reaction;
        const counts = { ...(p.reaction_counts ?? {}) } as Partial<Record<ReactionEnum, number>>;
        if (prevReaction) counts[prevReaction] = Math.max(0, (counts[prevReaction] ?? 1) - 1);
        if (reaction) counts[reaction] = (counts[reaction] ?? 0) + 1;
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
      return { ...p, user_rsvped: !wasRsvped, attendee_count: Math.max(0, (p.attendee_count ?? 0) + delta) };
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

  const checkinMutation = useMutation({
    mutationFn: ({ targetPlaceId, dogIds, durationMinutes }: { targetPlaceId: string; dogIds: string[]; durationMinutes?: number }) =>
      checkIntoPlace(targetPlaceId, user!.id, dogIds, durationMinutes),
    onSuccess: (_data, { targetPlaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['placeActiveCheckins', targetPlaceId] });
      queryClient.invalidateQueries({ queryKey: ['placeMyCheckins', user?.id, targetPlaceId] });
    },
    onError: (error, { targetPlaceId }) => {
      captureHandledError(error, {
        area: 'place.check-in',
        tags: { screen: 'saved-places', placeId: targetPlaceId },
      });
      Alert.alert('Could not check in', 'Please try again in a moment.');
    },
  });

  const handleHeroCheckIn = useCallback((targetPlace: Place) => {
    const checkedInDogIds = new Set(myActiveCheckins.map((c) => c.dog_id));
    const available = myDogs.filter((dog) => !checkedInDogIds.has(dog.id));

    if (myDogs.length === 0) {
      Alert.alert('No dog profile', 'Add a dog profile before checking in.');
      return;
    }
    if (available.length === 0) {
      Alert.alert('All set', 'All of your dogs are already checked in.');
      return;
    }
    if (available.length === 1) {
      checkinMutation.mutate({ targetPlaceId: targetPlace.id, dogIds: [available[0].id], durationMinutes: targetPlace.check_in_duration_minutes });
      return;
    }

    const allDogsLabel = available.length === 2 ? 'Both dogs' : 'All my dogs';
    Alert.alert(
      'Choose dogs',
      'Which of your dogs are here right now?',
      [
        {
          text: allDogsLabel,
          onPress: () => checkinMutation.mutate({ targetPlaceId: targetPlace.id, dogIds: available.map((d) => d.id), durationMinutes: targetPlace.check_in_duration_minutes }),
        },
        ...available.map((dog) => ({
          text: dog.name,
          onPress: () => checkinMutation.mutate({ targetPlaceId: targetPlace.id, dogIds: [dog.id], durationMinutes: targetPlace.check_in_duration_minutes }),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }, [myDogs, myActiveCheckins, checkinMutation]);

  const handleDogPress = useCallback((dogId: string) => navigation.navigate('DogProfile', { dogId }), [navigation]);
  const handlePostPress = useCallback((postId: string) => navigation.navigate('PostDetail', { postId }), [navigation]);
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
  const handleEditPost = useCallback((postId: string) => navigation.navigate('EditPost', { postId }), [navigation]);
  const handleDeletePost = useCallback(
    (postId: string) => {
      Alert.alert('Delete post', 'Are you sure you want to delete this post? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(postId) },
      ]);
    },
    [deleteMutation],
  );

  // ── All hooks must be declared before any early return ──────────────────────
  // Refs holding latest values so ListHeader can have empty deps (stable forever)
  const activeTabRef = useRef(activeTab);
  const carouselHeaderRef = useRef<React.ReactNode>(null);

  // Unified item type for the single always-mounted FlatList
  type AnyTabItem =
    | { _tab: 'feed'; item: PostWithDetails }
    | { _tab: 'dogs'; item: ActivePlaceCheckin }
    | { _tab: 'meetups'; item: PostWithDetails };

  const isCurrentlyLoading =
    activeTab === 'feed' ? feedLoading :
    activeTab === 'dogs' ? checkinsLoading :
    meetupsLoading;

  const tabData = useMemo<AnyTabItem[]>(() => {
    if (isCurrentlyLoading) return [];
    if (activeTab === 'feed') return placePosts.map(item => ({ _tab: 'feed' as const, item }));
    if (activeTab === 'dogs') return activeCheckins.map(item => ({ _tab: 'dogs' as const, item }));
    return placeMeetups.map(item => ({ _tab: 'meetups' as const, item }));
  }, [activeTab, isCurrentlyLoading, placePosts, activeCheckins, placeMeetups]);

  const tabKeyExtractor = useCallback((tabItem: AnyTabItem) => tabItem.item.id, []);

  const renderDogRow = useCallback((item: ActivePlaceCheckin) => (
    <DogRow
      item={item}
      userId={user?.id ?? null}
      myDogs={myDogs}
      placeName={place?.name ?? ''}
      onDogPress={handleDogPress}
    />
  ), [user?.id, myDogs, place?.name, handleDogPress]);

  const ListHeader = useCallback(function SavedPlacesListHeader() {
    return (
      <>
        {carouselHeaderRef.current}
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
                <Text style={[styles.tabText, activeTabRef.current === key && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </>
    );
  }, []); // empty deps — function reference never changes, no remount ever

  const renderTabItem = useCallback(({ item: tabItem }: { item: AnyTabItem }) => {
    if (tabItem._tab === 'dogs') return renderDogRow(tabItem.item);
    if (tabItem._tab === 'meetups') {
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
  }, [renderDogRow, handlePostPress, handleAuthorPress, handleReactionSelect, handleRsvpToggle, handleEditPost, handleDeletePost, user?.id]);

  const renderTabSeparator = useCallback(() => <View style={styles.feedSeparator} />, []);

  const tabEmptyComponent = useMemo(() => {
    if (isCurrentlyLoading) {
      return (
        <View style={styles.inlineLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (activeTab === 'feed') return (
      <PlaceEmptyState
        icon="newspaper-outline"
        title="No posts here yet"
        body="Be the first to post at this place."
        cta="Post here"
        onCtaPress={() => place && navigation.navigate('CreatePost', { initialPlaceId: place.id, initialPlaceName: place.name })}
      />
    );
    if (activeTab === 'dogs') return (
      <PlaceEmptyState
        icon="paw-outline"
        title="No dogs here right now"
        body="Check back soon — dogs who check in will appear here."
      />
    );
    return (
      <PlaceEmptyState
        icon="calendar-outline"
        title="No meetups scheduled here"
        body="Meetups at this place will show up here once they're added."
      />
    );
  }, [isCurrentlyLoading, activeTab, place, navigation]);

  const tabContentStyle = useMemo(() => ({
    flexGrow: 1 as const,
    paddingBottom: bottomPad,
    ...(activeTab === 'dogs' ? { gap: spacing.sm } : {}),
  }), [activeTab, bottomPad]);

  // ── Early returns (after all hooks) ─────────────────────────────────────────
  if (!savedPlacesLoading && savedPlaces.length === 0) {
    return (
      <View style={styles.screenRoot}>
        <SafeAreaView style={[styles.safe, styles.centered]} edges={['left', 'right']}>
          <View style={{ paddingTop: headerHeight + spacing.xl, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl }}>
            <Ionicons name="bookmark-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No saved places yet</Text>
            <Text style={styles.emptyBody}>Save places from the Explore tab to see their feeds here.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const showFullScreenLoader = savedPlacesLoading;

  if (showFullScreenLoader) {
    return (
      <View style={styles.screenRoot}>
        <SafeAreaView style={[styles.safe, styles.centered]} edges={['left', 'right']}>
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </View>
    );
  }

  // Sync refs after early-return guards (plain assignments, not hook calls)
  activeTabRef.current = activeTab;

  // ── Carousel header ──────────────────────────────────────────────────────────
  const carouselHeader = (
    <View style={[styles.carouselContainer, { paddingTop: headerHeight }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => { userScrollingRef.current = true; }}
        onMomentumScrollEnd={handleCarouselMomentumEnd}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselScrollContent}
      >
        {savedPlaces.map((p) => {
          const locationLine = [p.neighborhood, p.city].filter(Boolean).join(', ');
          const isSaved = true;
          const heroImage = getPlaceHeroImage(p);
          const hasHeroImage = heroImage !== null;
          const pageContent = (
            <>
              {hasHeroImage && <View style={styles.carouselImageOverlay} />}
              <Pressable
                onPress={() => toggleSave.mutate({ placeId: p.id, isSaved })}
                hitSlop={10}
                style={({ pressed }) => [styles.carouselBookmark, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Unsave place"
                accessibilityState={{ selected: isSaved }}
              >
                <Text style={styles.carouselJoinedText}>Joined</Text>
              </Pressable>
              <View style={styles.carouselPageContent}>
                <View style={styles.carouselTitleBlock}>
                  {/* Location */}
                  <View style={styles.carouselLeft}>
                    {locationLine ? (
                      <Text style={[styles.locationText, hasHeroImage && styles.heroLocationText]} numberOfLines={1}>{locationLine}</Text>
                    ) : null}
                  </View>

                  {/* Place name */}
                  <Text style={[styles.placeName, hasHeroImage && styles.heroPlaceName]} numberOfLines={2}>{p.name}</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.carouselActions}>
                  <Pressable
                    onPress={() => navigation.navigate('CreatePost', { initialPlaceId: p.id, initialPlaceName: p.name })}
                    style={({ pressed }) => [styles.postHereBtn, hasHeroImage && styles.heroPostHereBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Post here"
                  >
                    <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
                    <Text style={[styles.postHereBtnText, hasHeroImage && styles.heroPostHereBtnText]}>Post here</Text>
                  </Pressable>
                  {p.supports_check_in && (
                    <Pressable
                      onPress={() => handleHeroCheckIn(p)}
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
          return (
            <View key={p.id} style={styles.carouselPage}>
              {hasHeroImage ? (
                <ImageBackground
                  source={heroImage}
                  style={styles.carouselPageInner}
                  imageStyle={styles.carouselHeroImage}
                  resizeMode="cover"
                >
                  {pageContent}
                </ImageBackground>
              ) : (
                <View style={styles.carouselPageInner}>
                  {pageContent}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Indicator dots */}
      {savedPlaces.length > 1 && (
        <View style={styles.dotsRow}>
          {savedPlaces.map((p, i) => (
            <View
              key={p.id}
              style={[styles.dot, i === selectedIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
  carouselHeaderRef.current = carouselHeader;

  return (
    <View style={styles.screenRoot}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>

        <FlatList
          ref={flatListRef}
          data={tabData}
          keyExtractor={tabKeyExtractor}
          extraData={activeTab}
          contentContainerStyle={tabContentStyle}
          scrollEnabled={!reactionMenuOpen}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={ListHeader}
          renderItem={renderTabItem}
          ItemSeparatorComponent={renderTabSeparator}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          ListEmptyComponent={tabEmptyComponent}
        />
      </SafeAreaView>
      <NotificationsSheet
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onPostPress={(postId) => navigation.navigate('PostDetail', { postId })}
      />
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type PlaceEmptyStateProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  cta?: string;
  onCtaPress?: () => void;
};
function PlaceEmptyState({ icon, title, body, cta, onCtaPress }: PlaceEmptyStateProps) {
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
                <Text style={styles.playStyleChipText}>{PLAY_STYLE_LABELS[item.dog_play_style]}</Text>
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
  centered: { alignItems: 'center', justifyContent: 'center' },
  feedSeparator: { height: 0, borderBottomWidth: 1.5, borderBottomColor: colors.border },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'relative',
    bottom: 1,
    left: 5,
    transform: [{ translateX: 1 }],
  },

  // Carousel
  carouselContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  carouselScrollContent: {},
  carouselPage: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  carouselPageInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 5,
    paddingBottom: spacing.md,
  },
  carouselHeroImage: {
    top: -10,
    height: CAROUSEL_HEIGHT + 10,
  },
  carouselImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  carouselPageContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  carouselTitleBlock: {
    gap: spacing.xxs,
    paddingRight: spacing.xxl,
  },
  carouselLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
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
  heroLocationText: {
    color: '#FFFFFF',
  },
  carouselActions: {
    alignSelf: 'stretch',
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: 5,
  },
  carouselBookmark: {
    position: 'absolute',
    top: spacing.md + 10,
    right: spacing.lg,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  carouselJoinedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E3834',
  },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  // Sticky header (tabs — full width; list rows keep their own horizontal inset if needed)
  stickyHeader: {
    backgroundColor: colors.surface,
    alignSelf: 'stretch',
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  summaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  typeChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  typeChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  locationText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    flexShrink: 1,
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
  tabActive: { borderBottomColor: colors.primary },
  tabText: {
    ...typography.body,
    ...typography.caption,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "600" as const }
      : { fontFamily: "Inter_600SemiBold" as const }),
  },
  tabTextActive: {
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },

  inlineLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: { flex: 1 },
  emptyTabContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  listContent: {
    gap: spacing.sm,
  },
  helperText: {
    ...typography.bodyMuted,
    textAlign: 'center',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  rowText: { flex: 1, gap: 2 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  dogName: { ...typography.body, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  playStyleChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  playStyleChipText: { ...typography.caption, color: colors.primaryDark },
  rowMeta: { ...typography.caption, color: colors.textMuted },
  rowSide: { alignItems: 'flex-end', gap: spacing.xs },
  rowTime: { ...typography.caption, color: colors.textMuted },

  pressed: { opacity: 0.7 },
});
