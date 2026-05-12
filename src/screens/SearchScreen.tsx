import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  InteractionManager,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deletePost, searchPosts } from '@/api/posts';
import { setReaction } from '@/api/reactions';
import { rsvpMeetup, unrsvpMeetup } from '@/api/meetups';
import { FeedItem } from '@/components/FeedItem';
import { useAuthStore } from '@/store/authStore';
import {
  BREEDS,
  BREED_LABELS,
} from '@/utils/breed';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import type { SearchMainParams } from '@/navigation/types';
import type { PostWithDetails } from '@/types';
import type { BreedEnum, ReactionEnum } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [breed, setBreed] = useState<BreedEnum | ''>('');
  const [queryInputFocused, setQueryInputFocused] = useState(false);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const headerHeight = useStackHeaderHeight({
    createPostSheetModal: route.name === 'SearchModal',
  });

  useEffect(() => {
    const params = (route.params ?? {}) as Partial<NonNullable<SearchMainParams>>;
    if (typeof params.launchKey !== 'number') return;

    setQuery(params.initialQuery ?? '');
    setBreed(params.initialBreed ?? '');
  }, [route.params]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: import('@/types').ReactionEnum | null }) =>
      setReaction(postId, user!.id, reaction),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId, user!.id),
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ postId, rsvped }: { postId: string; rsvped: boolean }) =>
      rsvped ? unrsvpMeetup(postId, user!.id) : rsvpMeetup(postId, user!.id),
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const searchEnabled = debouncedQuery.length >= 3 || !!breed;
  const isDebouncing = query.trim() !== debouncedQuery;

  const { data: posts = [], isLoading, isFetching, isFetched } = useQuery<PostWithDetails[]>({
    queryKey: ['search', debouncedQuery, breed || undefined],
    queryFn: () =>
      searchPosts(
        {
          query: debouncedQuery.length >= 3 ? debouncedQuery : undefined,
          breed: breed || undefined,
          limit: 30,
        },
        user?.id ?? null
      ),
    enabled: searchEnabled,
  });
  const hasAppliedFilters = !!breed;
  const trimmedQueryLength = query.trim().length;
  const hasStartedSearch = trimmedQueryLength >= 3 || hasAppliedFilters;
  const isWaitingForMoreChars = trimmedQueryLength > 0 && trimmedQueryLength < 3;
  const isSearchPending =
    hasStartedSearch && (isDebouncing || (searchEnabled && (!isFetched || isFetching)));

  const handlePostPress = useCallback(
    (postId: string) => {
      setQueryInputFocused(false);
      Keyboard.dismiss();
      InteractionManager.runAfterInteractions(() =>
        navigation.navigate('PostDetail', { postId, source: 'search' })
      );
    },
    [navigation]
  );

  const handleAuthorPress = useCallback(
    (authorId: string) => navigation.navigate('UserProfile', { userId: authorId }),
    [navigation]
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

  const handleEditPost = useCallback(
    (postId: string) => navigation.navigate('EditPost', { postId }),
    [navigation]
  );

  const handleDeletePost = useCallback(
    (postId: string) => {
      Alert.alert(
        'Delete post',
        'Are you sure you want to delete this post? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(postId) },
        ]
      );
    },
    [deleteMutation]
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
      handleAuthorPress,
      handleDeletePost,
      handleEditPost,
      handlePostPress,
      handleReactionSelect,
      handleRsvpToggle,
      user?.id,
    ]
  );

  const renderFeedSeparator = useCallback(() => <View style={styles.feedSeparator} />, []);

  const placeholderMessage = useMemo(() => {
    if (!hasStartedSearch) {
      return 'Start typing to search posts';
    }
    if (queryInputFocused && trimmedQueryLength >= 3 && (isLoading || isFetching)) {
      return 'Searching...';
    }
    return 'No posts found';
  }, [
    hasAppliedFilters,
    hasStartedSearch,
    isFetching,
    isLoading,
    isWaitingForMoreChars,
    queryInputFocused,
    trimmedQueryLength,
  ]);

  return (
    <ScreenWithWallpaper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.searchChrome, { paddingTop: headerHeight + spacing.sm }]}>
          <View style={styles.searchInputWrap}>
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Search posts..."
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setQueryInputFocused(true)}
                onBlur={() => setQueryInputFocused(false)}
                returnKeyType="search"
                autoFocus={route.name === 'SearchModal'}
              />
            </View>
          </View>
          <FlatList
            horizontal
            data={['ALL', ...BREEDS] as const}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => {
              const isAll = item === 'ALL';
              const active = isAll ? breed === '' : breed === item;
              const label = isAll ? 'All breeds' : BREED_LABELS[item];
              return (
                <Pressable
                  onPress={() => {
                    setBreed(isAll ? '' : item);
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              );
            }}
          />
        </View>

        {isSearchPending && posts.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{placeholderMessage}</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p) => p.id}
            renderItem={renderFeedItem}
            ItemSeparatorComponent={renderFeedSeparator}
            scrollEnabled={!reactionMenuOpen}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.resultsList,
              { paddingBottom: insets.bottom + spacing.md },
            ]}
          />
        )}
      </KeyboardAvoidingView>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  feedSeparator: { height: 0, borderBottomWidth: 1.5, borderBottomColor: colors.border },
  searchChrome: {
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(231, 226, 216, 0.5)',
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInputWrap: {
    paddingHorizontal: spacing.lg,
  },
  searchInputRow: {
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
    top: 2,
  },
  input: {
    flex: 1,
    ...typography.body,
    lineHeight: 19,
    color: colors.textPrimary,
    paddingVertical: 0,
    paddingTop: Platform.OS === 'ios' ? 1 : 0,
    paddingBottom: Platform.OS === 'ios' ? 2 : 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chipRow: {
    gap: spacing.xs,
    paddingLeft: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipPressed: { opacity: 0.85 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  chipTextActive: { color: colors.surface },
  resultsList: {},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.bodyMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
});
