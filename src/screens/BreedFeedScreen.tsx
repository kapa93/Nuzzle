import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getFeed, deletePost } from "@/api/posts";
import { rsvpMeetup, unrsvpMeetup } from "@/api/meetups";
import { getJoinedBreeds, joinBreedFeed, leaveBreedFeed } from "@/api/breedJoins";
import { setReaction } from "@/api/reactions";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { BreedHero } from "@/ui/BreedHero";
import { SwipeableBreedBanner } from "@/ui/SwipeableBreedBanner";
import { SegmentTabs } from "@/ui/SegmentTabs";
import { FeedItem } from "@/components/FeedItem";
import { getBreedHeroImageSource, getBreedHeroImageStyle } from "@/utils/breedAssets";
import { BREED_LABELS } from "@/utils/breed";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import { colors, spacing, typography } from "@/theme";
import type { PostWithDetails, BreedEnum, ReactionEnum } from "@/types";
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

export function BreedFeedScreen() {
  const route = useRoute();
  const headerHeight = useStackHeaderHeight();
  const breedParam = (route.params as { breed?: BreedEnum })?.breed;
  const navigation = useNavigation<{
    navigate: (s: string, p?: object) => void;
    setParams: (params: { breed?: BreedEnum }) => void;
  }>();
  const { user } = useAuthStore();
  const { feedFilter, setFeedFilter } = useUIStore();
  const queryClient = useQueryClient();
  const breed = breedParam ?? "GOLDEN_RETRIEVER";
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const { data: joinedBreeds = [], refetch: refetchJoins } = useQuery({
    queryKey: ["joinedBreeds", user?.id],
    queryFn: () => getJoinedBreeds(user!.id),
    enabled: !!user?.id,
  });

  const isJoined = joinedBreeds.includes(breed);

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

  const sort = "newest";
  const typeFilter = feedFilter === "QUESTION" || feedFilter === "UPDATE_STORY" || feedFilter === "TIP" || feedFilter === "MEETUP" ? feedFilter : null;

  const tabKey = FILTER_TO_TAB(feedFilter);

  const feedQueryKey = ["feed", breed, feedFilter, user?.id] as const;
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: feedQueryKey,
    queryFn: () => getFeed(breed, sort, 20, 0, user?.id ?? null, typeFilter),
  });

  const handleRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refetch]);

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

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🐕</Text>
      <Text style={styles.emptyTitle}>No posts yet in {BREED_LABELS[breed]} community</Text>
      <Text style={styles.emptySub}>Be the first to share!</Text>
      {user && (
        <Text
          style={styles.link}
          onPress={() => navigation.navigate("CreatePost", { breed })}
        >
          Ask a question or share
        </Text>
      )}
    </View>
  );

  const showSwipeable =
    user && joinedBreeds.length >= 1 && joinedBreeds.includes(breed);

  const renderHeader = useMemo(() => (
    <>
      <View>
        {showSwipeable ? (
          <SwipeableBreedBanner
            breeds={joinedBreeds}
            currentBreed={breed}
            onBreedChange={(b) => navigation.setParams({ breed: b })}
            joinedBreeds={joinedBreeds}
            onJoinPress={user ? handleJoinPressForBreed : undefined}
          />
        ) : (
          <BreedHero
            title={BREED_LABELS[breed]}
            image={getBreedHeroImageSource(breed)}
            imageStyle={getBreedHeroImageStyle(breed)}
            joined={isJoined}
            onJoinPress={user ? handleJoinPress : undefined}
          />
        )}
      </View>
      <View style={styles.tabsSection}>
        <SegmentTabs
          tabs={[...TABS]}
          activeTab={tabKey}
          onChange={(t) => setFeedFilter(TAB_TO_FILTER[t as TabKey])}
        />
      </View>
    </>
  ), [showSwipeable, joinedBreeds, breed, isJoined, tabKey, handleJoinPress, handleJoinPressForBreed, setFeedFilter]);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <View style={styles.container}>
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
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight },
            (!posts || posts.length === 0) && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
        />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  container: { flex: 1 },
  tabsSection: { marginBottom: spacing.xs },
  cardWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.xxxl },
  emptyList: { flexGrow: 1 },
  empty: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptySub: { ...typography.bodyMuted, marginTop: spacing.sm },
  link: {
    marginTop: spacing.lg,
    color: colors.primary,
    ...typography.body,
    fontWeight: "700",
  },
});
