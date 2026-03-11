import React, { useState, useEffect } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createDog, updateDog, getDogById } from '@/api/dogs';
import { uploadDogImage, pickImages } from '@/lib/imageUpload';
import { useAuthStore } from '@/store/authStore';
import { dogSchema } from '@/utils/validation';
import {
  BREEDS,
  BREED_LABELS,
  AGE_GROUPS,
  AGE_GROUP_LABELS,
  ENERGY_LEVELS,
  ENERGY_LEVEL_LABELS,
} from '@/utils/breed';
import type { BreedEnum, AgeGroupEnum, EnergyLevelEnum } from '@/types';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { shadow } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

export function EditDogScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ProfileStackParamList, 'EditDog'>>();
  const dogId = route.params?.dogId;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const headerHeight = useStackHeaderHeight();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState<BreedEnum>('GOLDEN_RETRIEVER');
  const [ageGroup, setAgeGroup] = useState<AgeGroupEnum>('ADULT');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevelEnum>('MED');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState('');

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
      setImageUri(existingDog.dog_image_url);
    } else if (!dogId) {
      setName('');
      setBreed('GOLDEN_RETRIEVER');
      setAgeGroup('ADULT');
      setEnergyLevel('MED');
      setImageUri(null);
      setImageBase64(null);
    }
  }, [existingDog, dogId]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const parsed = dogSchema.parse({ name, breed, age_group: ageGroup, energy_level: energyLevel });

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
          dog_image_url: dogImageUrl,
        });
      } else {
        const dog = await createDog(user.id, {
          name: parsed.name,
          breed: parsed.breed as BreedEnum,
          age_group: parsed.age_group,
          energy_level: parsed.energy_level,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dog', user?.id] });
      navigation.goBack();
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
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    mutation.mutate();
  };

  if (!user) return null;

  return (
    <ScreenWithWallpaper>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
      <Text style={styles.label}>Dog photo</Text>
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
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Breed</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
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
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.sm,
  },
  dogImage: { width: 120, height: 120 },
  imagePlaceholder: { fontSize: 14, color: '#6b7280' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    ...shadow.sm,
  },
  chipScroll: { marginBottom: 8, maxHeight: 44 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
  },
  chipSelected: { backgroundColor: '#3b82f6' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextSelected: { color: '#FFF' },
  error: { color: '#ef4444', marginTop: 12, fontSize: 14 },
  submit: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    ...shadow.sm,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
