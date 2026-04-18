import React from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut, updateProfile } from '@/api/auth';
import { deleteDog } from '@/api/dogs';
import { UserProfileContent } from '@/components/UserProfileContent';
import { pickImages, uploadProfileImage } from '@/lib/imageUpload';
import type { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen({ navigation }: { navigation: ProfileNav }) {
  const { user, signOut: clearSession } = useAuthStore();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (dogId: string) => deleteDog(dogId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
    },
  });

  const photoMutation = useMutation({
    mutationFn: async (base64Data: string) => {
      const url = await uploadProfileImage(userId, base64Data);
      return updateProfile(userId, { profile_image_url: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (!userId) return null;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } finally {
            clearSession();
          }
        },
      },
    ]);
  };

  const handleDeleteDog = (dogId: string, dogName: string) => {
    Alert.alert('Remove dog', `Remove ${dogName} from your profile?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(dogId),
      },
    ]);
  };

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

  return (
    <UserProfileContent
      profileUserId={userId}
      viewerUserId={userId}
      showPrivateAccountInfo
      onOpenPost={(postId) => navigation.navigate('PostDetail', { postId })}
      onOpenDogProfile={(dogId) => navigation.navigate('DogProfile', { dogId })}
      onEditProfile={() => navigation.navigate('EditProfile')}
      onAddDog={() => navigation.navigate('EditDog', {})}
      onEditDog={(dogId) => navigation.navigate('EditDog', { dogId })}
      onDeleteDog={handleDeleteDog}
      onChangePhoto={handleChangePhoto}
      onSignOut={handleSignOut}
      isPhotoUpdating={photoMutation.isPending}
    />
  );
}
