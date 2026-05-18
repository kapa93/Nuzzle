import React, { useEffect } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing, typography } from "../theme";

const TAB_ANIMATION = { duration: 140 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SegmentTabItem({
  tab,
  active,
  isLast,
  onPress,
}: {
  tab: string;
  active: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const activeProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, TAB_ANIMATION);
  }, [active, activeProgress]);

  const tabAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      [colors.chipNeutral, colors.primary]
    ),
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      activeProgress.value,
      [0, 1],
      [colors.textSecondary, "#FFFFFF"]
    ),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.tab,
        !isLast && styles.tabGap,
        active && styles.tabActive,
        tabAnimatedStyle,
      ]}
    >
      <Animated.Text style={[styles.label, labelAnimatedStyle]}>{tab}</Animated.Text>
    </AnimatedPressable>
  );
}

export function SegmentTabs({ tabs, activeTab, onChange }: { tabs: string[]; activeTab: string; onChange: (tab: string) => void }) {
  return (
    <View style={styles.barWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab, i) => {
          const active = tab === activeTab;
          const isLast = i === tabs.length - 1;
          return (
            <SegmentTabItem
              key={tab}
              tab={tab}
              active={active}
              isLast={isLast}
              onPress={() => onChange(tab)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    zIndex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scroll: {
    backgroundColor: "transparent",
  },
  row: {
    paddingTop: spacing.sm + 5,
    paddingBottom: spacing.sm + 5,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    backgroundColor: colors.chipNeutral,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabGap: { marginRight: spacing.sm },
  tabActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 19,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "500" as const }
      : { fontFamily: "Inter_500Medium" as const }),
  },
});
