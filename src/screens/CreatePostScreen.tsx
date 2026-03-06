import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createPost } from '@/api/posts';
import { uploadPostImage, pickImages } from '@/lib/imageUpload';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS } from '@/utils/breed';
import { postSchema } from '@/utils/validation';
import type { BreedEnum, PostTypeEnum, PostTagEnum } from '@/types';

type CreatePostRoute = {
  CreatePost: { breed: BreedEnum };
};

export function CreatePostScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CreatePostRoute, 'CreatePost'>>();
  const breed = route.params?.breed ?? 'GOLDEN_RETRIEVER';
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [type, setType] = useState<PostTypeEnum>('UPDATE_STORY');
  const [tag, setTag] = useState<PostTagEnum>('TRAINING');
  const [imageUris, setImageUris] = useState<Array<{ uri: string; base64?: string }>>([]);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const parsed = postSchema.parse({ content_text: content, type, tag, breed });
      const imageUrls: string[] = [];
      const post = await createPost(user.id, {
        breed: parsed.breed as BreedEnum,
        type: parsed.type as PostTypeEnum,
        tag: parsed.tag as PostTagEnum,
        content_text: parsed.content_text,
      }, imageUrls);

      for (let i = 0; i < imageUris.length; i++) {
        const img = imageUris[i];
        if (img.base64) {
          const url = await uploadPostImage(user.id, post.id, img.base64, i);
          imageUrls.push(url);
        }
      }

      if (imageUrls.length > 0) {
        await supabase.from('post_images').insert(
          imageUrls.map((url, i) => ({
            post_id: post.id,
            image_url: url,
            sort_order: i,
          }))
        );
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handlePickImages = async () => {
    try {
      const picked = await pickImages(5 - imageUris.length);
      if (picked.length > 0) {
        setImageUris((prev) => [...prev, ...picked].slice(0, 5));
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setError('');
    try {
      postSchema.parse({ content_text: content, type, tag, breed });
      mutation.mutate();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'issues' in e) {
        const err = e as { issues: Array<{ message: string }> };
        setError(err.issues[0]?.message ?? 'Invalid input');
      }
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Breed</Text>
      <Text style={styles.breedValue}>{BREED_LABELS[breed]}</Text>

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

      <Text style={styles.label}>What's on your mind?</Text>
      <TextInput
        style={styles.input}
        placeholder="Share a question, update, or tip..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Images (optional)</Text>
      <View style={styles.imageRow}>
        {imageUris.map((img, i) => (
          <TouchableOpacity key={i} style={styles.thumb} onPress={() => removeImage(i)}>
            <Image source={{ uri: img.uri }} style={styles.thumbImage} resizeMode="cover" />
            <View style={styles.removeOverlay}>
              <Text style={styles.removeText}>×</Text>
            </View>
          </TouchableOpacity>
        ))}
        {imageUris.length < 5 && (
          <TouchableOpacity style={styles.addImage} onPress={handlePickImages}>
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
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  breedValue: { fontSize: 16, color: '#1f2937', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagScroll: { marginBottom: 8, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
  },
  chipSelected: { backgroundColor: '#3b82f6' },
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
  },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  thumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: '#e5e7eb', position: 'relative' },
  thumbImage: { width: 72, height: 72 },
  removeOverlay: { position: 'absolute', top: 0, right: 0, width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  addImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: { fontSize: 14, color: '#6b7280' },
  error: { color: '#ef4444', marginTop: 12, fontSize: 14 },
  submit: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
