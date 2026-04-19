import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/api/auth';
import { getDogById, getDogsByOwner } from '@/api/dogs';
import { DogsMetSection } from '@/components/DogsMetSection';
import { MetThisDogButton } from '@/components/MetThisDogButton';
import { ProfileDogCard } from '@/components/ProfileDogCard';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type Props = {
  route: { params: { dogId: string } };
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
};

export function DogProfileScreen({ route, navigation }: Props) {
  const headerHeight = useStackHeaderHeight();
  const viewerUserId = useAuthStore((state) => state.user?.id ?? null);

  const dogQuery = useQuery({
    queryKey: ['dog', route.params.dogId],
    queryFn: () => getDogById(route.params.dogId),
    enabled: !!route.params.dogId,
  });

  const dog = dogQuery.data ?? null;

  const ownerQuery = useQuery({
    queryKey: ['profile', dog?.owner_id],
    queryFn: () => getProfile(dog!.owner_id),
    enabled: !!dog?.owner_id,
  });

  const viewerDogsQuery = useQuery({
    queryKey: ['dogs', viewerUserId ?? null],
    queryFn: () => getDogsByOwner(viewerUserId!),
    enabled: !!viewerUserId,
  });

  if (dogQuery.isLoading) {
    return (
      <ScreenWithWallpaper>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading dog profile...</Text>
        </View>
      </ScreenWithWallpaper>
    );
  }

  if (dogQuery.error || !dog) {
    return (
      <ScreenWithWallpaper>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Dog not found</Text>
          <Text style={styles.stateText}>This dog profile isn&apos;t available right now.</Text>
        </View>
      </ScreenWithWallpaper>
    );
  }

  const owner = ownerQuery.data ?? null;

  return (
    <ScreenWithWallpaper>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.contentContainer, { paddingTop: headerHeight + 15 }]}
          showsVerticalScrollIndicator={false}
        >
          <ProfileDogCard
            dog={dog}
            headerAction={
              <MetThisDogButton
                viewerUserId={viewerUserId}
                viewerDogs={viewerDogsQuery.data ?? []}
                targetDog={dog}
              />
            }
          />

          {owner ? (
            <View style={styles.ownerCard}>
              <Text style={styles.ownerLabel}>Belongs to</Text>
              <Pressable onPress={() => navigation.navigate('UserProfile', { userId: owner.id })}>
                <Text style={styles.ownerName}>{owner.name}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <DogsMetSection
              dogId={dog.id}
              title="Friends"
              onOpenDogProfile={(dogId) => navigation.navigate('DogProfile', { dogId })}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  stateTitle: {
    ...typography.titleMD,
    textAlign: 'center',
  },
  stateText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  ownerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.sm,
  },
  ownerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ownerName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
});
