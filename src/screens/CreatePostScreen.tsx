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
import { getJoinedBreeds } from '@/api/breedJoins';
import { listActivePlaces, getGooglePlacePhotoUrl } from '@/api/places';
import { uploadPostImage, pickImages } from '@/lib/imageUpload';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { onPostCreated } from '@/store/notificationPromptStore';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS, MEETUP_KIND_LABELS } from '@/utils/breed';
import { BREED_PACK_IMAGES } from '@/utils/breedAssets';
import { getPlaceHeroImage } from '@/utils/placeHeroImage';
import { postSchema } from '@/utils/validation';
import { screenContent } from '@/utils/contentFilter';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, shadow, spacing } from '@/theme';
import type { BreedEnum, PostTypeEnum, PostTagEnum, MeetupKind } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { captureHandledError } from '@/lib/sentry';
import { track } from '@/lib/posthog';

type CreatePostRoute = {
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string };
  CreatePostModal: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string } | undefined;
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

const TYPE_CHIP_CONFIG: { type: PostTypeEnum; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { type: 'QUESTION', icon: 'chatbubble-outline', label: 'Question' },
  { type: 'UPDATE_STORY', icon: 'document-text-outline', label: 'Update/Story' },
  { type: 'MEETUP', icon: 'calendar-outline', label: 'Meetup' },
  { type: 'TIP', icon: 'bulb-outline', label: 'Tip' },
];

const TAG_CHIP_CONFIG: { tag: PostTagEnum; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { tag: 'TRAINING', icon: 'barbell-outline', label: 'Training' },
  { tag: 'HEALTH', icon: 'heart-outline', label: 'Health' },
  { tag: 'PLAYDATE', icon: 'paw-outline', label: 'Playdate' },
  { tag: 'GROOMING', icon: 'cut-outline', label: 'Grooming' },
  { tag: 'BEHAVIOR', icon: 'happy-outline', label: 'Behavior' },
];

