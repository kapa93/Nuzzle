import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getProfile, updateProfile } from '@/api/auth';
import { getDogsByOwner, deleteDog } from '@/api/dogs';
import { signOut } from '@/api/auth';
import { uploadProfileImage, pickImages } from '@/lib/imageUpload';
import { DogAvatar } from '@/components/DogAvatar';
import { BREED_LABELS } from '@/utils/breed';
import { AGE_GROUP_LABELS, ENERGY_LEVEL_LABELS } from '@/utils/breed';
import type { ProfileStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen({ navigation }: { navigation: ProfileNav }) {
  const { user, signOut: clearSession } = useAuthStore();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });

  const { data: dogs } = useQuery({
    queryKey: ['dogs', userId],
    queryFn: () => getDogsByOwner(userId),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (dogId: string) => deleteDog(dogId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs', userId] });
      queryClient.invalidateQueries({ queryKey: ['dog', userId] });
    },
  });

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          clearSession();
        },
      },
    ]);
  };

  const handleDeleteDog = (dogName: string, dogId: string) => {
    Alert.alert('Remove dog', `Remove ${dogName} from your profile?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(dogId),
      },
    ]);
  };

  const photoMutation = useMutation({
    mutationFn: async (base64Data: string) => {
      const url = await uploadProfileImage(userId, base64Data);
      return updateProfile(userId, { profile_image_url: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const handleChangePhoto = async () => {
    try {
      const picked = await pickImages(1);
      if (picked[0]?.base64) {
        photoMutation.mutate(picked[0].base64);
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const primaryDog = dogs?.[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleChangePhoto}
          disabled={photoMutation.isPending}
          style={styles.avatarTouchable}
          activeOpacity={0.7}
        >
          <View style={styles.avatarWrapper}>
            <DogAvatar
              imageUrl={profile?.profile_image_url ?? primaryDog?.dog_image_url}
              name={profile?.name ?? primaryDog?.name}
              size={80}
            />
            {photoMutation.isPending ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#FFF" size="small" />
              </View>
            ) : (
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{profile?.name ?? 'User'}</Text>
        {profile?.city ? (
          <Text style={styles.city}>{profile.city}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Dogs</Text>
        {dogs && dogs.length > 0 ? (
          dogs.map((dog) => (
            <View key={dog.id} style={styles.dogCard}>
              <View style={styles.dogCardLeft}>
                <DogAvatar
                  imageUrl={dog.dog_image_url}
                  name={dog.name}
                  size={48}
                />
                <View style={styles.dogCardInfo}>
                  <Text style={styles.dogName}>{dog.name}</Text>
                  <Text style={styles.dogMeta}>{BREED_LABELS[dog.breed]}</Text>
                  <Text style={styles.dogMeta}>
                    {AGE_GROUP_LABELS[dog.age_group]} · {ENERGY_LEVEL_LABELS[dog.energy_level]}
                  </Text>
                </View>
              </View>
              <View style={styles.dogCardActions}>
                <TouchableOpacity
                  style={styles.dogActionBtn}
                  onPress={() => navigation.navigate('EditDog', { dogId: dog.id })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dogActionBtn}
                  onPress={() => handleDeleteDog(dog.name, dog.id)}
                  disabled={deleteMutation.isPending}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDogs}>No dogs added yet</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.btnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('EditDog')}
      >
        <Text style={styles.btnText}>Add Dog</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.signOutBtn]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarTouchable: {
    alignSelf: 'center',
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
  },
  city: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  email: {
    fontSize: 15,
    color: '#374151',
  },
  dogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dogCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dogCardInfo: {
    marginLeft: 12,
  },
  dogName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dogMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  dogCardActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dogActionBtn: {
    padding: 6,
  },
  noDogs: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  btn: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  signOutBtn: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  avatarTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
