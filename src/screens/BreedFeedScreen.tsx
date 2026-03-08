import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getFeed, deletePost } from "@/api/posts";
import { getJoinedBreeds, joinBreedFeed, leaveBreedFeed } from "@/api/breedJoins";
import { setReaction } from "@/api/reactions";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { BreedHero } from "@/ui/BreedHero";
import { SwipeableBreedBanner } from "@/ui/SwipeableBreedBanner";
import { SegmentTabs } from "@/ui/SegmentTabs";
import { QuestionCard } from "@/ui/QuestionCard";
import { postToQuestionCardData } from "@/utils/postToQuestionCard";
import { getBreedHeroImageSource } from "@/utils/breedAssets";
import { BREED_LABELS } from "@/utils/breed";
import { colors, radius, spacing, typography } from "@/theme";
import type { PostWithDetails, BreedEnum, ReactionEnum } from "@/types";
import type { FeedFilter } from "@/store/uiStore";

const TABS = ["All", "Tips", "Questions", "Update/Story"] as const;
type TabKey = (typeof TABS)[number];

const TAB_TO_FILTER: Record<TabKey, FeedFilter> = {
  All: "all",
  Tips: "TIP",
  Questions: "QUESTION",
  "Update/Story": "UPDATE_STORY",
};

const FILTER_TO_TAB = (f: FeedFilter): TabKey =>
  f === "all" ? "All" : f === "TIP" ? "Tips" : f === "QUESTION" ? "Questions" : "Update/Story";

export function BreedFeedScreen() {
  const route = useRoute();
  const breedParam = (route.params as { breed?: BreedEnum })?.breed;
  const navigation = useNavigation<{ navigate: (s: string, p?: object) => void }>();
  const { user } = useAuthStore();
  const { feedFilter, setFeedFilter } = useUIStore();
  const queryClient = useQueryClient();
  const breed = breedParam ?? "GOLDEN_RETRIEVER";
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);

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
  const typeFilter = feedFilter === "QUESTION" || feedFilter === "UPDATE_STORY" || feedFilter === "TIP" ? feedFilter : null;

  const tabKey = FILTER_TO_TAB(feedFilter);

  const feedQueryKey = ["feed", breed, feedFilter, user?.id] as const;
  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: feedQueryKey,
    queryFn: () => getFeed(breed, sort, 20, 0, user?.id ?? null, typeFilter),
  });

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

  const handleEditPost = (postId: string) => {
    navigation.navigate("EditPost", { postId });
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Delete post",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(postId) },
      ]
    );
  };

  const handleReactionSelect = (post: PostWithDetails) => (reaction: ReactionEnum | null) => {
    reactionMutation.mutate({
      postId: post.id,
      reaction,
    });
  };

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

  const renderHeader = () => (
    <>
      <View style={styles.heroSection}>
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
            joined={isJoined}
            onJoinPress={user ? handleJoinPress : undefined}
          />
        )}
      </View>
      <View style={styles.tabsSection}>
        <SegmentTabs
          tabs={[...TABS]}
          activeTab={tabKey}
          onChange={(t) => setFeedFilter(TAB_TO_FILTER[t])}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <FlatList
          data={posts ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          scrollEnabled={!reactionMenuOpen}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <QuestionCard
                data={postToQuestionCardData(item)}
                onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
                onReactionSelect={handleReactionSelect(item)}
                onReactionMenuOpenChange={setReactionMenuOpen}
                currentUserId={user?.id}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            </View>
          )}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={!!isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            (!posts || posts.length === 0) && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  heroSection: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  tabsSection: { paddingLeft: spacing.lg, paddingRight: 0, marginTop: -spacing.xs, marginBottom: spacing.sm },
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
