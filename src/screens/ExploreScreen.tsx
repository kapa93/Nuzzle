import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  SafeAreaView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PackCard } from "@/ui/PackCard";
import { getPackItems } from "@/utils/breedAssets";
import { colors, spacing, typography } from "@/theme";

const CARD_GAP = spacing.md;
const H_PADDING = spacing.lg;
const NUM_COLUMNS = 3;

export function ExploreScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p?: object) => void };
}) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
  const packItems = getPackItems();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Choose Your Pack</Text>
        <Pressable
          onPress={() => navigation.navigate("SearchMain")}
          style={styles.searchBtn}
          hitSlop={12}
        >
          <Ionicons name="search" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Pick a breed community to explore</Text>

        <View style={styles.grid}>
          {packItems.map((item) => (
            <View key={item.breed} style={[styles.cell, { width: cardWidth }]}>
              <PackCard
                label={item.label}
                image={{ uri: item.imageUri }}
                breedColor={item.breedColor}
                onPress={() => navigation.navigate("BreedFeed", { breed: item.breed })}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.titleXL,
  },
  searchBtn: {
    padding: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginBottom: spacing.xxl,
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
});
