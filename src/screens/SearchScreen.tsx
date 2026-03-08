import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchPosts } from '@/api/posts';
import { setReaction } from '@/api/reactions';
import { PostCard } from '@/components/PostCard';
import { useAuthStore } from '@/store/authStore';
import {
  BREEDS,
  POST_TAGS,
  POST_TYPES,
  BREED_LABELS,
  POST_TAG_LABELS,
  POST_TYPE_LABELS,
} from '@/utils/breed';
import type { PostWithDetails } from '@/types';
import type { BreedEnum, PostTagEnum, PostTypeEnum, ReactionEnum } from '@/types';

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [breed, setBreed] = useState<BreedEnum | ''>('');
  const [tag, setTag] = useState<PostTagEnum | ''>('');
  const [type, setType] = useState<PostTypeEnum | ''>('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const queryClient = useQueryClient();
  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: import('@/types').ReactionEnum | null }) =>
      setReaction(postId, user!.id, reaction),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['search', query, breed || undefined, tag || undefined, type || undefined, searchTrigger],
    queryFn: () =>
      searchPosts(
        {
          query: query.trim() || undefined,
          breed: breed || undefined,
          tag: tag || undefined,
          type: type || undefined,
          limit: 30,
        },
        user?.id ?? null
      ),
    enabled: searchTrigger > 0 || (query.trim().length >= 2) || !!breed || !!tag || !!type,
  });

  const handleSearch = () => setSearchTrigger((t) => t + 1);

  const handleReactionSelect = (post: PostWithDetails) => (reaction: ReactionEnum | null) => {
    reactionMutation.mutate({ postId: post.id, reaction });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search posts..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Breed</Text>
        <View style={styles.chipRow}>
          {BREEDS.map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.chip, breed === b && styles.chipActive]}
              onPress={() => setBreed(breed === b ? '' : b)}
            >
              <Text style={[styles.chipText, breed === b && styles.chipTextActive]}>
                {BREED_LABELS[b]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.filterLabel}>Tag</Text>
        <View style={styles.chipRow}>
          {POST_TAGS.slice(0, 6).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, tag === t && styles.chipActive]}
              onPress={() => setTag(tag === t ? '' : t)}
            >
              <Text style={[styles.chipText, tag === t && styles.chipTextActive]}>
                {POST_TAG_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.filterLabel}>Type</Text>
        <View style={styles.chipRow}>
          {POST_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => setType(type === t ? '' : t)}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                {POST_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : !posts || posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {searchTrigger === 0 && !query.trim()
              ? 'Enter a search term or pick filters'
              : 'No posts found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              onReactionSelect={handleReactionSelect(item)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { flexDirection: 'row', padding: 16, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  filters: { paddingHorizontal: 16, paddingBottom: 16 },
  filterLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
  },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff' },
  list: { paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});
