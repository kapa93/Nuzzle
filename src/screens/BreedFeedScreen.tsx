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
import { setReaction } from "@/api/reactions";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { BreedHero } from "@/ui/BreedHero";
import { SegmentTabs } from "@/ui/SegmentTabs";
import { QuestionCard } from "@/ui/QuestionCard";
import { postToQuestionCardData } from "@/utils/postToQuestionCard";
import { BREED_HERO_IMAGES } from "@/utils/breedAssets";
import { BREED_LABELS } from "@/utils/breed";
import { colors, spacing, typography } from "@/theme";
import type { PostWithDetails, BreedEnum, ReactionEnum } from "@/types";

const TABS = ["Newest", "Trending"] as const;
type TabKey = (typeof TABS)[number];

export function BreedFeedScreen() {
  const route = useRoute();
  const breedParam = (route.params as { breed?: BreedEnum })?.breed;
  const navigation = useNavigation<{ navigate: (s: string, p?: object) => void }>();
  const { user } = useAuthStore();
  const { feedSort, setFeedSort } = useUIStore();
  const queryClient = useQueryClient();
  const breed = breedParam ?? "GOLDEN_RETRIEVER";

  const tabKey: TabKey = feedSort === "trending" ? "Trending" : "Newest";

  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["feed", breed, feedSort, user?.id],
    queryFn: () => getFeed(breed, feedSort, 20, 0, user?.id ?? null),
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

  const renderHeader = () => (
    <>
      <View style={styles.heroSection}>
        <BreedHero
          title={BREED_LABELS[breed]}
          image={{ uri: BREED_HERO_IMAGES[breed] }}
          joined={false}
        />
      </View>
      <SegmentTabs
        tabs={[...TABS]}
        activeTab={tabKey}
        onChange={(t) => setFeedSort(t === "Trending" ? "trending" : "newest")}
      />
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
  heroSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  cardWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
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