export function CreatePostScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CreatePostRoute, 'CreatePost' | 'CreatePostModal'>>();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const isFromPlace = !!route.params?.initialPlaceId;

  const { data: dogs } = useQuery({
    queryKey: ['dogs', user?.id],
    queryFn: () => getDogsByOwner(user!.id),
    enabled: !isFromPlace && !!user?.id && route.params?.breed == null,
  });

  const { data: joinedBreeds = [] } = useQuery({
    queryKey: ['joinedBreeds', user?.id],
    queryFn: () => getJoinedBreeds(user!.id),
    enabled: !isFromPlace && !!user?.id && route.params?.breed == null,
  });

  const [type, setType] = useState<PostTypeEnum>(route.params?.initialType ?? 'QUESTION');

  const { data: places = [] } = useQuery({
    queryKey: ['places'],
    queryFn: listActivePlaces,
    staleTime: 5 * 60_000,
  });

  // null = user hasn't chosen yet
  const [selectedBreed, setSelectedBreed] = useState<BreedEnum | null>(route.params?.breed ?? null);
  // Auto-select when there's exactly one joined breed (resolved once data loads)
  const singleJoinedBreed = !isFromPlace && joinedBreeds.length === 1 ? joinedBreeds[0] : undefined;
  const breed: BreedEnum | null = selectedBreed ?? singleJoinedBreed ?? null;

  const headerHeight = useStackHeaderHeight({
    createPostSheetModal: route.name === 'CreatePostModal',
    createPostPushed: route.name === 'CreatePost',
  });
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<PostTagEnum[]>(['TRAINING']);
  const [imageUris, setImageUris] = useState<Array<{ uri: string; base64?: string }>>([]);
  const [error, setError] = useState('');

  const [attachedPlaceId, setAttachedPlaceId] = useState<string | null>(route.params?.initialPlaceId ?? null);
  const [attachedPlaceName, setAttachedPlaceName] = useState<string | null>(route.params?.initialPlaceName ?? null);

  // Meetup-specific state
  const [locationName, setLocationName] = useState(route.params?.initialPlaceName ?? '');
  const [linkedPlaceId, setLinkedPlaceId] = useState<string | null>(route.params?.initialPlaceId ?? null);
  const [linkedPlaceName, setLinkedPlaceName] = useState<string | null>(route.params?.initialPlaceName ?? null);
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

  const primaryTag = tags[0] ?? 'TRAINING';

  const toggleTag = (t: PostTagEnum) => {
    setTags((prev) => {
      if (prev.includes(t)) {
        return prev.length === 1 ? prev : prev.filter((x) => x !== t);
      }
      if (prev.length >= 2) return [prev[1]!, t];
      return [...prev, t];
    });
  };

  // Place-mode: resolve the place object (from the cached places list) for photo + name
  const currentPlace = isFromPlace ? (places.find(p => p.id === (route.params?.initialPlaceId)) ?? null) : null;
  const placePhotoUri = currentPlace?.photos[0] ? { uri: getGooglePlacePhotoUrl(currentPlace.photos[0]) } : null;
  const placePhoto = currentPlace ? (placePhotoUri ?? getPlaceHeroImage(currentPlace)) : null;

  const hasMultipleBreeds = !isFromPlace && joinedBreeds.length > 1 && !route.params?.breed;

  const handleBreedPicker = () => {
    if (!hasMultipleBreeds) return;
    Alert.alert(
      'Select breed',
      'Choose which breed to post to',
      [
        ...joinedBreeds.map((b) => ({
          text: BREED_LABELS[b],
          onPress: () => setSelectedBreed(b),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  React.useEffect(() => {
    const trigger =
      route.name === 'CreatePostModal' ? 'tab' :
      route.params?.initialType === 'MEETUP' ? 'meetup_prompt' :
      'home_prompt';
    track('create_post_opened', { trigger });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!isFromPlace && !breed) throw new Error('Please select a dog breed');
      const payload: Record<string, unknown> = {
        content_text: content,
        type,
        tag: isMeetup ? 'PLAYDATE' : primaryTag,
        breed: isFromPlace ? null : breed,
        title: title.trim() || undefined,
        meetup_details: isMeetup
          ? {
              location_name: locationName.trim(),
              start_time: formatDateTime(startTime),
              end_time: endTime ? formatDateTime(endTime) : null,
              meetup_kind: meetupKind || null,
              spots_available: spotsAvailable ? parseInt(spotsAvailable, 10) : null,
              place_id: linkedPlaceId ?? null,
            }
          : undefined,
      };
      const parsed = postSchema.parse(payload);
      const imageUrls: string[] = [];
      const post = await createPost(user.id, {
        breed: (parsed.breed as BreedEnum | null | undefined) ?? null,
        type: parsed.type as PostTypeEnum,
        tag: parsed.tag as PostTagEnum,
        content_text: parsed.content_text,
        title: parsed.title ?? undefined,
        place_id: attachedPlaceId ?? null,
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
      track('create_post_submitted', {
        type,
        has_image: imageUris.length > 0,
        has_place: attachedPlaceId != null,
        ...(breed ? { breed } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (attachedPlaceId) {
        queryClient.invalidateQueries({ queryKey: ['placePosts', attachedPlaceId] });
      }
      navigation.goBack();
      showToast('Woof! Post created');
      onPostCreated();
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
    const screenResult = screenContent(title, content, locationName);
    if (!screenResult.ok) {
      setError(screenResult.message!);
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        content_text: content,
        type,
        tag: isMeetup ? 'PLAYDATE' : primaryTag,
        breed: isFromPlace ? null : breed,
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

  const isModal = route.name === 'CreatePostModal';

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

  const handlePlacePicker = () => {
    const options = places.map((p) => p.name);
    const actions = [
      ...options.map((name, i) => ({
        text: name,
        onPress: () => {
          const place = places[i];
          setAttachedPlaceId(place.id);
          setAttachedPlaceName(place.name);
        },
      })),
      ...(attachedPlaceId
        ? [{ text: 'Remove place', style: 'destructive' as const, onPress: () => {
            setAttachedPlaceId(null);
            setAttachedPlaceName(null);
          } }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert('Tag a place', 'Associate this post with a known place.', actions);
  };

  if (!user) return null;

  const screenBg = colors.surface;

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
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + 12 },
          isFromPlace ? styles.contentFromPlace : styles.contentModal,
        ]}
      >

        {/* ── Place card (from place feed) OR Breed card (normal flow) ── */}
        {isFromPlace ? (
          <View
            style={styles.breedCard}
            accessibilityLabel={`Place: ${attachedPlaceName}`}
          >
            <View style={styles.breedCardLeft}>
              <View style={styles.breedIconCircle}>
                <Ionicons name="location" size={16} color={colors.surface} />
              </View>
              <View>
                <Text style={styles.breedCardLabel}>Place</Text>
                <Text style={styles.breedCardValue} numberOfLines={1}>{attachedPlaceName}</Text>
              </View>
            </View>
            {placePhoto && (
              <Image source={placePhoto} style={styles.breedDogThumb} resizeMode="cover" />
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.breedCard}
            onPress={handleBreedPicker}
            activeOpacity={hasMultipleBreeds ? 0.75 : 1}
            accessibilityLabel={breed ? `Breed: ${BREED_LABELS[breed]}` : 'Select a breed'}
          >
            <View style={styles.breedCardLeft}>
              <View style={styles.breedIconCircle}>
                <Ionicons name="paw" size={16} color={colors.surface} />
              </View>
              <View>
                <Text style={styles.breedCardLabel}>Breed</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {breed ? (
                    <Text style={styles.breedCardValue}>{BREED_LABELS[breed] ?? breed}</Text>
                  ) : (
                    <Text style={styles.breedCardPlaceholder}>Select a breed</Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
            {breed ? (
              <Image source={BREED_PACK_IMAGES[breed]} style={styles.breedDogThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.breedDogThumb, styles.breedDogThumbPlaceholder]}>
                <Ionicons name="paw" size={22} color={colors.border} />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Type ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Type</Text>
          <Ionicons name="help-circle-outline" size={15} color={colors.textMuted} style={{ marginLeft: 4, marginTop: 1 }} />
        </View>
        <View style={styles.typeChipRow}>
          {TYPE_CHIP_CONFIG.map(({ type: t, icon, label }) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipSelected]}
              onPress={() => {
                setType(t);
                if (t !== type) track('create_post_type_selected', { type: t });
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={icon}
                size={14}
                color={type === t ? colors.surface : colors.textSecondary}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isMeetup && (
          <>
            {/* ── Tags ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Tag</Text>
              <Text style={styles.sectionLabelHint}> (choose up to 2)</Text>
            </View>
            <View style={styles.tagChipWrap}>
              {TAG_CHIP_CONFIG.map(({ tag: t, icon, label }) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChipNew, tags.includes(t) && styles.tagChipNewSelected]}
                  onPress={() => toggleTag(t)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={icon}
                    size={14}
                    color={tags.includes(t) ? colors.surface : colors.textSecondary}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.tagChipNewText, tags.includes(t) && styles.tagChipNewTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Title ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Title</Text>
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Add a short headline"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              <Text style={styles.charCounter}>{title.length}/80</Text>
            </View>

            {/* ── Body ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Body</Text>
            </View>
            <View style={styles.inputWrap}>
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
                maxLength={2000}
              />
              <Text style={[styles.charCounter, styles.charCounterArea]}>{content.length}/2000</Text>
            </View>

            {/* ── Place ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Place</Text>
              <Text style={styles.sectionLabelHint}> (optional)</Text>
            </View>
            <TouchableOpacity style={styles.placeRow} onPress={handlePlacePicker} activeOpacity={0.75}>
              <Ionicons name="location-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.placeRowText, attachedPlaceName != null && styles.placeRowTextSelected]} numberOfLines={1}>
                {attachedPlaceName ?? 'Tag a place'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* ── Images ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Images</Text>
              <Text style={styles.sectionLabelHint}> (optional)</Text>
            </View>
            <View style={styles.imageRow}>
              {imageUris.length < 5 && (
                <TouchableOpacity style={styles.addPhotosButton} onPress={handlePickImages} activeOpacity={0.75}>
                  <Ionicons name="add" size={24} color={colors.textSecondary} />
                  <Text style={styles.addPhotosText}>Add photos</Text>
                </TouchableOpacity>
              )}
              {imageUris.map((img, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.thumbImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeCircle}
                    onPress={() => removeImage(i)}
                    hitSlop={4}
                    accessibilityLabel="Remove photo"
                  >
                    <Ionicons name="close" size={11} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              ))}
              {imageUris.length > 0 && (
                <View style={styles.imageCountBadge}>
                  <Text style={styles.imageCountText}>{imageUris.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.imageCaption}>Up to 5 photos</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* ── Community banner / place submit CTA ── */}
            {isFromPlace ? (
              <>
                <TouchableOpacity style={styles.communityBanner} activeOpacity={0.85}>
                  <View style={styles.communityIconWrap}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.communityTextWrap}>
                    <Text style={styles.communityTitle}>Posting to {attachedPlaceName}</Text>
                    <Text style={styles.communitySubtitle}>Your post will be visible to all {attachedPlaceName} visitors.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submit, mutation.isPending && styles.submitDisabled]}
                  onPress={handleSubmit}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.submitText}>Post</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.communityBanner} activeOpacity={0.85}>
                  <View style={styles.communityIconWrap}>
                    <Ionicons name="paw" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.communityTextWrap}>
                    <Text style={styles.communityTitle}>Posting to the {breed ? BREED_LABELS[breed] : ''} community</Text>
                    <Text style={styles.communitySubtitle}>Your post will be visible to all {breed ? BREED_LABELS[breed] : ''} members.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submit, mutation.isPending && styles.submitDisabled]}
                  onPress={handleSubmit}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.submitText}>Post</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {isMeetup && (
          <>
            <Text style={styles.sectionLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Golden Retriever playdate at the park"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <Text style={styles.sectionLabel}>Body</Text>
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
            <Text style={styles.sectionLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Central Park Dog Run"
              placeholderTextColor={colors.textMuted}
              value={locationName}
              onChangeText={setLocationName}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Place</Text>
              <Text style={styles.sectionLabelHint}> (optional)</Text>
            </View>
            <TouchableOpacity
              style={styles.placeRow}
              onPress={() => {
                const options = places.map((p) => p.name);
                const actions = [
                  ...options.map((name, i) => ({
                    text: name,
                    onPress: () => {
                      const place = places[i];
                      setLinkedPlaceId(place.id);
                      setLinkedPlaceName(place.name);
                      setAttachedPlaceId(place.id);
                      setAttachedPlaceName(place.name);
                      if (!locationName.trim()) setLocationName(place.name);
                    },
                  })),
                  ...(linkedPlaceId
                    ? [{ text: 'Remove place', style: 'destructive' as const, onPress: () => {
                        setLinkedPlaceId(null);
                        setLinkedPlaceName(null);
                        setAttachedPlaceId(null);
                        setAttachedPlaceName(null);
                      } }]
                    : []),
                  { text: 'Cancel', style: 'cancel' as const },
                ];
                Alert.alert('Link a place', 'Associate this meetup with a known place.', actions);
              }}
            >
              <Ionicons name="location-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.placeRowText, linkedPlaceName != null && styles.placeRowTextSelected]} numberOfLines={1}>
                {linkedPlaceName ?? 'Link to a place'}
              </Text>
              {linkedPlaceName && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Date & Time</Text>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>End Time</Text>
              <Text style={styles.sectionLabelHint}> (optional)</Text>
            </View>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Kind</Text>
              <Text style={styles.sectionLabelHint}> (optional)</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScroll}
              contentContainerStyle={styles.tagScrollContent}
            >
              {(['playdate', 'walk', 'beach', 'training', 'other'] as MeetupKind[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.tagChipOld, meetupKind === k && styles.tagChipOldSelected]}
                  onPress={() => setMeetupKind(meetupKind === k ? '' : k)}
                >
                  <Text style={[styles.chipText, meetupKind === k && styles.chipTextSelected]}>
                    {MEETUP_KIND_LABELS[k]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Spots available</Text>
              <Text style={styles.sectionLabelHint}> (optional)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={spotsAvailable}
              onChangeText={setSpotsAvailable}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* ── Community banner (only shown once a breed is selected) ── */}
            {breed ? (
              <TouchableOpacity style={styles.communityBanner} activeOpacity={0.85}>
                <View style={styles.communityIconWrap}>
                  <Ionicons name="paw" size={20} color={colors.primary} />
                </View>
                <View style={styles.communityTextWrap}>
                  <Text style={styles.communityTitle}>Posting to the {BREED_LABELS[breed]} community</Text>
                  <Text style={styles.communitySubtitle}>Your post will be visible to all {BREED_LABELS[breed]} members.</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.submit, mutation.isPending && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitText}>Create Meetup</Text>
              )}
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  contentModal: { paddingBottom: 48 },
  contentFromPlace: { paddingBottom: 120 },

  // ── Header buttons ──────────────────────────────────────────────
  headerCloseButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerPostButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPostButtonDisabled: { opacity: 0.65 },
  headerPostButtonText: { ...interByWeight('600'), color: colors.surface, fontSize: 15 },

  // ── Section headers ──────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', marginTop: 20, marginBottom: 10 },
  sectionLabel: { ...interByWeight('600'), fontSize: 14, color: colors.textPrimary },
  sectionLabelHint: { ...interByWeight('400'), fontSize: 13, color: colors.textMuted },

  // ── Breed card ──────────────────────────────────────────────────
  breedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    ...shadow.sm,
  },
  breedCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  breedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breedCardLabel: { ...interByWeight('400'), fontSize: 12, color: colors.textMuted },
  breedCardValue: { ...interByWeight('600'), fontSize: 15, color: colors.primary, marginTop: 1 },
  breedCardPlaceholder: { ...interByWeight('400'), fontSize: 15, color: colors.textMuted, marginTop: 1 },
  breedDogThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  breedDogThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  // ── Type chips ──────────────────────────────────────────────────
  typeChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { ...interByWeight('400'), fontSize: 13, color: colors.textPrimary },
  typeChipTextSelected: { ...interByWeight('600'), color: colors.surface },

  // ── Tag chips ───────────────────────────────────────────────────
  tagChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChipNew: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipNewSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagChipNewText: { ...interByWeight('400'), fontSize: 13, color: colors.textPrimary },
  tagChipNewTextSelected: { ...interByWeight('600'), color: colors.surface },

  // ── Inputs ──────────────────────────────────────────────────────
  inputWrap: { position: 'relative' },
  input: {
    ...interByWeight('400'),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    paddingBottom: 28,
    fontSize: 15,
    minHeight: 44,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 120, paddingBottom: 28 },
  charCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    ...interByWeight('400'),
    fontSize: 12,
    color: colors.textMuted,
  },
  charCounterArea: { bottom: 8 },

  // ── Place row ───────────────────────────────────────────────────
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: colors.surfaceMuted,
  },
  placeRowText: { ...interByWeight('400'), fontSize: 15, color: colors.textMuted, flex: 1 },
  placeRowTextSelected: { color: colors.textPrimary },

  // ── Images ──────────────────────────────────────────────────────
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  addPhotosButton: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotosText: { ...interByWeight('400'), fontSize: 12, color: colors.textSecondary },
  thumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'visible',
    position: 'relative',
    ...shadow.sm,
  },
  thumbImage: { width: 80, height: 80, borderRadius: 10 },
  removeCircle: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  imageCountBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCountText: { ...interByWeight('600'), fontSize: 14, color: colors.textSecondary },
  imageCaption: { ...interByWeight('400'), fontSize: 12, color: colors.textMuted, marginTop: 6 },

  // ── Community banner ─────────────────────────────────────────────
  communityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 24,
    gap: 12,
  },
  communityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityTextWrap: { flex: 1 },
  communityTitle: { ...interByWeight('600'), fontSize: 14, color: colors.textPrimary },
  communitySubtitle: { ...interByWeight('400'), fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  communityBannerCta: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadow.sm,
  },
  communityBannerCtaDisabled: { opacity: 0.65 },

  // ── Meetup-specific (legacy tag scroll) ──────────────────────────
  tagScroll: { marginBottom: 4, maxHeight: 44, marginHorizontal: -spacing.lg },
  tagScrollContent: { paddingLeft: spacing.lg, paddingRight: 0 },
  tagChipOld: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    marginRight: spacing.xxs,
  },
  tagChipOldSelected: { backgroundColor: colors.primary },
  chipText: { ...interByWeight('400'), fontSize: 13, color: colors.textPrimary },
  chipTextSelected: { ...interByWeight('600'), color: colors.surface },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
    ...shadow.sm,
    marginBottom: 8,
  },
  dateButtonText: { ...interByWeight('400'), fontSize: 15, color: colors.textPrimary },

  // ── Error ────────────────────────────────────────────────────────
  error: { ...interByWeight('400'), color: colors.danger, marginTop: 12, fontSize: 14 },

  // ── Bottom submit (pushed screen only) ───────────────────────────
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
