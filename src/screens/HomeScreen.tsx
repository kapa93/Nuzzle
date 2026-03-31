import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAuthStore } from "@/store/authStore";
import { OnboardingCompleteCard } from "@/components/OnboardingCompleteCard";
import { CreatePostPromptCard } from "@/components/CreatePostPromptCard";
import { MeetupPromptCard } from "@/components/MeetupPromptCard";
import { useUIStore } from "@/store/uiStore";
import { getFeed, deletePost } from "@/api/posts";
import { rsvpMeetup, unrsvpMeetup } from "@/api/meetups";
import { getDogsByOwner } from "@/api/dogs";
import { getJoinedBreeds, joinBreedFeed, leaveBreedFeed } from "@/api/breedJoins";
import {
  createDogBeachCheckins,
  getActiveDogBeachCheckins,
  getMyActiveDogBeachCheckins,
} from '@/api/locationCheckins';
import { setReaction } from "@/api/reactions";
import { BreedHero } from "@/ui/BreedHero";
import { SwipeableBreedBanner } from "@/ui/SwipeableBreedBanner";
import { SegmentTabs } from "@/ui/SegmentTabs";
import { FeedItem } from "@/components/FeedItem";
import { DogBeachNearbyAlert } from '@/components/DogBeachNearbyAlert';
import { DogBeachNowAlert } from '@/components/DogBeachNowAlert';
import { getBreedHeroImageSource } from "@/utils/breedAssets";
import { BREED_LABELS } from "@/utils/breed";
import { DOG_BEACH } from '@/config/dogBeach';
import { getDistanceMeters } from '@/utils/location';
import { useScrollDirection, useScrollDirectionUpdater } from "@/context/ScrollDirectionContext";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import { colors, radius, spacing, typography } from "@/theme";
import type { PostWithDetails, ReactionEnum } from "@/types";
import type { FeedFilter } from "@/store/uiStore";

const TABS = ["All", "Questions", "Meetups", "Tips", "Update/Story"] as const;
type TabKey = (typeof TABS)[number];

const TAB_TO_FILTER: Record<TabKey, FeedFilter> = {
  All: "all",
  Questions: "QUESTION",
  Meetups: "MEETUP",
  Tips: "TIP",
  "Update/Story": "UPDATE_STORY",
};

const FILTER_TO_TAB = (f: FeedFilter): TabKey =>
  f === "all" ? "All" : f === "TIP" ? "Tips" : f === "QUESTION" ? "Questions" : f === "MEETUP" ? "Meetups" : "Update/Story";

const ALERT_ANIM_DURATION = 220;

