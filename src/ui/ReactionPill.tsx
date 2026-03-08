import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

type Variant = "filled" | "outline" | "selected";

export function ReactionPill({
  emoji,
  label,
  onPress,
  variant = "filled",
}: {
  emoji: string;
  label: string;
  onPress?: () => void;
  variant?: Variant;
}) {
  const style = variant === "outline" ? styles.outline : variant === "selected" ? styles.selected : styles.filled;
  return (
    <Pressable onPress={onPress} style={[styles.base, style]}>
      <Text style={styles.text}>{emoji} {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm },
  filled: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  text: { ...typography.bodyMuted, fontWeight: "700" },
});
