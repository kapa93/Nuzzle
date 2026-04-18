import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getFeed, deletePost } from '@/api/posts';
import { setReaction } from '@/api/reactions';
import { rsvpMeetup, unrsvpMeetup } from '@/api/meetups';
import { FeedItem } from '@/components/FeedItem';
import type { PostWithDetails, PostTypeEnum } from '@/types';
import type { BreedEnum, ReactionEnum } from '@/types';
import React from 'react';

const PAGE_SIZE = 10;

type Navigation = { navigate: (screen: string, params?: object) => void };

type UseFeedDataParams = {
  breed: BreedEnum;
  feedFilter: string;
  typeFilter: PostTypeEnum | null;
  user: { id: string } | null;
  navigation: Navigation;
  enabled?: boolean;
};

export function useFeedData({
  breed,
  feedFilter,
  typeFilter,
  user,
  navigation,
  enabled = true,
}: UseFeedDataParams) {
  const queryClient = useQueryClient();

  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const feedQueryKey = ['feed', breed, feedFilter, user?.id] as const;

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: ({ pageParam }) =>
      getFeed(breed, 'newest', PAGE_SIZE, pageParam as number, user?.id ?? null, typeFilter),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return (lastPageParam as number) + PAGE_SIZE;
    },
    enabled,
  });

  const posts = useMemo(() => data?.pages.flat() ?? [], [data]);

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
      const prev = queryClient.getQueryData<InfiniteData<PostWithDetails[]>>(feedQueryKey);
      queryClient.setQueryData<InfiniteData<PostWithDetails[]>>(feedQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((p) => {
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
            })
          ),
        };
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
      queryClient.invalidateQueries({ queryKey: ['feed', breed] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ postId, rsvped }: { postId: string; rsvped: boolean }) =>
      rsvped ? unrsvpMeetup(postId, user!.id) : rsvpMeetup(postId, user!.id),
    onMutate: async ({ postId, rsvped }) => {
      await queryClient.cancelQueries({ queryKey: feedQueryKey });
      const prev = queryClient.getQueryData<InfiniteData<PostWithDetails[]>>(feedQueryKey);
      queryClient.setQueryData<InfiniteData<PostWithDetails[]>>(feedQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((p) => {
              if (p.id !== postId || p.type !== 'MEETUP') return p;
              const wasRsvped = p.user_rsvped ?? false;
              const delta = rsvped ? -1 : 1;
              return {
                ...p,
                user_rsvped: !wasRsvped,
                attendee_count: Math.max(0, (p.attendee_count ?? 0) + delta),
              };
            })
          ),
        };
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
    (postId: string) => navigation.navigate('PostDetail', { postId }),
    [navigation]
  );

  const handleEditPost = useCallback(
    (postId: string) => navigation.navigate('EditPost', { postId }),
    [navigation]
  );

  const handleAuthorPress = useCallback(
    (authorId: string) => navigation.navigate('UserProfile', { userId: authorId }),
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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFeedItem = useCallback(
    ({ item, index }: { item: PostWithDetails; index: number }) =>
      React.createElement(FeedItem, {
        item,
        showBottomBorder: index < posts.length - 1,
        onPostPress: handlePostPress,
        onAuthorPress: handleAuthorPress,
        onReactionSelect: handleReactionSelect,
        onReactionMenuOpenChange: setReactionMenuOpen,
        onRsvpToggle: handleRsvpToggle,
        currentUserId: user?.id,
        onEdit: handleEditPost,
        onDelete: handleDeletePost,
      }),
    [
      posts.length,
      handlePostPress,
      handleAuthorPress,
      handleReactionSelect,
      handleRsvpToggle,
      handleEditPost,
      handleDeletePost,
      user?.id,
    ]
  );

  return {
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
  };
}

export { PAGE_SIZE };
