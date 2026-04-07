import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPostById, updatePost } from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS } from '@/utils/breed';
import { colors, shadow } from '@/theme';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { postSchema } from '@/utils/validation';
import type { PostTypeEnum, PostTagEnum } from '@/types';

type EditPostRoute = {
  EditPost: { postId: string };
};

export function EditPostScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditPostRoute, 'EditPost'>>();
  const postId = route.params?.postId ?? '';
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const headerHeight = useStackHeaderHeight();
  const scrollViewRef = useRef<ScrollView>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostTypeEnum>('UPDATE_STORY');
  const [tag, setTag] = useState<PostTagEnum>('TRAINING');
  const [error, setError] = useState('');

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId, user?.id ?? null),
    enabled: !!postId && !!user,
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title ?? '');
      setContent(post.content_text);
      setType(post.type);
      setTag(post.tag);
    }
  }, [post]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const parsed = postSchema.parse({ content_text: content, type, tag, breed: post!.breed });
      return updatePost(postId, user.id, {
        content_text: parsed.content_text,
        title: title.trim() || null,
        type: parsed.type as PostTypeEnum,
        tag: parsed.tag as PostTagEnum,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigation.goBack();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = () => {
    setError('');
    try {
      postSchema.parse({ content_text: content, type, tag, breed: post?.breed });
      mutation.mutate();
    } catch {
      setError('Please fill in your post content');
    }
  };

  const scrollBodyFieldIntoView = (target: number) => {
    const scrollToFocusedInput = () => {
      const responder = (scrollViewRef.current as unknown as {
        getScrollResponder?: () => {
          scrollResponderScrollNativeHandleToKeyboard?: (nodeHandle: number, additionalOffset?: number, preventNegativeScrollOffset?: boolean) => void;
        };
      })?.getScrollResponder?.();
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(target, 72, true);
    };

    setTimeout(scrollToFocusedInput, 160);
    setTimeout(scrollToFocusedInput, 320);
  };

  if (!user) return null;

  if (isLoading || !post) {
    return (
      <View style={[styles.centered, styles.background]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (post.author_id !== user.id) {
    Alert.alert('Error', "You can't edit this post");
    navigation.goBack();
    return null;
  }

  const breed = post.breed;

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
      >
      <Text style={styles.label}>Breed</Text>
      <Text style={styles.breedValue}>{BREED_LABELS[breed]}</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.titleInput}
        placeholder="Add a title (optional)"
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.chipRow}>
        {(['QUESTION', 'UPDATE_STORY', 'TIP'] as PostTypeEnum[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, type === t && styles.chipSelected]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextSelected]}>
              {POST_TYPE_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Tag</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
        {(['TRAINING', 'BEHAVIOR', 'HEALTH', 'GROOMING', 'FOOD', 'GEAR', 'PUPPY', 'ADOLESCENT', 'ADULT', 'SENIOR', 'PLAYDATE'] as PostTagEnum[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, tag === t && styles.chipSelected]}
            onPress={() => setTag(t)}
          >
            <Text style={[styles.chipText, tag === t && styles.chipTextSelected]}>
              {POST_TAG_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Body</Text>
      <TextInput
        style={styles.input}
        placeholder="Share a question, update, or tip..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
        value={content}
        onChangeText={setContent}
        onFocus={(event) => scrollBodyFieldIntoView(event.nativeEvent.target)}
        textAlignVertical="top"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submit, mutation.isPending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Save</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  breedValue: { fontSize: 16, color: '#1f2937', marginBottom: 8 },
  titleInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
    ...shadow.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagScroll: { marginBottom: 8, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextSelected: { color: '#FFF' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#FFF',
    ...shadow.sm,
  },
  error: { color: '#ef4444', marginTop: 12, fontSize: 14 },
  submit: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    ...shadow.sm,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
