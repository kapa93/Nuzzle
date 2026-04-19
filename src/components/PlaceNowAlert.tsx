import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type Props = {
  placeName: string;
  activeCount: number;
  onPressView: () => void;
};

export function PlaceNowAlert({ placeName, activeCount, onPressView }: Props) {
  return (
    <Pressable onPress={onPressView} style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <View style={styles.left}>
        <Ionicons name="alert-circle" size={22} color="#FFFFFF" />
        <View style={styles.textWrap}>
          <Text style={styles.title}>Dogs at {placeName} right now</Text>
          <Text style={styles.subtitle}>{activeCount} active</Text>
        </View>
      </View>
      <View style={styles.viewPill}>
        <Text style={styles.viewText}>View</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  pressed: {
    opacity: 0.92,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyMuted,
    color: '#F3F4F6',
    marginTop: 1,
  },
  viewPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  viewText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
