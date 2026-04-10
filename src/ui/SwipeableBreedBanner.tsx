import React, { useRef, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Pressable,
  Text,
} from "react-native";
import { BreedHero } from "./BreedHero";
import { getBreedHeroImageSource, getBreedHeroImageStyle } from "@/utils/breedAssets";
import { BREED_LABELS } from "@/utils/breed";
import { colors, radius, shadow, spacing, typography } from "@/theme";
import type { BreedEnum } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 230;

type Props = {
  breeds: BreedEnum[];
  currentBreed: BreedEnum;
  onBreedChange: (breed: BreedEnum) => void;
  joinedBreeds: BreedEnum[];
  onJoinPress?: (breed: BreedEnum) => void;
};

export function SwipeableBreedBanner({
  breeds,
  currentBreed,
  onBreedChange,
  joinedBreeds,
  onJoinPress,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const currentIndex = breeds.indexOf(currentBreed);
  const isIndexValid = currentIndex >= 0 && currentIndex < breeds.length;

  useEffect(() => {
    if (isIndexValid && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: currentIndex * SCREEN_WIDTH,
        animated: false,
      });
    }
  }, [currentBreed, isIndexValid]);

  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    const newBreed = breeds[index];
    if (newBreed && newBreed !== currentBreed) {
      onBreedChange(newBreed);
    }
  };

  if (breeds.length === 0) return null;

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {breeds.map((b) => (
          <View key={b} style={styles.page}>
            <BreedHero
              title={BREED_LABELS[b]}
              image={getBreedHeroImageSource(b)}
              imageStyle={getBreedHeroImageStyle(b)}
              joined={joinedBreeds.includes(b)}
              compact
              onJoinPress={
                onJoinPress
                  ? () => onJoinPress(b)
                  : undefined
              }
              onBreedNamePress={
                breeds.length > 1 ? () => setSelectorVisible(true) : undefined
              }
            />
          </View>
        ))}
      </ScrollView>
      {breeds.length > 1 && (
        <Modal visible={selectorVisible} transparent animationType="fade">
          <Pressable style={styles.selectorOverlay} onPress={() => setSelectorVisible(false)}>
            <Pressable style={styles.selectorSheet} onPress={() => {}}>
              <Text style={styles.selectorTitle}>Select Feed</Text>
              {breeds.map((b) => (
                <Pressable
                  key={b}
                  style={[
                    styles.selectorItem,
                    b === currentBreed && styles.selectorItemActive,
                  ]}
                  onPress={() => {
                    onBreedChange(b);
                    setSelectorVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectorItemText,
                      b === currentBreed && styles.selectorItemTextActive,
                    ]}
                  >
                    {BREED_LABELS[b]}
                  </Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      )}
      <View style={styles.dotsRow}>
        {breeds.map((b, i) => (
          <View
            key={b}
            style={[
              styles.dot,
              (b === currentBreed || (i === currentIndex && isIndexValid)) &&
                styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
  },
  scrollContent: {},
  page: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    justifyContent: "center",
  },
  dotsRow: {
    position: "absolute",
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  selectorSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },
  selectorTitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
    textAlign: "center",
    color: "#4A5550",
  },
  selectorItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    alignItems: "center",
  },
  selectorItemActive: {
    backgroundColor: colors.primarySoft,
  },
  selectorItemText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  selectorItemTextActive: {
    color: colors.primary,
  },
});
