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
import { useScrollDirectionUpdater } from "@/context/ScrollDirectionContext";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import { ScreenWithWallpaper } from "@/components/ScreenWithWallpaper";
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
  const headerHeight = useStackHeaderHeight();
  const cardWidth = (width - H_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
  const packItems = getPackItems();

  return (
    <ScreenWithWallpaper>
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
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
                <ImageBackground
                  style={[styles.card, pressed && styles.pressed]}
                  imageStyle={[
                    styles.cardImage,
                    item.breed === "AUSTRALIAN_SHEPHERD" && styles.aussieCardImage,
                    item.breed === "HUSKY" && styles.huskyCardImage,
                  ]}
                  source={item.image}
                  resizeMode="cover"
                >
                  <View style={styles.overlay} />
                  <Text style={styles.cardLabel}>
                    {item.breed === "AUSTRALIAN_SHEPHERD" ? "Aussie" : item.label}
                  </Text>
                </ImageBackground>
              )}
            </Pressable>
          ))}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
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
  },
  title: {
    ...typography.titleXL,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
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
  cardImage: {
    borderRadius: radius.xl,
  },
  aussieCardImage: {
    transform: [{ scale: 1.3 }, { translateX: 10 }, { translateY: 5 }],
  },
  huskyCardImage: {
    transform: [{ scale: 1.3 }, { translateX: 5 }, { translateY: 15 }],
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
    fontWeight: "800",
    color: colors.surface,
    textAlign: "right",
    width: "100%",
    paddingRight: 5,
    zIndex: 1,
  },
  pressed: { opacity: 0.92 },
});
