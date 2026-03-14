import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type Props = {
  onCheckIn: () => void;
  disabled?: boolean;
};

export function DogBeachNearbyCard({ onCheckIn, disabled }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="location" size={18} color={colors.primary} />
        <Text style={styles.title}>Dog Beach nearby</Text>
      </View>
      <Text style={styles.body}>Check in with your dog?</Text>
      <Pressable
        onPress={disabled ? undefined : onCheckIn}
        style={({ pressed }) => [styles.button, pressed && !disabled && styles.buttonPressed, disabled && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Check In</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  body: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
