import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
} from "react-native";
import { Bone } from "lucide-react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { ReactionEnum } from "@/types";

interface ReactionBarProps {
  reactions: Partial<Record<ReactionEnum, number>>;
  userReaction?: ReactionEnum | null;
  onSelect: (reaction: ReactionEnum | null) => void;
  onMenuOpenChange?: (open: boolean) => void;
  /** Merged with the outer wrapper (e.g. `{ marginTop: 0 }` when sitting in a shared row) */
  wrapperStyle?: ViewStyle;
}

export function ReactionBar({ reactions, userReaction, onSelect, wrapperStyle }: ReactionBarProps) {
  const totalCount = Object.values(reactions || {}).reduce((s, c) => s + (c ?? 0), 0);

  const handleTap = () => {
    if (userReaction) {
      onSelect(null);
    } else {
      onSelect("LIKE");
    }
  };

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <Pressable
        onPress={handleTap}
        style={({ pressed }) => [
          styles.likeButton,
          totalCount > 0 && styles.likeButtonWithCount,
          userReaction && styles.likeButtonActive,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconWrap} pointerEvents="none">
          <Bone
            size={18}
            color={userReaction ? colors.primary : colors.textSecondary}
          />
        </View>
        {totalCount > 0 && (
          <Text pointerEvents="none" style={[styles.count, userReaction && styles.countActive]}>{totalCount}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 35,
    paddingVertical: 0,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  likeButtonWithCount: {
    paddingRight: spacing.md,
  },
  likeButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: { marginRight: 3 },
  count: {
    ...typography.bodyMuted,
    fontSize: 14,
    lineHeight: 18,
    marginLeft: 1,
    ...(Platform.OS === "web"
      ? { fontFamily: "Inter_600SemiBold" as const }
      : { fontFamily: "Inter_600SemiBold" }),
  },
  countActive: {
    color: colors.primary,
  },
});
