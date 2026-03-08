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
import { useNavigation } from '@react-navigation/native';
import { updateProfile, getProfile } from '@/api/auth';
import { uploadProfileImage, pickImages } from '@/lib/imageUpload';
import { useAuthStore } from '@/store/authStore';
import { profileSchema } from '@/utils/validation';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCity(profile.city ?? '');
      setImageUri(profile.profile_image_url ?? null);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      let profileImageUrl = profile?.profile_image_url ?? null;
      if (imageBase64) {
        profileImageUrl = await uploadProfileImage(user!.id, imageBase64);
      }
      return updateProfile(user!.id, {
        name,
        city: city || null,
        profile_image_url: profileImageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      navigation.goBack();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = () => {
    setError('');
    const parsed = profileSchema.safeParse({ name, city: city || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    mutation.mutate();
  };

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

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Profile photo</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} resizeMode="cover" />
        ) : (
          <Text style={styles.imagePlaceholder}>+ Add photo</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <Text style={styles.label}>City (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="City"
        placeholderTextColor="#9ca3af"
        value={city}
        onChangeText={setCity}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  profileImage: { width: 100, height: 100 },
  imagePlaceholder: { fontSize: 14, color: '#6b7280' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
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
