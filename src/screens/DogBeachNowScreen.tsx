import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DOG_BEACH } from '@/config/dogBeach';
import { MetThisDogButton } from '@/components/MetThisDogButton';
import { DogAvatar } from '@/components/DogAvatar';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { getDogsByOwner } from '@/api/dogs';
import {
  createDogBeachCheckins,
  endDogBeachCheckins,
  getActiveDogBeachCheckins,
  getDogBeachBreedCounts,
  getMyActiveDogBeachCheckins,
} from '@/api/locationCheckins';
import { useAuthStore } from '@/store/authStore';
import { BREED_LABELS, formatRelativeTime, PLAY_STYLE_LABELS } from '@/utils/breed';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { captureHandledError } from '@/lib/sentry';

type Props = {
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
};

export function DogBeachNowScreen({ navigation }: Props) {
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

  const { data: myActiveCheckins = [] } = useQuery({
    queryKey: ['dogBeachMyCheckins', user?.id],
    queryFn: () => getMyActiveDogBeachCheckins(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (dogIds: string[]) => createDogBeachCheckins(user!.id, dogIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogBeachActiveCheckins'] });
      queryClient.invalidateQueries({ queryKey: ['dogBeachMyCheckins', user?.id] });
    },
    onError: (error) => {
      captureHandledError(error, {
        area: 'dog-beach.check-in',
        tags: { screen: 'dog-beach-now' },
      });
      Alert.alert('Could not check in', 'Please try again in a moment.');
    },
  });

  const endMutation = useMutation({
    mutationFn: (checkinIds: string[]) => endDogBeachCheckins(checkinIds, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogBeachActiveCheckins'] });
      queryClient.invalidateQueries({ queryKey: ['dogBeachMyCheckins', user?.id] });
    },
    onError: (error) => {
      captureHandledError(error, {
        area: 'dog-beach.end-check-in',
        tags: { screen: 'dog-beach-now' },
      });
      Alert.alert('Could not end check-in', 'Please try again in a moment.');
    },
  });

  const breedCounts = useMemo(() => getDogBeachBreedCounts(activeCheckins), [activeCheckins]);
  const checkedInDogIds = useMemo(
    () => new Set(myActiveCheckins.map((checkin) => checkin.dog_id)),
    [myActiveCheckins]
  );
  const availableDogsToCheckIn = useMemo(
    () => dogs.filter((dog) => !checkedInDogIds.has(dog.id)),
    [dogs, checkedInDogIds]
  );
  const allDogsLabel = availableDogsToCheckIn.length === 2 ? 'Both dogs' : 'All my dogs';

  const handleCheckIn = useCallback(() => {
    if (dogs.length === 0) {
      Alert.alert('No dog profile', 'Add a dog profile before checking in.');
      return;
    }
    if (availableDogsToCheckIn.length === 0) {
      Alert.alert('All set', 'All of your dogs are already checked in.');
      return;
    }
    if (availableDogsToCheckIn.length === 1) {
      createMutation.mutate([availableDogsToCheckIn[0].id]);
      return;
    }

    Alert.alert(
      'Choose dogs',
      'Which of your dogs are at the beach right now?',
      [
        {
          text: allDogsLabel,
          onPress: () => createMutation.mutate(availableDogsToCheckIn.map((dog) => dog.id)),
        },
        ...availableDogsToCheckIn.map((dog) => ({
          text: dog.name,
          onPress: () => createMutation.mutate([dog.id]),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }, [allDogsLabel, availableDogsToCheckIn, createMutation, dogs]);

  const handleEndCheckin = useCallback(() => {
    if (myActiveCheckins.length === 0) return;
    endMutation.mutate(myActiveCheckins.map((checkin) => checkin.id));
  }, [endMutation, myActiveCheckins]);

  const renderAttendeeItem = useCallback(({ item }: { item: typeof activeCheckins[0] }) => (
    <View style={styles.row}>
      <Pressable
        onPress={() => navigation.navigate('DogProfile', { dogId: item.dog_id })}
        style={styles.rowIdentity}
      >
        <DogAvatar imageUrl={item.dog_image_url} name={item.dog_name} size={44} />
        <View style={styles.rowText}>
          <View style={styles.rowHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.dogName}>{item.dog_name}</Text>
              {item.dog_play_style ? (
                <View style={styles.playStyleChip}>
                  <Text style={styles.playStyleChipText}>{PLAY_STYLE_LABELS[item.dog_play_style]}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.rowMeta}>
            {BREED_LABELS[item.dog_breed]}
            {item.owner_name ? ` • ${item.owner_name}` : ''}
          </Text>
        </View>
      </Pressable>

      <View style={styles.rowSide}>
        <Text style={styles.rowTime}>{formatRelativeTime(item.created_at)}</Text>
        <MetThisDogButton
          viewerUserId={user?.id ?? null}
          viewerDogs={dogs}
          targetDog={{ id: item.dog_id, name: item.dog_name }}
          sourceType="dog_beach"
          locationName={DOG_BEACH.locationName}
          compact
          alignRight
        />
      </View>
    </View>
  ), [navigation, user?.id, dogs]);

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
            {myActiveCheckins.length > 0 ? (
              <>
                <Text style={styles.statusText}>
                  {myActiveCheckins.length === 1
                    ? 'You currently have 1 dog checked in.'
                    : `You currently have ${myActiveCheckins.length} dogs checked in.`}
                </Text>
                <View style={styles.statusActions}>
                  {availableDogsToCheckIn.length > 0 ? (
                    <Pressable
                      onPress={createMutation.isPending ? undefined : handleCheckIn}
                      style={({ pressed }) => [styles.checkinBtn, pressed && styles.pressed, createMutation.isPending && styles.disabledBtn]}
                    >
                      <Text style={styles.checkinBtnText}>
                        {availableDogsToCheckIn.length === 1 ? 'Check In Another Dog' : `Check In ${allDogsLabel}`}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={handleEndCheckin}
                    style={({ pressed }) => [styles.endBtn, pressed && styles.pressed, endMutation.isPending && styles.disabledBtn]}
                  >
                    <Text style={styles.endBtnText}>
                      {myActiveCheckins.length === 1 ? 'End Check-In' : 'End All Check-Ins'}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.statusText}>You are not currently checked in.</Text>
                <View style={styles.statusActions}>
                  <Pressable
                    onPress={createMutation.isPending ? undefined : handleCheckIn}
                    style={({ pressed }) => [styles.checkinBtn, pressed && styles.pressed, createMutation.isPending && styles.disabledBtn]}
                  >
                    <Text style={styles.checkinBtnText}>Check In</Text>
                  </Pressable>
                </View>
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
              renderItem={renderAttendeeItem}
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
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { ...typography.titleMD, color: colors.surface, fontWeight: '700' },
  subtitle: { ...typography.body, marginTop: spacing.xxs, color: colors.background },
  breedSummary: { ...typography.caption, marginTop: spacing.xs, color: colors.primarySoft },
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
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  checkinBtn: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    minHeight: 30,
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
  },
  checkinBtnText: { ...typography.caption, color: colors.surface, fontWeight: '700' },
  endBtn: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 30,
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
  },
  endBtnText: { ...typography.caption, fontWeight: '700' },
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
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  rowIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowText: { flex: 1, marginLeft: spacing.md },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
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
  rowSide: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    marginRight: 5,
  },
  rowTime: { ...typography.caption, flexShrink: 0, textAlign: 'right', marginRight: 5 },
});
