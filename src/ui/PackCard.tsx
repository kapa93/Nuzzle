import React from "react";
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import type { BreedColorKey } from "../theme";

type Props = {
  label: string;
  image: ImageSourcePropType;
  breedColor: BreedColorKey;
  onPress?: () => void;
};

export function PackCard({ label, image, breedColor, onPress }: Props) {
  const breed = colors.breeds[breedColor];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View style={[styles.imageWrap, { backgroundColor: breed.bg, borderColor: breed.ring }]}>
        <Image source={image} style={styles.image} resizeMode="cover" />
      </View>
      <View style={[styles.labelPill, { backgroundColor: breed.bg, borderColor: breed.ring }]}>
        <Text style={[styles.label, { color: breed.text }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: "100%" },
  pressed: { opacity: 0.92 },
  imageWrap: { width: "100%", aspectRatio: 1, borderRadius: radius.lg, overflow: "hidden", borderWidth: 2, marginBottom: spacing.sm },
  image: { width: "100%", height: "100%" },
  labelPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1 },
  label: { ...typography.body, fontWeight: "700" },
});
