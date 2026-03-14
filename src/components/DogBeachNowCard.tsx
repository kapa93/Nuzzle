import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BREED_LABELS } from '@/utils/breed';
import type { BreedEnum } from '@/types';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type BreedCount = { breed: BreedEnum; count: number };

type Props = {
  activeCount: number;
  breedCounts: BreedCount[];
  onPressView: () => void;
};

function formatBreedSummary(counts: BreedCount[]): string {
  return counts
    .slice(0, 2)
    .map(({ breed, count }) => `${count} ${BREED_LABELS[breed]}${count > 1 ? 's' : ''}`)
    .join(' • ');
}

export function DogBeachNowCard({ activeCount, breedCounts, onPressView }: Props) {
  const summary = formatBreedSummary(breedCounts);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Dogs at Dog Beach right now</Text>
          <Text style={styles.count}>{activeCount} active</Text>
          {summary ? <Text style={styles.summary}>{summary}</Text> : null}
        </View>
        <Pressable onPress={onPressView} style={({ pressed }) => [styles.viewBtn, pressed && styles.viewBtnPressed]}>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          <Text style={styles.viewBtnText}>View</Text>
        </Pressable>
      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  count: {
    ...typography.body,
    marginTop: spacing.xxs,
  },
  summary: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewBtnPressed: {
    opacity: 0.9,
  },
  viewBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
