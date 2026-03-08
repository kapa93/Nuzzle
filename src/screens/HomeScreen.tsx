import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { getFeed, deletePost } from "@/api/posts";
import { getDogsByOwner } from "@/api/dogs";
import { setReaction } from "@/api/reactions";
import { BreedHero } from "@/ui/BreedHero";
import { SegmentTabs } from "@/ui/SegmentTabs";
import { QuestionCard } from "@/ui/QuestionCard";
import { postToQuestionCardData } from "@/utils/postToQuestionCard";
import { BREED_HERO_IMAGES } from "@/utils/breedAssets";
import { BREED_LABELS } from "@/utils/breed";
import { colors, radius, spacing, typography } from "@/theme";
import type { PostWithDetails, ReactionEnum } from "@/types";

const TABS = ["Newest", "Trending"] as const;
type TabKey = (typeof TABS)[number];

export function HomeScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p?: object) => void };
}) {
  const { user } = useAuthStore();
  const { feedSort, setFeedSort } = useUIStore();
  const queryClient = useQueryClient();
  const [selectedDogIndex, setSelectedDogIndex] = useState(0);

  const { data: dogs } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogsByOwner(user!.id),
    enabled: !!user?.id,
  });

  const selectedDog = dogs?.[selectedDogIndex];
  const breed = selectedDog?.breed ?? "GOLDEN_RETRIEVER";

  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["feed", breed, feedSort, user?.id],
    queryFn: () => getFeed(breed, feedSort, 20, 0, user?.id ?? null),
    enabled: !!user?.id,
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: ReactionEnum | null }) =>
      setReaction(postId, user!.id, reaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed", breed] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
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

  const tabKey: TabKey = feedSort === "trending" ? "Trending" : "Newest";

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Sign in to see your feed</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dogs || dogs.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Add a dog profile to see your breed's feed</Text>
          <Text style={styles.link} onPress={() => navigation.navigate("Profile")}>
            Go to Profile
          </Text>
        </View>
      </SafeAreaView>
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

  const renderHeader = () => (
    <>
      {dogs.length > 1 && (
        <View style={styles.dogSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dogSelectorScroll}
          >
            {dogs.map((dog, idx) => (
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
        <BreedHero
          title={BREED_LABELS[breed]}
          image={{ uri: BREED_HERO_IMAGES[breed] }}
        />
      </View>
      <View style={styles.tabsSection}>
        <SegmentTabs
          tabs={[...TABS]}
          activeTab={tabKey}
          onChange={(t) => setFeedSort(t === "Trending" ? "trending" : "newest")}
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
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <QuestionCard
                data={postToQuestionCardData(item)}
                onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
                onReactionSelect={handleReactionSelect(item)}
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
  heroSection: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  tabsSection: { paddingHorizontal: spacing.lg, marginTop: -spacing.xs, marginBottom: spacing.sm },
  cardWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  listContent: { paddingBottom: spacing.xxxl },
});
