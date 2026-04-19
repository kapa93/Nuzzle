import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DogAvatar } from '@/components/DogAvatar';
import { useDogsMetByDog } from '@/hooks/useDogsMetByDog';
import { colors, spacing, typography } from '@/theme';

type Props = {
  dogId: string;
  onOpenDogProfile?: (dogId: string) => void;
  title?: string;
  emptyLabel?: string;
};

export function DogsMetSection({
  dogId,
  onOpenDogProfile,
  title = 'Dogs Met',
  emptyLabel = 'No dogs met yet',
}: Props) {
  const { data: dogsMet = [], isLoading } = useDogsMetByDog(dogId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dogs met...</Text>
        </View>
      ) : dogsMet.length === 0 ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <View style={styles.avatarRow}>
          {dogsMet.map((dog) => (
            <Pressable
              key={dog.id}
              onPress={onOpenDogProfile ? () => onOpenDogProfile(dog.id) : undefined}
              style={({ pressed }) => [styles.avatarItem, pressed && onOpenDogProfile ? styles.pressed : null]}
            >
              <DogAvatar imageUrl={dog.dog_image_url} name={dog.name} size={44} />
              <Text style={styles.dogName} numberOfLines={1}>{dog.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodyMuted,
  },
  emptyText: {
    ...typography.bodyMuted,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarItem: {
    alignItems: 'center',
    gap: 3,
    width: 56,
  },
  dogName: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});
