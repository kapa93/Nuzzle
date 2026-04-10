import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  ImageBackground,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPackItems } from "@/utils/breedAssets";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import { colors, radius, spacing, typography } from "@/theme";

const CARD_GAP = spacing.md;
const H_PADDING = spacing.lg;
const NUM_COLUMNS = 2;

export function ExploreScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p?: object) => void };
}) {
  const { width } = useWindowDimensions();
  const headerHeight = useStackHeaderHeight();
  const cardWidth = (width - H_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
  const packItems = getPackItems();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.title}>Choose Your Pack</Text>
            <Ionicons name="add" size={16} color={colors.primary} />
          </View>
          <Text style={styles.subtitle}>Pick one or more communities to explore</Text>
        </View>
        <View style={styles.gridWrap}>
          <View style={styles.grid}>
          {packItems.map((item) => (
            <Pressable
              key={item.breed}
              style={[styles.cell, { width: cardWidth }]}
              onPress={() => navigation.navigate("BreedFeed", { breed: item.breed })}
            >
              {({ pressed }) => (
                <View style={styles.cardShadow}>
                  <ImageBackground
                    style={[styles.card, pressed && styles.pressed]}
                    imageStyle={[
                      styles.cardImage,
                      item.breed === "AUSTRALIAN_SHEPHERD" && styles.aussieCardImage,
                      item.breed === "DACHSHUND" && styles.dachshundCardImage,
                      item.breed === "FRENCH_BULLDOG" && styles.frenchieCardImage,
                      item.breed === "GERMAN_SHEPHERD" && styles.germanCardImage,
                      item.breed === "GOLDEN_DOODLE" && styles.goldenDoodleCardImage,
                      item.breed === "GOLDEN_RETRIEVER" && styles.goldenCardImage,
                      item.breed === "HUSKY" && styles.huskyCardImage,
                      item.breed === "MIXED_BREED" && styles.mixedBreedCardImage,
                      item.breed === "PUG" && styles.pugCardImage,
                      item.breed === "LABRADOODLE" && styles.labradoodleCardImage,
                      item.breed === "LABRADOR_RETRIEVER" && styles.labCardImage,
                      item.breed === "PIT_BULL" && styles.pitbullCardImage,
                    ]}
                    source={item.image}
                    resizeMode="cover"
                  >
                    <View style={styles.overlay} />
                    <Text
                      style={[
                        styles.cardLabel,
                        item.breed === "GERMAN_SHEPHERD" && styles.germanCardLabel,
                        item.breed === "GOLDEN_DOODLE" && styles.goldenDoodleCardLabel,
                      ]}
                      numberOfLines={item.breed === "GERMAN_SHEPHERD" ? 2 : 1}
                      adjustsFontSizeToFit={item.breed === "GOLDEN_DOODLE"}
                      minimumFontScale={0.8}
                    >
                      {item.breed === "AUSTRALIAN_SHEPHERD"
                        ? "Aussie"
                        : item.breed === "FRENCH_BULLDOG"
                          ? "Frenchie"
                          : item.breed === "GOLDEN_RETRIEVER"
                            ? "Golden"
                            : item.breed === "LABRADOR_RETRIEVER"
                              ? "Labrador"
                          : item.label}
                    </Text>
                  </ImageBackground>
                </View>
              )}
            </Pressable>
          ))}
          </View>
        </View>
        <Text style={styles.comingSoonText}>More breeds coming soon!</Text>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl + 75,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: 0,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 20,
  },
  title: {
    ...typography.titleXL,
    fontSize: 26,
    lineHeight: 30,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: 3,
    marginBottom: 30,
    textAlign: "center",
  },
  gridWrap: {
    alignItems: "center",
    marginLeft: 10,
  },
  comingSoonText: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginTop: spacing.sm + 2,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -CARD_GAP / 2,
  },
  cell: {
    paddingHorizontal: CARD_GAP / 2,
    marginBottom: spacing.lg,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: spacing.md,
  },
  cardShadow: {
    borderRadius: radius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  cardImage: {
    borderRadius: radius.xl,
  },
  aussieCardImage: {
    transform: [{ scale: 1.25 }, { translateX: 10 }, { translateY: -10 }],
  },
  dachshundCardImage: {
    transform: [{ scale: 1.4 }, { translateX: 10 }, { translateY: 18 }],
  },
  frenchieCardImage: {
    transform: [{ scale: 1.75 }, { translateX: 11 }, { translateY: -1 }],
  },
  germanCardImage: {
    transform: [{ scale: 1.35 }, { translateX: 9 }, { translateY: 7 }],
  },
  goldenCardImage: {
    transform: [{ scale: 1.3 }, { translateX: 10 }, { translateY: 5 }],
  },
  goldenDoodleCardImage: {
    transform: [{ scale: 1.25 }, { translateX: 12 }, { translateY: 6 }],
  },
  huskyCardImage: {
    transform: [{ scale: 1.6 }, { translateX: 5 }, { translateY: 15 }],
  },
  mixedBreedCardImage: {
    transform: [{ scale: 1.25 }, { translateX: 8 }, { translateY: 15 }],
  },
  pugCardImage: {
    transform: [{ scale: 1.21 }, { translateX: 11 }, { translateY: -2 }],
  },
  labCardImage: {
    transform: [{ scale: 1.4 }, { translateX: 7 }, { translateY: 11 }],
  },
  labradoodleCardImage: {
    transform: [{ scale: 1.35 }, { translateX: 8 }, { translateY: 5 }],
  },
  pitbullCardImage: {
    transform: [{ scale: 1.3 }, { translateX: 6 }, { translateY: 4 }],
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 45,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  cardLabel: {
    fontSize: 19,
    lineHeight: 20,
    letterSpacing: 0.4,
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
    color: colors.surface,
    textAlign: "left",
    width: "100%",
    paddingLeft: 5,
    zIndex: 1,
  },
  germanCardLabel: {
    fontSize: 18,
    lineHeight: 18,
    position: "relative",
    top: 8,
  },
  goldenDoodleCardLabel: {
    fontSize: 17,
    lineHeight: 18,
    position: "relative",
    bottom: 1,
  },
  pressed: { opacity: 0.92 },
});