export function HomeScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p?: object) => void };
}) {
  const {
    user,
    onboardingDog,
    dismissOnboardingCard,
    showPostPrompt,
    dismissPostPrompt,
    showMeetupPrompt,
    dismissMeetupPrompt,
  } = useAuthStore();
  const { onScroll } = useScrollDirectionUpdater();
  const { scrollDirection } = useScrollDirection();
  const headerHeight = useStackHeaderHeight();
  const { feedFilter, setFeedFilter } = useUIStore();
  const queryClient = useQueryClient();
  const [selectedDogIndex, setSelectedDogIndex] = useState(0);
  const [selectedBreedIndex, setSelectedBreedIndex] = useState(0);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [isNearDogBeach, setIsNearDogBeach] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const forceNearby = __DEV__ && DOG_BEACH.debugForceNearby;
  const dogBeachAlertTranslateY = useSharedValue(0);

  const { data: dogs = [] } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogsByOwner(user!.id),
    enabled: !!user?.id,
  });

  const { data: joinedBreeds = [] } = useQuery({
    queryKey: ["joinedBreeds", user?.id],
    queryFn: () => getJoinedBreeds(user!.id),
    enabled: !!user?.id,
  });

  const { data: activeDogBeachCheckins = [] } = useQuery({
    queryKey: ['dogBeachActiveCheckins'],
    queryFn: getActiveDogBeachCheckins,
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  const { data: myDogBeachCheckins = [] } = useQuery({
    queryKey: ['dogBeachMyCheckins', user?.id],
    queryFn: () => getMyActiveDogBeachCheckins(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  const selectedDog = dogs?.[selectedDogIndex];
  const defaultBreed = selectedDog?.breed ?? "GOLDEN_RETRIEVER";
  const breed =
    joinedBreeds.length > 0
      ? joinedBreeds[Math.min(selectedBreedIndex, joinedBreeds.length - 1)] ?? defaultBreed
      : defaultBreed;

  const isJoined = joinedBreeds.includes(breed);
  const myDogBeachCheckinDogIds = new Set(myDogBeachCheckins.map((checkin) => checkin.dog_id));
  const availableDogsForBeachCheckIn = dogs.filter((dog) => !myDogBeachCheckinDogIds.has(dog.id));
  const showNearbyCheckinCard =
    locationChecked && isNearDogBeach && availableDogsForBeachCheckIn.length > 0;

  const joinMutation = useMutation({
    mutationFn: (b: import("@/types").BreedEnum) => joinBreedFeed(user!.id, b),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joinedBreeds", user?.id] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (b: import("@/types").BreedEnum) => leaveBreedFeed(user!.id, b),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joinedBreeds", user?.id] });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: (dogIds: string[]) => createDogBeachCheckins(user!.id, dogIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogBeachActiveCheckins'] });
      queryClient.invalidateQueries({ queryKey: ['dogBeachMyCheckins', user?.id] });
    },
    onError: () => {
      Alert.alert('Could not check in', 'Please try again in a moment.');
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    let isCancelled = false;

    const checkProximity = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        let status = permission.status;
        if (status === 'undetermined' && permission.canAskAgain) {
          const requested = await Location.requestForegroundPermissionsAsync();
          status = requested.status;
        }
        if (status !== 'granted') {
          if (!isCancelled) {
            setIsNearDogBeach(false);
            setLocationChecked(true);
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const distanceMeters = getDistanceMeters(
          position.coords.latitude,
          position.coords.longitude,
          DOG_BEACH.latitude,
          DOG_BEACH.longitude
        );
        if (!isCancelled) {
          setIsNearDogBeach(forceNearby || distanceMeters <= DOG_BEACH.radiusMeters);
          setLocationChecked(true);
        }
      } catch {
        if (!isCancelled) {
          setIsNearDogBeach(forceNearby);
          setLocationChecked(true);
        }
      }
    };

    checkProximity();
    const intervalId = setInterval(checkProximity, 5 * 60_000);
    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [user?.id, forceNearby]);

  useEffect(() => {
    dogBeachAlertTranslateY.value = withTiming(scrollDirection === 'down' ? -(headerHeight - 48) : 0, {
      duration: ALERT_ANIM_DURATION,
    });
  }, [scrollDirection, headerHeight, dogBeachAlertTranslateY]);

  const dogBeachAlertAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: dogBeachAlertTranslateY.value }],
    };
  });

  const handleJoinPress = () => {
    if (isJoined) {
      leaveMutation.mutate(breed);
    } else {
      joinMutation.mutate(breed);
    }
  };

  const handleJoinPressForBreed = (b: import("@/types").BreedEnum) => {
    const joined = joinedBreeds.includes(b);
    if (joined) {
      leaveMutation.mutate(b);
    } else {
      joinMutation.mutate(b);
    }
  };

  const handleDogBeachCheckIn = useCallback(() => {
    if (!dogs || dogs.length === 0) {
      Alert.alert('No dog profile', 'Add a dog profile before checking in.');
      return;
    }
    if (availableDogsForBeachCheckIn.length === 0) {
      Alert.alert('All set', 'All of your dogs are already checked in.');
      return;
    }
    if (availableDogsForBeachCheckIn.length === 1) {
      checkinMutation.mutate([availableDogsForBeachCheckIn[0].id]);
      return;
    }
    Alert.alert(
      'Choose dogs',
      'Which of your dogs are at the beach right now?',
      [
        {
          text: availableDogsForBeachCheckIn.length === 2 ? 'Both dogs' : 'All my dogs',
          onPress: () => checkinMutation.mutate(availableDogsForBeachCheckIn.map((dog) => dog.id)),
        },
        ...availableDogsForBeachCheckIn.map((dog) => ({
          text: dog.name,
          onPress: () => checkinMutation.mutate([dog.id]),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }, [availableDogsForBeachCheckIn, checkinMutation, dogs]);

  const sort = "newest";
  const typeFilter = feedFilter === "QUESTION" || feedFilter === "UPDATE_STORY" || feedFilter === "TIP" || feedFilter === "MEETUP" ? feedFilter : null;

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["feed", breed, feedFilter, user?.id],
    queryFn: () => getFeed(breed, sort, 20, 0, user?.id ?? null, typeFilter),
    enabled: !!user?.id,
  });

  const handleRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refetch]);

  const feedQueryKey = ["feed", breed, feedFilter, user?.id] as const;
  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: ReactionEnum | null }) =>
      setReaction(postId, user!.id, reaction),
    onMutate: async ({ postId, reaction }) => {
      await queryClient.cancelQueries({ queryKey: feedQueryKey });
      const prev = queryClient.getQueryData<PostWithDetails[]>(feedQueryKey);
      queryClient.setQueryData<PostWithDetails[]>(feedQueryKey, (old) => {
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
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(feedQueryKey, ctx.prev);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed", breed] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ postId, rsvped }: { postId: string; rsvped: boolean }) =>
      rsvped ? unrsvpMeetup(postId, user!.id) : rsvpMeetup(postId, user!.id),
    onMutate: async ({ postId, rsvped }) => {
      await queryClient.cancelQueries({ queryKey: feedQueryKey });
      const prev = queryClient.getQueryData<PostWithDetails[]>(feedQueryKey);
      queryClient.setQueryData<PostWithDetails[]>(feedQueryKey, (old) => {
        if (!old) return old;
        return old.map((p) => {
          if (p.id !== postId || p.type !== "MEETUP") return p;
          const wasRsvped = p.user_rsvped ?? false;
          const delta = rsvped ? -1 : 1;
          return {
            ...p,
            user_rsvped: !wasRsvped,
            attendee_count: Math.max(0, (p.attendee_count ?? 0) + delta),
          };
        });
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(feedQueryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
  });

  const handlePostPress = useCallback(
    (postId: string) => navigation.navigate("PostDetail", { postId }),
    [navigation]
  );

  const handleEditPost = useCallback(
    (postId: string) => navigation.navigate("EditPost", { postId }),
    [navigation]
  );

  const handleAuthorPress = useCallback(
    (authorId: string) => navigation.navigate("UserProfile", { userId: authorId }),
    [navigation]
  );

  const handleDeletePost = useCallback(
    (postId: string) => {
      Alert.alert(
        "Delete post",
        "Are you sure you want to delete this post? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(postId) },
        ]
      );
    },
    [deleteMutation]
  );

  const handleReactionSelect = useCallback(
    (postId: string, reaction: ReactionEnum | null) => {
      reactionMutation.mutate({ postId, reaction });
    },
    [reactionMutation]
  );

  const handleRsvpToggle = useCallback(
    (postId: string, rsvped: boolean) => {
      rsvpMutation.mutate({ postId, rsvped });
    },
    [rsvpMutation]
  );

  const renderFeedItem = useCallback(
    ({ item }: { item: PostWithDetails }) => (
      <FeedItem
        item={item}
        onPostPress={handlePostPress}
        onAuthorPress={handleAuthorPress}
        onReactionSelect={handleReactionSelect}
        onReactionMenuOpenChange={setReactionMenuOpen}
        onRsvpToggle={handleRsvpToggle}
        currentUserId={user?.id}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />
    ),
    [
      handlePostPress,
      handleAuthorPress,
      handleReactionSelect,
      setReactionMenuOpen,
      handleRsvpToggle,
      handleEditPost,
      handleDeletePost,
      user?.id,
    ]
  );

  const tabKey = FILTER_TO_TAB(feedFilter);

  const renderHeader = useMemo(() => (
    <>
      {joinedBreeds.length < 1 && (dogs?.length ?? 0) > 1 && (
        <View style={styles.dogSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dogSelectorScroll}
          >
            {(dogs ?? []).map((dog, idx) => (
              <Pressable
                key={dog.id}
                style={[
                  styles.dogChip,
                  selectedDogIndex === idx && styles.dogChipSelected,
                ]}
                onPress={() => setSelectedDogIndex(idx)}
              >
                <Text
                  style={[
                    styles.dogChipText,
                    selectedDogIndex === idx && styles.dogChipTextSelected,
                  ]}
                >
                  {dog.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={styles.heroSection}>
        {joinedBreeds.length >= 1 ? (
          <SwipeableBreedBanner
            breeds={joinedBreeds}
            currentBreed={breed}
            onBreedChange={(b) => {
              const idx = joinedBreeds.indexOf(b);
              if (idx >= 0) setSelectedBreedIndex(idx);
            }}
            joinedBreeds={joinedBreeds}
            onJoinPress={handleJoinPressForBreed}
          />
        ) : (
          <BreedHero
          title={BREED_LABELS[breed]}
          image={getBreedHeroImageSource(breed)}
          joined={isJoined}
          onJoinPress={handleJoinPress}
          />
        )}
      </View>
      <View style={styles.tabsSection}>
        <SegmentTabs
          tabs={[...TABS]}
          activeTab={tabKey}
          onChange={(tab) => setFeedFilter(TAB_TO_FILTER[tab as TabKey])}
        />
      </View>
      {showPostPrompt ? (
        <CreatePostPromptCard
          breed={breed}
          onCreatePost={() => {
            dismissPostPrompt();
            navigation.navigate('CreatePost', { breed });
          }}
          onDismiss={dismissPostPrompt}
        />
      ) : null}
      {showMeetupPrompt ? (
        <MeetupPromptCard
          onCreateMeetup={() => {
            dismissMeetupPrompt();
            navigation.navigate('CreatePost', { breed, initialType: 'MEETUP' });
          }}
          onExploreMeetups={() => {
            dismissMeetupPrompt();
            setFeedFilter('MEETUP');
          }}
        />
      ) : null}
    </>
  ), [
    showPostPrompt,
    dismissPostPrompt,
    showMeetupPrompt,
    dismissMeetupPrompt,
    navigation,
    joinedBreeds,
    dogs,
    selectedDogIndex,
    selectedBreedIndex,
    breed,
    isJoined,
    tabKey,
    handleJoinPress,
    handleJoinPressForBreed,
    setFeedFilter,
  ]);

  if (!user) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <Text style={styles.emptyText}>Sign in to see your feed</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if ((!dogs || dogs.length === 0) && !onboardingDog) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <Text style={styles.emptyText}>Add a dog profile to see your breed's feed</Text>
            <Text style={styles.link} onPress={() => navigation.navigate("Profile")}>
              Go to Profile
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🐕</Text>
      <Text style={styles.emptyTitle}>No posts yet in {BREED_LABELS[breed]} community</Text>
      <Text style={styles.emptySub}>Be the first to share!</Text>
      <Text style={styles.link} onPress={() => navigation.navigate("CreatePost", { breed })}>
        Ask a question or share
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <OnboardingCompleteCard
        visible={!!onboardingDog}
        dogName={onboardingDog?.name ?? ''}
        breed={onboardingDog?.breed ?? ''}
        onGoToFeed={dismissOnboardingCard}
        onExplore={() => {
          dismissOnboardingCard();
          navigation.navigate('Explore');
        }}
      />
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <View style={styles.container}>
          {(showNearbyCheckinCard || activeDogBeachCheckins.length > 0) ? (
            <Animated.View style={[styles.dogBeachAlertOverlay, { top: headerHeight + 12 }, dogBeachAlertAnimatedStyle]}>
              {showNearbyCheckinCard ? (
                <DogBeachNearbyAlert onCheckIn={handleDogBeachCheckIn} disabled={checkinMutation.isPending} />
              ) : null}
              {activeDogBeachCheckins.length > 0 ? (
                <View style={showNearbyCheckinCard ? styles.secondaryAlert : undefined}>
                  <DogBeachNowAlert
                    activeCount={activeDogBeachCheckins.length}
                    onPressView={() => navigation.navigate('DogBeachNow')}
                  />
                </View>
              ) : null}
            </Animated.View>
          ) : null}
          <FlatList
          data={posts ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          scrollEnabled={!reactionMenuOpen}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          renderItem={renderFeedItem}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={isPullRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight },
            (!posts || posts.length === 0) && styles.emptyList,
            scrollDirection === "down" && styles.listContentBarHidden,
          ]}
          showsVerticalScrollIndicator={false}
        />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  container: { flex: 1 },
  dogBeachAlertOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
    elevation: 20,
  },
  secondaryAlert: {
    marginTop: spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  empty: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
  emptyList: { flexGrow: 1 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptySub: { ...typography.bodyMuted, marginTop: spacing.sm },
  emptyText: { ...typography.body },
  link: {
    marginTop: spacing.lg,
    color: colors.primary,
    ...typography.body,
    fontWeight: "700",
  },
  dogSelector: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dogSelectorScroll: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dogChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dogChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dogChipText: { ...typography.bodyMuted, fontWeight: "700" },
  dogChipTextSelected: { color: "#FFFFFF" },
  breedSelector: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  breedSelectorScroll: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  breedChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breedChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  breedChipText: { ...typography.bodyMuted, fontWeight: "700" },
  breedChipTextSelected: { color: "#FFFFFF" },
  heroSection: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  tabsSection: { paddingLeft: spacing.lg, paddingRight: 0, marginTop: -spacing.xs, marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.xxxl },
  listContentBarHidden: { paddingBottom: spacing.sm },
});
