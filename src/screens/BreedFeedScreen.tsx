import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFeed } from '@/api/posts';
import { setReaction } from '@/api/reactions';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { PostCard } from '@/components/PostCard';
import { ReactionPicker } from '@/components/ReactionPicker';
import type { PostWithDetails, BreedEnum, ReactionEnum } from '@/types';
import { BREED_LABELS } from '@/utils/breed';

export function BreedFeedScreen() {
  const route = useRoute();
  const breedParam = (route.params as { breed?: BreedEnum })?.breed;
  const navigation = useNavigation<{ navigate: (s: string, p?: object) => void }>();
  const { user } = useAuthStore();
  const { feedSort } = useUIStore();
  const queryClient = useQueryClient();
  const [reactionPickerPost, setReactionPickerPost] = useState<PostWithDetails | null>(null);
  const breed = breedParam ?? 'GOLDEN_RETRIEVER';

  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed', breed, feedSort, user?.id],
    queryFn: () => getFeed(breed, feedSort, 20, 0, user?.id ?? null),
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: ReactionEnum | null }) =>
      setReaction(postId, user!.id, reaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', breed] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });

  const handleReactionPress = (post: PostWithDetails) => {
    setReactionPickerPost(post);
  };

  const handleReactionSelect = (reaction: ReactionEnum) => {
    if (reactionPickerPost) {
      reactionMutation.mutate({
        postId: reactionPickerPost.id,
        reaction: reaction === reactionPickerPost.user_reaction ? null : reaction,
      });
      setReactionPickerPost(null);
    }
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🐕</Text>
      <Text style={styles.emptyTitle}>No posts yet in {BREED_LABELS[breed]} community</Text>
      <Text style={styles.emptySub}>Be the first to share!</Text>
      {user && (
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('CreatePost', { breed })}
        >
          Create a post
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onReactionPress={() => handleReactionPress(item)}
          />
        )}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={posts?.length === 0 ? styles.emptyList : undefined}
      />
      <ReactionPicker
        visible={!!reactionPickerPost}
        onClose={() => setReactionPickerPost(null)}
        onSelect={handleReactionSelect}
        currentReaction={reactionPickerPost?.user_reaction ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  empty: { padding: 48, alignItems: 'center' },
  emptyList: { flexGrow: 1 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#666', marginTop: 8 },
  link: { marginTop: 16, color: '#2196F3', fontSize: 16, fontWeight: '500' },
});
