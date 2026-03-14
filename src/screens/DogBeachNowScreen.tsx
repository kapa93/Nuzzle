import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DogAvatar } from '@/components/DogAvatar';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { getDogsByOwner } from '@/api/dogs';
import {
  createDogBeachCheckin,
  endDogBeachCheckin,
  getActiveDogBeachCheckins,
  getDogBeachBreedCounts,
  getMyActiveDogBeachCheckin,
} from '@/api/locationCheckins';
import { useAuthStore } from '@/store/authStore';
import { BREED_LABELS, formatRelativeTime, PLAY_STYLE_LABELS } from '@/utils/breed';
import { colors, radius, shadow, spacing, typography } from '@/theme';

export function DogBeachNowScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const headerHeight = useStackHeaderHeight();

  const { data: dogs = [] } = useQuery({
    queryKey: ['dogs', user?.id],
    queryFn: () => getDogsByOwner(user!.id),
    enabled: !!user?.id,
  });

  const { data: activeCheckins = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['dogBeachActiveCheckins'],
    queryFn: getActiveDogBeachCheckins,
    refetchInterval: 60_000,
  });

  const { data: myActiveCheckin } = useQuery({
    queryKey: ['dogBeachMyCheckin', user?.id],
    queryFn: () => getMyActiveDogBeachCheckin(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (dogId: string) => createDogBeachCheckin(user!.id, dogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogBeachActiveCheckins'] });
      queryClient.invalidateQueries({ queryKey: ['dogBeachMyCheckin', user?.id] });
    },
    onError: () => {
      Alert.alert('Could not check in', 'Please try again in a moment.');
    },
  });

  const endMutation = useMutation({
    mutationFn: (checkinId: string) => endDogBeachCheckin(checkinId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogBeachActiveCheckins'] });
      queryClient.invalidateQueries({ queryKey: ['dogBeachMyCheckin', user?.id] });
    },
    onError: () => {
      Alert.alert('Could not end check-in', 'Please try again in a moment.');
    },
  });

  const breedCounts = useMemo(() => getDogBeachBreedCounts(activeCheckins), [activeCheckins]);

  const handleCheckIn = () => {
    if (dogs.length === 0) {
      Alert.alert('No dog profile', 'Add a dog profile before checking in.');
      return;
    }
    if (dogs.length === 1) {
      createMutation.mutate(dogs[0].id);
      return;
    }

    Alert.alert(
      'Choose a dog',
      'Which dog is at the beach right now?',
      [
        ...dogs.map((dog) => ({
          text: dog.name,
          onPress: () => createMutation.mutate(dog.id),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleEndCheckin = () => {
    if (!myActiveCheckin) return;
    endMutation.mutate(myActiveCheckin.id);
  };

  return (
    <ScreenWithWallpaper>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <View style={[styles.container, { paddingTop: headerHeight + 15 }]}>
          <View style={styles.headerCard}>
            <Text style={styles.title}>Dogs at Dog Beach right now</Text>
            <Text style={styles.subtitle}>{activeCheckins.length} active check-ins</Text>
            {breedCounts.length > 0 ? (
              <Text style={styles.breedSummary}>
                {breedCounts
                  .slice(0, 3)
                  .map((item) => `${item.count} ${BREED_LABELS[item.breed]}${item.count > 1 ? 's' : ''}`)
                  .join(' • ')}
              </Text>
            ) : null}
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Your status</Text>
            {myActiveCheckin ? (
              <>
                <Text style={styles.statusText}>You are currently checked in.</Text>
                <Pressable
                  onPress={handleEndCheckin}
                  style={({ pressed }) => [styles.endBtn, pressed && styles.pressed, endMutation.isPending && styles.disabledBtn]}
                >
                  <Text style={styles.endBtnText}>End Check-In</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.statusText}>You are not currently checked in.</Text>
                <Pressable
                  onPress={createMutation.isPending ? undefined : handleCheckIn}
                  style={({ pressed }) => [styles.checkinBtn, pressed && styles.pressed, createMutation.isPending && styles.disabledBtn]}
                >
                  <Text style={styles.checkinBtnText}>Check In</Text>
                </Pressable>
              </>
            )}
          </View>

          {isLoading ? (
            <View style={styles.centered}>
              <Text style={styles.helperText}>Loading check-ins...</Text>
            </View>
          ) : isError ? (
            <View style={styles.centered}>
              <Text style={styles.helperText}>Could not load Dog Beach check-ins.</Text>
              <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : activeCheckins.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.helperText}>No dogs checked in right now.</Text>
            </View>
          ) : (
            <FlatList
              data={activeCheckins}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <DogAvatar imageUrl={item.dog_image_url} name={item.dog_name} size={44} />
                  <View style={styles.rowText}>
                    <View style={styles.nameRow}>
                      <Text style={styles.dogName}>{item.dog_name}</Text>
                      {item.dog_play_style ? (
                        <View style={styles.playStyleChip}>
                          <Text style={styles.playStyleChipText}>{PLAY_STYLE_LABELS[item.dog_play_style]}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.rowMeta}>
                      {BREED_LABELS[item.dog_breed]}
                      {item.owner_name ? ` • ${item.owner_name}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.rowTime}>{formatRelativeTime(item.created_at)}</Text>
                </View>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  headerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  title: { ...typography.titleMD },
  subtitle: { ...typography.body, marginTop: spacing.xxs },
  breedSummary: { ...typography.caption, marginTop: spacing.xs },
  statusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  statusTitle: { ...typography.subtitle },
  statusText: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.sm },
  checkinBtn: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  checkinBtnText: { ...typography.body, color: '#FFFFFF', fontWeight: '700' },
  endBtn: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  endBtnText: { ...typography.body, fontWeight: '700' },
  pressed: { opacity: 0.9 },
  disabledBtn: { opacity: 0.5 },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  helperText: { ...typography.bodyMuted },
  retryBtn: {
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  retryBtnText: { ...typography.body, fontWeight: '700' },
  listContent: { paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  rowText: { flex: 1, marginLeft: spacing.md },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  dogName: { ...typography.subtitle },
  playStyleChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  playStyleChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  rowMeta: { ...typography.caption, marginTop: spacing.xxs },
  rowTime: { ...typography.caption, alignSelf: 'flex-start', marginTop: 2, marginRight: 5 },
});
