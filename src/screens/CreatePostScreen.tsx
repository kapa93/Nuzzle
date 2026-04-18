import React, { useRef, useState } from 'react';
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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createPost } from '@/api/posts';
import { getDogsByOwner } from '@/api/dogs';
import { uploadPostImage, pickImages } from '@/lib/imageUpload';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS, MEETUP_KIND_LABELS } from '@/utils/breed';
import { postSchema } from '@/utils/validation';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, shadow, spacing } from '@/theme';
import type { BreedEnum, PostTypeEnum, PostTagEnum, MeetupKind } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { captureHandledError } from '@/lib/sentry';

type CreatePostRoute = {
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum };
  CreatePostModal: { breed?: BreedEnum; initialType?: PostTypeEnum } | undefined;
};

function interByWeight(weight: '400' | '500' | '600' | '700' | '800') {
  if (Platform.OS === 'web') {
    return { fontFamily: "'Inter', sans-serif", fontWeight: weight };
  }

  if (weight === '800') return { fontFamily: 'Inter_800ExtraBold' as const };
  if (weight === '700') return { fontFamily: 'Inter_700Bold' as const };
  if (weight === '600') return { fontFamily: 'Inter_600SemiBold' as const };
  return { fontFamily: 'Inter_400Regular' as const };
}

function formatDateTime(d: Date): string {
  return d.toISOString();
}

