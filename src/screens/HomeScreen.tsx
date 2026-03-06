import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getFeed } from '@/api/posts';
import { getDogByOwner } from '@/api/dogs';
import { PostCard } from '@/components/PostCard';
import { ReactionPicker } from '@/components/ReactionPicker';
import { setReaction } from '@/api/reactions';
import type { PostWithDetails, ReactionEnum } from '@/types';
import { BREED_LABELS } from '@/utils/breed';

export function HomeScreen({ navigation }: { navigation: { navigate: (s: string, p?: object) => void } }) {
  const { user } = useAuthStore();
  const { feedSort } = useUIStore();
  const queryClient = useQueryClient();
  const [reactionPickerPost, setReactionPickerPost] = useState<PostWithDetails | null>(null);

  const { data: dog } = useQuery({
    queryKey: ['dog', user?.id],
    queryFn: () => getDogByOwner(user!.id),
    enabled: !!user?.id,
  });

  const breed = dog?.breed ?? 'GOLDEN_RETRIEVER';

  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed', breed, feedSort, user?.id],
    queryFn: () => getFeed(breed, feedSort, 20, 0, user?.id ?? null),
    enabled: !!user?.id,
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

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Sign in to see your feed</Text>
      </View>
    );
  }

  if (!dog) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Add a dog profile to see your breed's feed</Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('Profile')}
        >
          Go to Profile
        </Text>
      </View>
    );
  }

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🐕</Text>
      <Text style={styles.emptyTitle}>No posts yet in {BREED_LABELS[breed]} community</Text>
      <Text style={styles.emptySub}>Be the first to share!</Text>
      <Text
        style={styles.link}
        onPress={() => navigation.navigate('CreatePost', { breed })}
      >
        Create a post
      </Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty: { padding: 48, alignItems: 'center' },
  emptyList: { flexGrow: 1 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#666', marginTop: 8 },
  emptyText: { fontSize: 16, color: '#666' },
  link: { marginTop: 16, color: '#2196F3', fontSize: 16, fontWeight: '500' },
});
