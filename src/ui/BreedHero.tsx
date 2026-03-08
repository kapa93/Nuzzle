import React from "react";
import { ImageBackground, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

export function BreedHero({
  title,
  image,
  joined = false,
}: {
  title: string;
  image: ImageSourcePropType;
  joined?: boolean;
}) {
  return (
    <ImageBackground source={image} style={styles.hero} imageStyle={styles.image}>
      <View style={styles.topRow}>
        <View style={styles.joinedPill}>
          <Text style={styles.joinedText}>{joined ? "Joined" : "Join"}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: { height: 210, borderRadius: radius.xl, overflow: "hidden", padding: spacing.xl, justifyContent: "space-between", marginBottom: spacing.lg },
  image: { borderRadius: radius.xl },
  topRow: { flexDirection: "row", justifyContent: "flex-start" },
  joinedPill: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  joinedText: { ...typography.body, fontWeight: "700" },
  title: { ...typography.titleXL, color: "#FFFFFF", maxWidth: "72%" },
});