function formatDateTimeDisplay(d: Date): string {
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CreatePostScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CreatePostRoute, 'CreatePost' | 'CreatePostModal'>>();
  const { user } = useAuthStore();

  const { data: dogs } = useQuery({
    queryKey: ['dogs', user?.id],
    queryFn: () => getDogsByOwner(user!.id),
    enabled: !!user?.id && route.params?.breed == null,
  });

  const [selectedDogIndex, setSelectedDogIndex] = useState(0);
  const breed = route.params?.breed ?? dogs?.[selectedDogIndex]?.breed ?? 'GOLDEN_RETRIEVER';
  const headerHeight = useStackHeaderHeight({
    createPostSheetModal: route.name === 'CreatePostModal',
    createPostPushed: route.name === 'CreatePost',
  });
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PostTypeEnum>(route.params?.initialType ?? 'QUESTION');
  const [tag, setTag] = useState<PostTagEnum>('TRAINING');
  const [imageUris, setImageUris] = useState<Array<{ uri: string; base64?: string }>>([]);
  const [error, setError] = useState('');

  // Meetup-specific state
  const [locationName, setLocationName] = useState('');
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [meetupKind, setMeetupKind] = useState<MeetupKind | ''>('');
  const [spotsAvailable, setSpotsAvailable] = useState('');

  const isMeetup = type === 'MEETUP';

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const payload: Record<string, unknown> = {
        content_text: content,
        type,
        tag: isMeetup ? 'PLAYDATE' : tag,
        breed,
        title: title.trim() || undefined,
        meetup_details: isMeetup
          ? {
              location_name: locationName.trim(),
              start_time: formatDateTime(startTime),
              end_time: endTime ? formatDateTime(endTime) : null,
              meetup_kind: meetupKind || null,
              spots_available: spotsAvailable ? parseInt(spotsAvailable, 10) : null,
            }
          : undefined,
      };
      const parsed = postSchema.parse(payload);
      const imageUrls: string[] = [];
      const post = await createPost(user.id, {
        breed: parsed.breed as BreedEnum,
        type: parsed.type as PostTypeEnum,
        tag: parsed.tag as PostTagEnum,
        content_text: parsed.content_text,
        title: parsed.title ?? undefined,
        meetup_details: parsed.meetup_details,
      }, imageUrls);

      for (let i = 0; i < imageUris.length; i++) {
        const img = imageUris[i];
        if (img.base64) {
          const url = await uploadPostImage(user.id, post.id, img.base64, i);
          imageUrls.push(url);
        }
      }

      if (imageUrls.length > 0) {
        const { error: postImagesError } = await supabase.from('post_images').insert(
          imageUrls.map((url, i) => ({
            post_id: post.id,
            image_url: url,
            sort_order: i,
          }))
        );
        if (postImagesError) throw postImagesError;
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      captureHandledError(err, {
        area: 'create-post.submit',
        tags: { post_type: type, has_images: imageUris.length > 0 ? 'true' : 'false' },
        extra: { imageCount: imageUris.length },
      });
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
      captureHandledError(e, {
        area: 'create-post.image-picker',
        extra: { currentImageCount: imageUris.length },
      });
      Alert.alert('Error', (e as Error).message);
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setError('');
    try {
      const payload: Record<string, unknown> = {
        content_text: content,
        type,
        tag: isMeetup ? 'PLAYDATE' : tag,
        breed,
        title: title.trim() || undefined,
        meetup_details: isMeetup
          ? {
              location_name: locationName.trim(),
              start_time: formatDateTime(startTime),
              end_time: endTime ? formatDateTime(endTime) : null,
              meetup_kind: meetupKind || null,
              spots_available: spotsAvailable ? parseInt(spotsAvailable, 10) : null,
            }
          : undefined,
      };
      postSchema.parse(payload);
      mutation.mutate();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'issues' in e) {
        const err = e as { issues: Array<{ message: string; path?: { join: (s: string) => string }[] }> };
        const first = err.issues[0];
        const msg = first?.path?.length ? `${first.path.join('.')}: ${first.message}` : first?.message;
        setError(msg ?? 'Invalid input');
      }
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

  const screenBg = route.name === 'CreatePostModal' ? colors.surface : colors.background;

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
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
        {!route.params?.breed && dogs && dogs.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagScroll}
            contentContainerStyle={styles.tagScrollContent}
          >
            {dogs.map((dog, i) => (
              <TouchableOpacity
                key={dog.id}
                style={[styles.tagChip, selectedDogIndex === i && styles.tagChipSelected]}
                onPress={() => setSelectedDogIndex(i)}
              >
                <Text style={[styles.chipText, selectedDogIndex === i && styles.chipTextSelected]}>
                  {BREED_LABELS[dog.breed]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.breedValue}>{BREED_LABELS[breed]}</Text>
        )}

        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          {(['QUESTION', 'UPDATE_STORY', 'MEETUP', 'TIP'] as PostTypeEnum[]).map((t) => (
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

        {!isMeetup && (
          <>
            <Text style={styles.label}>Tag</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScroll}
              contentContainerStyle={styles.tagScrollContent}
            >
              {(['TRAINING', 'HEALTH', 'PLAYDATE', 'GROOMING', 'BEHAVIOR', 'FOOD', 'GEAR', 'PUPPY', 'ADOLESCENT', 'ADULT', 'SENIOR'] as PostTagEnum[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, tag === t && styles.tagChipSelected]}
                  onPress={() => setTag(t)}
                >
                  <Text style={[styles.chipText, tag === t && styles.chipTextSelected]}>
                    {POST_TAG_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {isMeetup ? (
          <>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Golden Retriever playdate at the park"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <Text style={styles.label}>Body</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What should attendees know?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={content}
              onChangeText={setContent}
              onFocus={(event) => scrollBodyFieldIntoView(event.nativeEvent.target)}
              textAlignVertical="top"
            />
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Central Park Dog Run"
              placeholderTextColor={colors.textMuted}
              value={locationName}
              onChangeText={setLocationName}
            />
            <Text style={styles.label}>Date & Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.dateButtonText}>{formatDateTimeDisplay(startTime)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedDate) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (selectedDate) setStartTime(selectedDate);
                }}
                minimumDate={new Date()}
              />
            )}
            <Text style={[styles.label, styles.optionalLabel]}>End Time (optional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.dateButtonText}>
                {endTime ? formatDateTimeDisplay(endTime) : 'Add end time'}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endTime ?? startTime}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedDate) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (selectedDate) setEndTime(selectedDate);
                }}
                minimumDate={startTime}
              />
            )}
            <Text style={[styles.label, styles.optionalLabel]}>Kind (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScroll}
              contentContainerStyle={styles.tagScrollContent}
            >
              {(['playdate', 'walk', 'beach', 'training', 'other'] as MeetupKind[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.tagChip, meetupKind === k && styles.tagChipSelected]}
                  onPress={() => setMeetupKind(meetupKind === k ? '' : k)}
                >
                  <Text style={[styles.chipText, meetupKind === k && styles.chipTextSelected]}>
                    {MEETUP_KIND_LABELS[k]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.label, styles.optionalLabel]}>Spots available (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={spotsAvailable}
              onChangeText={setSpotsAvailable}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Add a short headline"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <Text style={styles.label}>Body</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share a question, update, or tip..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={content}
              onChangeText={setContent}
              onFocus={(event) => scrollBodyFieldIntoView(event.nativeEvent.target)}
              textAlignVertical="top"
            />
          </>
        )}

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
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitText}>{isMeetup ? 'Create Meetup' : 'Post'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  label: { ...interByWeight('600'), fontSize: 14, color: colors.textPrimary, marginBottom: 8, marginTop: 16 },
  optionalLabel: { ...interByWeight('500'), color: colors.textSecondary },
  breedValue: { ...interByWeight('400'), fontSize: 16, color: colors.textPrimary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagScroll: {
    marginBottom: 8,
    maxHeight: 44,
    marginHorizontal: -spacing.lg,
  },
  tagScrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.border,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.border,
    borderRadius: 20,
    marginRight: spacing.xxs,
  },
  tagChipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: { ...interByWeight('400'), fontSize: 14, color: colors.textPrimary },
  chipTextSelected: { ...interByWeight('600'), color: colors.surface },
  input: {
    ...interByWeight('400'),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
    backgroundColor: colors.surface,
  },
  textArea: { minHeight: 120 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    ...shadow.sm,
    marginBottom: 8,
  },
  dateButtonText: { ...interByWeight('400'), fontSize: 16, color: colors.textPrimary },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  thumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.border, position: 'relative', ...shadow.sm },
  thumbImage: { width: 72, height: 72 },
  removeOverlay: { position: 'absolute', top: 0, right: 0, width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeText: { ...interByWeight('700'), fontSize: 18, color: colors.surface },
  addImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  addImageText: { ...interByWeight('400'), fontSize: 14, color: colors.textSecondary },
  error: { ...interByWeight('400'), color: colors.danger, marginTop: 12, fontSize: 14 },
  submit: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { ...interByWeight('600'), color: colors.surface, fontSize: 16 },
});
