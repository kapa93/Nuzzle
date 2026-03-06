import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getProfile } from '@/api/auth';
import { getDogByOwner } from '@/api/dogs';
import { signOut } from '@/api/auth';
import { DogAvatar } from '@/components/DogAvatar';
import { BREED_LABELS } from '@/types';
import { AGE_GROUP_LABELS, ENERGY_LEVEL_LABELS } from '@/utils/breed';

export function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, signOut: clearSession } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });

  const { data: dog } = useQuery({
    queryKey: ['dog', userId],
    queryFn: () => getDogByOwner(userId),
    enabled: !!userId,
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <DogAvatar
          imageUrl={dog?.dog_image_url}
          name={dog?.name ?? profile?.name}
          size={80}
        />
        <Text style={styles.name}>{profile?.name ?? 'User'}</Text>
        {profile?.city ? (
          <Text style={styles.city}>{profile.city}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {dog ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Dog</Text>
          <Text style={styles.dogName}>{dog.name}</Text>
          <Text style={styles.dogMeta}>
            {BREED_LABELS[dog.breed]} · {AGE_GROUP_LABELS[dog.age_group]} ·{' '}
            {ENERGY_LEVEL_LABELS[dog.energy_level]}
          </Text>
        </View>
      ) : null}

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
        <Text style={styles.btnText}>{dog ? 'Edit Dog' : 'Add Dog'}</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  email: {
    fontSize: 15,
    color: '#374151',
  },
  dogName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dogMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
});
