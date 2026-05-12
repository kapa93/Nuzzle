import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDogInteractionMutation } from '@/hooks/useDogInteractionMutation';
import { useRecentDogMeetingStatus } from '@/hooks/useRecentDogMeetingStatus';
import { colors, radius, spacing, typography } from '@/theme';
import type { Dog, DogInteractionSourceType } from '@/types';
import { track } from '@/lib/posthog';

type Props = {
  viewerUserId?: string | null;
  viewerDogs: Dog[];
  targetDog: Pick<Dog, 'id' | 'name'>;
  sourceType?: DogInteractionSourceType;
  locationName?: string | null;
  compact?: boolean;
  alignRight?: boolean;
};

export function MetThisDogButton({
  viewerUserId,
  viewerDogs,
  targetDog,
  sourceType = 'manual',
  locationName = null,
  compact = false,
  alignRight = false,
}: Props) {
  const mutation = useDogInteractionMutation();

  const availableViewerDogs = viewerDogs.filter((dog) => dog.id !== targetDog.id);
  const [showSuccessState, setShowSuccessState] = React.useState(false);
  const { data: recentlyMetDogIds = [] } = useRecentDogMeetingStatus({
    dogIds: availableViewerDogs.map((dog) => dog.id),
    targetDogId: targetDog.id,
  });

  const selectableViewerDogs = availableViewerDogs.filter((dog) => !recentlyMetDogIds.includes(dog.id));
  const allDogsLabel = selectableViewerDogs.length === 2 ? 'Both dogs' : 'All my dogs';
  const isFullyMet = availableViewerDogs.length > 0 && selectableViewerDogs.length === 0;

  React.useEffect(() => {
    if (!showSuccessState) return;

    const timeout = setTimeout(() => setShowSuccessState(false), 1400);
    return () => clearTimeout(timeout);
  }, [showSuccessState]);

  const handleCreate = (dogIds: string[]) => {
    if (!viewerUserId) {
      Alert.alert('Sign in required', 'Please sign in before tracking dogs met.');
      return;
    }

    track('met_this_dog_tapped', { source_type: sourceType });
    mutation.mutate({
      dogIds,
      metDogId: targetDog.id,
      createdByUserId: viewerUserId,
      sourceType,
      locationName,
    }, {
      onSuccess: () => {
        setShowSuccessState(true);
      },
    });
  };

  const handlePress = () => {
    if (selectableViewerDogs.length === 0) {
      Alert.alert('No dog profile', 'Add a dog profile before tracking dogs met.');
      return;
    }

    if (selectableViewerDogs.length === 1) {
      handleCreate([selectableViewerDogs[0].id]);
      return;
    }

    Alert.alert(
      'Which of your dogs?',
      `Which of your dogs met ${targetDog.name}?`,
      [
        {
          text: allDogsLabel,
          onPress: () => handleCreate(selectableViewerDogs.map((dog) => dog.id)),
        },
        ...selectableViewerDogs.map((dog) => ({
          text: dog.name,
          onPress: () => handleCreate([dog.id]),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  if (!viewerUserId || viewerDogs.some((dog) => dog.id === targetDog.id)) {
    return null;
  }

  if (showSuccessState) {
    return (
      <View
        style={[
          compact ? styles.compactCompleteChip : styles.completeChip,
          alignRight ? styles.alignRight : styles.alignLeft,
          styles.successChip,
        ]}
        accessibilityLabel="Interaction saved"
      >
        <Ionicons name="checkmark-sharp" size={compact ? 16 : 18} color={colors.primaryDark} />
      </View>
    );
  }

  if (isFullyMet) {
    return (
      <View
        style={[
          compact ? styles.compactCompleteChip : styles.completeChip,
          alignRight ? styles.alignRight : styles.alignLeft,
        ]}
        accessibilityLabel="Already met"
      >
        <Ionicons name="checkmark-sharp" size={compact ? 16 : 18} color={colors.primaryDark} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={mutation.isPending ? undefined : handlePress}
      style={({ pressed }) => [
        compact ? styles.compactButton : styles.button,
        alignRight ? styles.alignRight : styles.alignLeft,
        pressed && styles.pressed,
        mutation.isPending && styles.disabled,
      ]}
    >
      <Text style={compact ? styles.compactText : styles.text}>
        {mutation.isPending ? 'Saving...' : 'Met this dog?'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
  },
  compactButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
  },
  completeChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  compactCompleteChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  successChip: {},
  text: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  compactText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
});
