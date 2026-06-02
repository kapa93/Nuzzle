import React, { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View, Text } from 'react-native';
import { Settings } from 'lucide-react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut, updateProfile } from '@/api/auth';
import { deleteDog } from '@/api/dogs';
import { UserProfileContent } from '@/components/UserProfileContent';
import { pickImages, uploadProfileImage } from '@/lib/imageUpload';
import type { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { colors, spacing, typography } from '@/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen({ navigation }: { navigation: ProfileNav }) {
  const { user, signOut: clearSession } = useAuthStore();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <NotificationBell />,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={12}
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
        >
          <Settings size={24} color={"#000000"} strokeWidth={2.25} />
        </Pressable>
      ),
    });
  }, [navigation]);

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

  const { showGuestPrompt } = useUIStore();

  if (!userId) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestTitle}>Your profile</Text>
        <Text style={styles.guestBody}>
          Create an account to build your profile, add your dog, and connect with other dog owners.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.guestSignUpBtn, pressed && styles.guestSignUpBtnPressed]}
          onPress={showGuestPrompt}
        >
          <Text style={styles.guestSignUpText}>Sign Up</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.guestLogInBtn, pressed && styles.guestLogInBtnPressed]}
          onPress={() => {
            useAuthStore.getState().setIsGuest(false);
          }}
        >
          <Text style={styles.guestLogInText}>Log In</Text>
        </Pressable>
      </View>
    );
  }

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
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'relative',
    bottom: 1,
    right: 4,
    transform: [{ translateX: 1 }],
  },
  headerButtonPressed: { opacity: 0.7 },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  guestTitle: {
    ...typography.titleMD,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  guestBody: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  guestSignUpBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  guestSignUpBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  guestSignUpText: {
    ...typography.body,
    color: colors.surface,
  },
  guestLogInBtn: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  guestLogInBtnPressed: {
    backgroundColor: colors.border,
  },
  guestLogInText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
