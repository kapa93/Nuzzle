import React from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
} from "react-native";
import { colors, radius, spacing } from "../theme";

const HERO_HEIGHT = 230;

export function BreedHero({
  title,
  image,
  joined = false,
  onJoinPress,
  onBreedNamePress,
  imageStyle,
  compact,
}: {
  title: string;
  image: ImageSourcePropType;
  joined?: boolean;
  onJoinPress?: () => void;
  onBreedNamePress?: () => void;
  imageStyle?: StyleProp<ImageStyle>;
  compact?: boolean;
}) {
  return (
    <ImageBackground
      source={image}
      style={[styles.hero, compact && styles.heroCompact]}
      imageStyle={[styles.image, imageStyle]}
    >
      <View style={styles.overlay} />
      <View style={styles.topRow}>
        {onJoinPress && (
          <Pressable
            onPress={onJoinPress}
            style={({ pressed }) => [styles.joinedPill, pressed && styles.joinedPillPressed]}
          >
            <Text style={styles.joinedText}>{joined ? "Joined" : "Join"}</Text>
          </Pressable>
        )}
        {!onJoinPress && (
          <View style={styles.joinedPill}>
            <Text style={styles.joinedText}>{joined ? "Joined" : "Join"}</Text>
          </View>
        )}
      </View>
      {onBreedNamePress ? (
        <Pressable onPress={onBreedNamePress} style={({ pressed }) => [styles.titleWrap, pressed && styles.titlePressed]}>
          <Text style={styles.title}>{title}</Text>
        </Pressable>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, overflow: "hidden", padding: spacing.xl, justifyContent: "space-between" },
  heroCompact: { marginBottom: 0 },
  image: {},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  topRow: { flexDirection: "row", justifyContent: "flex-start", marginTop: 2 },
  joinedPill: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: 5,
  },
  joinedPillPressed: { opacity: 0.85 },
  joinedText: { fontSize: 15, fontWeight: "700", color: "#2E3834" },
  titleWrap: {},
  titlePressed: { opacity: 0.9 },
  title: {
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: 0.1,
    ...Platform.select({
      ios: { fontFamily: "System", fontWeight: "700" as const },
      android: { fontFamily: "sans-serif", fontWeight: "700" as const },
      default: {
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: "700" as const,
      },
    }),
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 0.75 },
    textShadowRadius: 1.5,
    color: "#FFFFFF",
    maxWidth: "72%",
    marginBottom: spacing.xxs,
  },
});
