import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPackItems } from "@/utils/breedAssets";
import { useScrollDirection, useScrollDirectionUpdater } from "@/context/ScrollDirectionContext";
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
  const { onScroll } = useScrollDirectionUpdater();
  const { scrollDirection } = useScrollDirection();
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
          scrollDirection === "down" && styles.contentBarHidden,
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
                      item.breed === "FRENCH_BULLDOG" && styles.frenchieCardImage,
                      item.breed === "GOLDEN_RETRIEVER" && styles.goldenCardImage,
                      item.breed === "HUSKY" && styles.huskyCardImage,
                      item.breed === "LABRADOR_RETRIEVER" && styles.labCardImage,
                      item.breed === "PIT_BULL" && styles.pitbullCardImage,
                    ]}
                    source={item.image}
                    resizeMode="cover"
                  >
                    <View style={styles.overlay} />
                    <Text style={styles.cardLabel}>
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
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  contentBarHidden: {
    paddingBottom: spacing.sm,
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
    marginTop: 15,
  },
  title: {
    ...typography.titleXL,
    fontSize: 26,
    lineHeight: 30,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: 3,
    marginBottom: 25,
    textAlign: "center",
  },
  gridWrap: {
    alignItems: "center",
    marginLeft: 10,
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
    transform: [{ scale: 1.18 }, { translateX: 10 }, { translateY: 3 }],
  },
  frenchieCardImage: {
    transform: [{ scale: 1.75 }, { translateX: 11 }, { translateY: -1 }],
  },
  goldenCardImage: {
    transform: [{ scale: 1.3 }, { translateX: 10 }, { translateY: 5 }],
  },
  huskyCardImage: {
    transform: [{ scale: 1.6 }, { translateX: 5 }, { translateY: 15 }],
  },
  labCardImage: {
    transform: [{ scale: 1.4 }, { translateX: 7 }, { translateY: 11 }],
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
    fontSize: 20,
    lineHeight: 20,
    letterSpacing: 0.4,
    fontWeight: "800",
    color: colors.surface,
    textAlign: "left",
    width: "100%",
    paddingLeft: 5,
    zIndex: 1,
  },
  pressed: { opacity: 0.92 },
});
