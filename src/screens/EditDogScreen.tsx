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
  Image,
  Keyboard,
  Platform,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createDog, updateDog, getDogById } from '@/api/dogs';
import { joinBreedFeed } from '@/api/breedJoins';
import { uploadDogImage, pickImages } from '@/lib/imageUpload';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { dogSchema } from '@/utils/validation';
import {
  BREEDS,
  BREED_LABELS,
  AGE_GROUPS,
  AGE_GROUP_LABELS,
  COMPATIBILITY_ANSWERS,
  COMPATIBILITY_ANSWER_LABELS,
  ENERGY_LEVELS,
  ENERGY_LEVEL_LABELS,
  PLAY_STYLES,
  PLAY_STYLE_LABELS,
} from '@/utils/breed';
import type {
  BreedEnum,
  AgeGroupEnum,
  EnergyLevelEnum,
  CompatibilityAnswerEnum,
  PlayStyleEnum,
} from '@/types';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, shadow } from '@/theme';
import type { ProfileStackParamList, OnboardingStackParamList } from '@/navigation/types';

export function EditDogScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ProfileStackParamList | OnboardingStackParamList, 'EditDog'>>();
  const dogId = route.params?.dogId;
  const fromOnboarding = route.params?.fromOnboarding ?? false;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const headerHeight = useStackHeaderHeight();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState<BreedEnum>('GOLDEN_RETRIEVER');
  const [ageGroup, setAgeGroup] = useState<AgeGroupEnum>('ADULT');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevelEnum>('MED');
  const [dogFriendliness, setDogFriendliness] = useState<number | null>(null);
  const [playStyle, setPlayStyle] = useState<PlayStyleEnum | null>(null);
  const [goodWithPuppies, setGoodWithPuppies] = useState<CompatibilityAnswerEnum | null>(null);
  const [goodWithLargeDogs, setGoodWithLargeDogs] = useState<CompatibilityAnswerEnum | null>(null);
  const [goodWithSmallDogs, setGoodWithSmallDogs] = useState<CompatibilityAnswerEnum | null>(null);
  const [temperamentNotes, setTemperamentNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState('');
  const scrollViewRef = useRef<ScrollView | null>(null);
  const shouldScrollToNotesRef = useRef(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { data: existingDog } = useQuery({
    queryKey: ['dog', dogId],
    queryFn: () => getDogById(dogId!),
    enabled: !!dogId,
  });

  useEffect(() => {
    if (existingDog) {
      setName(existingDog.name);
      setBreed(existingDog.breed);
      setAgeGroup(existingDog.age_group);
      setEnergyLevel(existingDog.energy_level);
      setDogFriendliness(existingDog.dog_friendliness);
      setPlayStyle(existingDog.play_style);
      setGoodWithPuppies(existingDog.good_with_puppies);
      setGoodWithLargeDogs(existingDog.good_with_large_dogs);
      setGoodWithSmallDogs(existingDog.good_with_small_dogs);
      setTemperamentNotes(existingDog.temperament_notes ?? '');
      setImageUri(existingDog.dog_image_url);
    } else if (!dogId) {
      setName('');
      setBreed('GOLDEN_RETRIEVER');
      setAgeGroup('ADULT');
      setEnergyLevel('MED');
      setDogFriendliness(null);
      setPlayStyle(null);
      setGoodWithPuppies(null);
      setGoodWithLargeDogs(null);
      setGoodWithSmallDogs(null);
      setTemperamentNotes('');
      setImageUri(null);
      setImageBase64(null);
    }
  }, [existingDog, dogId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      if (shouldScrollToNotesRef.current) {
        requestAnimationFrame(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
          shouldScrollToNotesRef.current = false;
        });
      }
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      shouldScrollToNotesRef.current = false;
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const trimmedNotes = temperamentNotes.trim();
      const parsed = dogSchema.parse({
        name,
        breed,
        age_group: ageGroup,
        energy_level: energyLevel,
        dog_friendliness: dogFriendliness,
        play_style: playStyle,
        good_with_puppies: goodWithPuppies,
        good_with_large_dogs: goodWithLargeDogs,
        good_with_small_dogs: goodWithSmallDogs,
        temperament_notes: trimmedNotes || null,
      });

      if (existingDog) {
        let dogImageUrl = existingDog.dog_image_url;
        if (imageBase64) {
          dogImageUrl = await uploadDogImage(user.id, existingDog.id, imageBase64);
        }
        return updateDog(existingDog.id, user.id, {
          name: parsed.name,
          breed: parsed.breed as BreedEnum,
          age_group: parsed.age_group,
          energy_level: parsed.energy_level,
          dog_friendliness: parsed.dog_friendliness ?? null,
          play_style: parsed.play_style ?? null,
          good_with_puppies: parsed.good_with_puppies ?? null,
          good_with_large_dogs: parsed.good_with_large_dogs ?? null,
          good_with_small_dogs: parsed.good_with_small_dogs ?? null,
          temperament_notes: parsed.temperament_notes ?? null,
          dog_image_url: dogImageUrl,
        });
      } else {
        const dog = await createDog(user.id, {
          name: parsed.name,
          breed: parsed.breed as BreedEnum,
          age_group: parsed.age_group,
          energy_level: parsed.energy_level,
          dog_friendliness: parsed.dog_friendliness ?? null,
          play_style: parsed.play_style ?? null,
          good_with_puppies: parsed.good_with_puppies ?? null,
          good_with_large_dogs: parsed.good_with_large_dogs ?? null,
          good_with_small_dogs: parsed.good_with_small_dogs ?? null,
          temperament_notes: parsed.temperament_notes ?? null,
          dog_image_url: null,
        });
        if (imageBase64) {
          const url = await uploadDogImage(user.id, dog.id, imageBase64);
          await updateDog(dog.id, user.id, { dog_image_url: url });
          return { ...dog, dog_image_url: url };
        }
        return dog;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['dogs', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dog', user?.id] });
      if (fromOnboarding) {
        if (user) {
          await joinBreedFeed(user.id, breed as BreedEnum).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ['joinedBreeds', user.id] });
        }
        useOnboardingStore.getState().completeOnboarding(name, breed);
      } else {
        if (!existingDog && user) {
          await joinBreedFeed(user.id, breed as BreedEnum).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ['joinedBreeds', user.id] });
        }
        navigation.goBack();
      }
    },
    onError: (err: Error) => setError(err.message),
  });

  const handlePickImage = async () => {
    try {
      const picked = await pickImages(1);
      if (picked[0]) {
        setImageUri(picked[0].uri);
        setImageBase64(picked[0].base64 ?? null);
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleSubmit = () => {
    setError('');
    const parsed = dogSchema.safeParse({
      name,
      breed,
      age_group: ageGroup,
      energy_level: energyLevel,
      dog_friendliness: dogFriendliness,
      play_style: playStyle,
      good_with_puppies: goodWithPuppies,
      good_with_large_dogs: goodWithLargeDogs,
      good_with_small_dogs: goodWithSmallDogs,
      temperament_notes: temperamentNotes.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    mutation.mutate();
  };

  const handleTemperamentFocus = () => {
    // Try immediately so it feels responsive; keyboard event will do a second nudge if needed.
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    // If keyboard is already open, scroll immediately; otherwise defer until it opens.
    if (isKeyboardVisible) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
      return;
    }
    shouldScrollToNotesRef.current = true;
  };

  if (!user) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + 20,
            paddingBottom: insets.bottom + (isKeyboardVisible ? -15 : 59),
          },
        ]}
      >
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.dogImage} resizeMode="cover" />
        ) : (
          <Text style={styles.imagePlaceholder}>+ Add photo</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Dog's name"
        placeholderTextColor={colors.textMuted}        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Breed</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {BREEDS.map((b) => (
          <TouchableOpacity
            key={b}
            style={[styles.chip, breed === b && styles.chipSelected]}
            onPress={() => setBreed(b)}
          >
            <Text style={[styles.chipText, breed === b && styles.chipTextSelected]}>
              {BREED_LABELS[b]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Age group</Text>
      <View style={styles.chipRow}>
        {AGE_GROUPS.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.chip, ageGroup === a && styles.chipSelected]}
            onPress={() => setAgeGroup(a)}
          >
            <Text style={[styles.chipText, ageGroup === a && styles.chipTextSelected]}>
              {AGE_GROUP_LABELS[a]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Energy level</Text>
      <View style={styles.chipRow}>
        {ENERGY_LEVELS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.chip, energyLevel === e && styles.chipSelected]}
            onPress={() => setEnergyLevel(e)}
          >
            <Text style={[styles.chipText, energyLevel === e && styles.chipTextSelected]}>
              {ENERGY_LEVEL_LABELS[e]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Play & Personality</Text>
      <Text style={styles.helperText}>
        Optional details that help others choose good meetup and playdate matches.
      </Text>

      <Text style={styles.label}>Dog friendliness (1-5)</Text>
      <View style={styles.chipRow}>
        {[1, 2, 3, 4, 5].map((score) => (
          <TouchableOpacity
            key={score}
            style={[styles.chip, dogFriendliness === score && styles.chipSelected]}
            onPress={() => setDogFriendliness(dogFriendliness === score ? null : score)}
          >
            <Text style={[styles.chipText, dogFriendliness === score && styles.chipTextSelected]}>
              {score}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Play style</Text>
      <View style={styles.chipRow}>
        {PLAY_STYLES.map((style) => (
          <TouchableOpacity
            key={style}
            style={[styles.chip, playStyle === style && styles.chipSelected]}
            onPress={() => setPlayStyle(playStyle === style ? null : style)}
          >
            <Text style={[styles.chipText, playStyle === style && styles.chipTextSelected]}>
              {PLAY_STYLE_LABELS[style]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Good with puppies?</Text>
      <View style={styles.chipRow}>
        {COMPATIBILITY_ANSWERS.map((answer) => (
          <TouchableOpacity
            key={answer}
            style={[styles.chip, goodWithPuppies === answer && styles.chipSelected]}
            onPress={() => setGoodWithPuppies(goodWithPuppies === answer ? null : answer)}
          >
            <Text style={[styles.chipText, goodWithPuppies === answer && styles.chipTextSelected]}>
              {COMPATIBILITY_ANSWER_LABELS[answer]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Good with large dogs?</Text>
      <View style={styles.chipRow}>
        {COMPATIBILITY_ANSWERS.map((answer) => (
          <TouchableOpacity
            key={answer}
            style={[styles.chip, goodWithLargeDogs === answer && styles.chipSelected]}
            onPress={() => setGoodWithLargeDogs(goodWithLargeDogs === answer ? null : answer)}
          >
            <Text style={[styles.chipText, goodWithLargeDogs === answer && styles.chipTextSelected]}>
              {COMPATIBILITY_ANSWER_LABELS[answer]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Good with small dogs?</Text>
      <View style={styles.chipRow}>
        {COMPATIBILITY_ANSWERS.map((answer) => (
          <TouchableOpacity
            key={answer}
            style={[styles.chip, goodWithSmallDogs === answer && styles.chipSelected]}
            onPress={() => setGoodWithSmallDogs(goodWithSmallDogs === answer ? null : answer)}
          >
            <Text style={[styles.chipText, goodWithSmallDogs === answer && styles.chipTextSelected]}>
              {COMPATIBILITY_ANSWER_LABELS[answer]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Temperament notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Anything useful for playdates? (e.g. needs slow intros)"
        placeholderTextColor={colors.textMuted}        value={temperamentNotes}
        onChangeText={setTemperamentNotes}
        onFocus={handleTemperamentFocus}
        multiline
        maxLength={240}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 24, marginBottom: 4 },
  helperText: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginTop: 16 },
  imagePicker: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderRadius: 60,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.sm,
  },
  dogImage: { width: 120, height: 120 },
  imagePlaceholder: { fontSize: 14, color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  notesInput: { minHeight: 84, textAlignVertical: 'top' },
  chipScroll: { marginBottom: 8, maxHeight: 44 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.border,
    borderRadius: 20,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, color: colors.textPrimary },
  chipTextSelected: { color: colors.surface },
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
