import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

export type Tone =
  | "neutral"
  | "training"
  | "behavior"
  | "health"
  | "grooming"
  | "food"
  | "gear"
  | "puppy"
  | "adolescent"
  | "adult"
  | "senior"
  | "playdate";

export const toneStyles: Record<Tone, { bg: string; text: string }> = {
  neutral:    { bg: colors.chipNeutral, text: colors.chipText },
  training:   { bg: "#F0E4F8", text: "#6B2E8A" },
  behavior:   { bg: "#D6F3FC", text: "#00a8dd" },
  health:     { bg: "#FDECEA", text: "#CA2D2D" },
  grooming:   { bg: "#FFE0EB", text: "#8B1A3A" },
  food:       { bg: "#EDE4F2", text: "#654B8C" },
  gear:       { bg: "#DDE8F5", text: "#1A3E6B" },
  puppy:      { bg: "#FFF0CC", text: "#FFA500" },
  adolescent: { bg: "#D4EEE8", text: "#1A4E44" },
  adult:      { bg: "#FAEBD8", text: "#D86722" },
  senior:     { bg: "#EDE4D4", text: "#4A3820" },
  playdate:   { bg: "#D6F0EC", text: "#339989" },
};

export function TagChip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.chip, { backgroundColor: toneStyles[tone].bg }]}>
      <Text style={[styles.label, { color: toneStyles[tone].text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 13,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs + 1,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  label: {
    ...typography.caption,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "700" as const }
      : { fontFamily: "Inter_700Bold" }),
  },
});
