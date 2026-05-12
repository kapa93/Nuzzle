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
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPostById, updatePost } from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS } from '@/utils/breed';
import { colors, shadow } from '@/theme';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { postSchema } from '@/utils/validation';
import { pickImages, uploadPostImage } from '@/lib/imageUpload';
import { supabase } from '@/lib/supabase';
import type { PostTypeEnum, PostTagEnum, PostImage } from '@/types';

type EditPostRoute = {
  EditPost: { postId: string };
};

export function EditPostScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditPostRoute, 'EditPost'>>();
  const postId = route.params?.postId ?? '';
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();
  const headerHeight = useStackHeaderHeight();
  const scrollViewRef = useRef<ScrollView>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostTypeEnum>('UPDATE_STORY');
  const [tag, setTag] = useState<PostTagEnum>('TRAINING');
  const [error, setError] = useState('');

  // Image state
  const [existingImages, setExistingImages] = useState<PostImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<Array<{ uri: string; base64?: string }>>([]);

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
      setExistingImages(post.post_images ?? []);
    }
  }, [post]);

  const totalImageCount = existingImages.filter(img => !removedImageIds.includes(img.id)).length + newImageUris.length;

  const handlePickImages = async () => {
    try {
      const picked = await pickImages(5 - totalImageCount);
      if (picked.length > 0) {
        setNewImageUris(prev => [...prev, ...picked].slice(0, 5 - existingImages.filter(img => !removedImageIds.includes(img.id)).length));
      }
    } catch (err) {
      Alert.alert('Error', 'Could not access photo library');
    }
  };

  const removeExistingImage = (imageId: string) => {
    setRemovedImageIds(prev => [...prev, imageId]);
  };

  const removeNewImage = (index: number) => {
    setNewImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const parsed = postSchema.parse({ content_text: content, type, tag, breed: post!.breed });
      await updatePost(postId, profile?.is_admin ? undefined : user.id, {
        content_text: parsed.content_text,
        title: title.trim() || null,
        type: parsed.type as PostTypeEnum,
        tag: parsed.tag as PostTagEnum,
      });

      // Delete removed images
      if (removedImageIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('post_images')
          .delete()
          .in('id', removedImageIds);
        if (deleteError) throw deleteError;
      }

      // Upload and insert new images
      if (newImageUris.length > 0) {
        const keptExistingCount = existingImages.filter(img => !removedImageIds.includes(img.id)).length;
        for (let i = 0; i < newImageUris.length; i++) {
          const img = newImageUris[i];
          if (!img.base64) continue;
          const sortOrder = keptExistingCount + i;
          const url = await uploadPostImage(user.id, postId, img.base64, sortOrder);
          const { error: insertError } = await supabase
            .from('post_images')
            .insert({ post_id: postId, image_url: url, sort_order: sortOrder });
          if (insertError) throw insertError;
        }
      }
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

  const isUnauthorized = !isLoading && !!post && !!user && post.author_id !== user.id && !profile?.is_admin;

  useEffect(() => {
    if (isUnauthorized) {
      Alert.alert('Error', "You can't edit this post");
      navigation.goBack();
    }
  }, [isUnauthorized, navigation]);

  if (!user) return null;

  if (isLoading || !post) {
    return (
      <View style={[styles.centered, styles.background]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isUnauthorized) return null;

  const breed = post.breed;
  const visibleExistingImages = existingImages.filter(img => !removedImageIds.includes(img.id));

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
        placeholderTextColor={colors.textMuted}
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
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
        value={content}
        onChangeText={setContent}
        onFocus={(event) => scrollBodyFieldIntoView(event.nativeEvent.target)}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Images (optional)</Text>
      <View style={styles.imageRow}>
        {visibleExistingImages.map((img) => (
          <TouchableOpacity key={img.id} style={styles.thumb} onPress={() => removeExistingImage(img.id)}>
            <Image source={{ uri: img.image_url }} style={styles.thumbImage} resizeMode="cover" />
            <View style={styles.removeOverlay}>
              <Text style={styles.removeText}>×</Text>
            </View>
          </TouchableOpacity>
        ))}
        {newImageUris.map((img, i) => (
          <TouchableOpacity key={`new-${i}`} style={styles.thumb} onPress={() => removeNewImage(i)}>
            <Image source={{ uri: img.uri }} style={styles.thumbImage} resizeMode="cover" />
            <View style={styles.removeOverlay}>
              <Text style={styles.removeText}>×</Text>
            </View>
          </TouchableOpacity>
        ))}
        {totalImageCount < 5 && (
          <TouchableOpacity key="add-image" style={styles.addImage} onPress={handlePickImages}>
            <Text style={styles.addImageText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submit, mutation.isPending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={colors.surface} />
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
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginTop: 16 },
  breedValue: { fontSize: 16, color: colors.textPrimary, marginBottom: 8 },
  titleInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
    ...shadow.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagScroll: { marginBottom: 8, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.border,
    borderRadius: 20,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, color: colors.textPrimary },
  chipTextSelected: { color: colors.surface },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.border,
    position: 'relative',
    ...shadow.sm,
  },
  thumbImage: { width: 72, height: 72 },
  removeOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 18, fontWeight: '700', color: colors.surface },
  addImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addImageText: { fontSize: 14, color: colors.textSecondary },
  error: { color: colors.danger, marginTop: 12, fontSize: 14 },
  submit: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    ...shadow.sm,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
});
