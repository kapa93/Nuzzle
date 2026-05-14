import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Check, MapPinPlus } from 'lucide-react-native';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import type { Place, PlaceTypeEnum } from '@/types';

const PLACE_TYPE_LABELS: Record<PlaceTypeEnum, string> = {
  dog_beach: 'Dog Beach',
  dog_park: 'Dog Park',
  trail: 'Trail',
  park: 'Park',
  other: 'Place',
};

const PLACE_TYPE_ICONS: Record<PlaceTypeEnum, React.ComponentProps<typeof Ionicons>['name']> = {
  dog_beach: 'water-outline',
  dog_park: 'paw-outline',
  trail: 'leaf-outline',
  park: 'leaf-outline',
  other: 'location-outline',
};

type Props = {
  place: Place;
  isSaved: boolean;
  onSaveToggle: () => void;
  onPress: () => void;
  saveLoading?: boolean;
  variant?: 'card' | 'plain';
  showTypeChip?: boolean;
};

export function PlaceRow({
  place,
  isSaved,
  onSaveToggle,
  onPress,
  saveLoading,
  variant = 'card',
  showTypeChip = true,
}: Props) {
  const locationLine = [place.neighborhood, place.city].filter(Boolean).join(', ');
  const isPlain = variant === 'plain';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isPlain ? styles.rowPlain : styles.rowCard,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={place.name}
    >
      {showTypeChip ? (
        <View style={styles.iconWrap}>
          <Ionicons
            name={PLACE_TYPE_ICONS[place.place_type]}
            size={22}
            color={colors.primary}
          />
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        <View style={styles.meta}>
          {showTypeChip ? (
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{PLACE_TYPE_LABELS[place.place_type]}</Text>
            </View>
          ) : null}
          {locationLine ? (
            <Text style={styles.location} numberOfLines={1}>{locationLine}</Text>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={saveLoading ? undefined : onSaveToggle}
        hitSlop={12}
        style={({ pressed }) => [styles.saveBtn, pressed && !saveLoading && styles.saveBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Unsave place' : 'Save place'}
        accessibilityState={{ selected: isSaved }}
      >
        {isSaved ? (
          <View style={styles.joinedPill}>
            <Text style={styles.joinedPillText}>Joined</Text>
            <Check size={13} color={colors.primaryDark} strokeWidth={3.5} />
          </View>
        ) : (
          <MapPinPlus size={25} color={colors.primaryDark} />
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  rowPlain: {
    marginHorizontal: -spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: spacing.lg,
    paddingLeft: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md + 1,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    ...typography.subtitle,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  typeChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  joinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs - 2,
  },
  joinedPillText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  location: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
  saveBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  saveBtnPressed: {
    opacity: 0.6,
  },
});
