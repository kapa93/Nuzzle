import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, shadow, spacing, typography } from "../theme";

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
      [colors.surface, colors.primary]
    ),
    borderColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      [colors.border, colors.primary]
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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
  );
}

const styles = StyleSheet.create({
  row: { paddingBottom: spacing.sm },
  tab: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow.sm,
  },
  tabGap: { marginRight: spacing.xxs },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  label: { ...typography.bodyMuted, fontWeight: "700" },
});
