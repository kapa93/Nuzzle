import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getJoinedBreeds, joinBreedFeed, leaveBreedFeed } from "@/api/breedJoins";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { BreedHero } from "@/ui/BreedHero";
import { SwipeableBreedBanner } from "@/ui/SwipeableBreedBanner";
import { SegmentTabs } from "@/ui/SegmentTabs";
import { getBreedHeroImageSource, getBreedHeroImageStyle, getBreedHeroTitle } from "@/utils/breedAssets";
import { BREED_LABELS } from "@/utils/breed";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import { useFeedData } from "@/hooks/useFeedData";
import { colors, spacing, typography } from "@/theme";
import type { BreedEnum } from "@/types";
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
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const breedParam = (route.params as { breed?: BreedEnum })?.breed;
  const navigation = useNavigation<{
    navigate: (s: string, p?: object) => void;
    setParams: (params: { breed?: BreedEnum }) => void;
  }>();
  const { user } = useAuthStore();
  const { feedFilter, setFeedFilter } = useUIStore();
  const queryClient = useQueryClient();
  const breed = breedParam ?? "GOLDEN_RETRIEVER";
  const bottomFeedInset = useMemo(() => insets.bottom + spacing.xxxl + 25, [insets.bottom]);

  const { data: joinedBreeds = [] } = useQuery({
    queryKey: ["joinedBreeds", user?.id],
    queryFn: () => getJoinedBreeds(user!.id),
    enabled: !!user?.id,
  });

  const isJoined = joinedBreeds.includes(breed);

  const joinMutation = useMutation({
    mutationFn: (b: BreedEnum) => joinBreedFeed(user!.id, b),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joinedBreeds", user?.id] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (b: BreedEnum) => leaveBreedFeed(user!.id, b),
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

  const handleJoinPressForBreed = (b: BreedEnum) => {
    const joined = joinedBreeds.includes(b);
    if (joined) {
      leaveMutation.mutate(b);
    } else {
      joinMutation.mutate(b);
    }
  };

  const typeFilter = feedFilter === "QUESTION" || feedFilter === "UPDATE_STORY" || feedFilter === "TIP" || feedFilter === "MEETUP" ? feedFilter : null;
  const tabKey = FILTER_TO_TAB(feedFilter);

  const {
    feedQueryKey,
    posts,
    isLoading,
    isFetchingNextPage,
    isPullRefreshing,
    reactionMenuOpen,
    handleRefresh,
    handlePostPress,
    handleEditPost,
    handleAuthorPress,
    handleDeletePost,
    handleReactionSelect,
    handleRsvpToggle,
    handleEndReached,
    renderFeedItem,
  } = useFeedData({ breed, feedFilter, typeFilter, user, navigation });

  const renderEmpty = useCallback(() => (
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
  ), [breed, navigation, user]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

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
            title={getBreedHeroTitle(breed)}
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
          data={posts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          scrollEnabled={!reactionMenuOpen}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          renderItem={renderFeedItem}
          ListEmptyComponent={isLoading ? (
            <View style={[styles.initialLoader, { paddingBottom: tabBarHeight }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isPullRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.primarySoft}
              style={{ backgroundColor: colors.primarySoft }}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight, paddingBottom: bottomFeedInset },
            posts.length === 0 && styles.emptyList,
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
  initialLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footerLoader: { paddingVertical: spacing.xl, alignItems: 'center' },
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
