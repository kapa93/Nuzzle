import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DogPawIcon } from "@/assets/DogPawIcon";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { colors, spacing, typography } from "@/theme";

const TAB_CONFIG = [
  { key: "Home", label: "Home", icon: "home" as const },
  { key: "Explore", label: "Explore", icon: "compass" as const },
  { key: "Create", label: "Create", icon: "create-outline" as const },
  { key: "Notifications", label: "Alerts", icon: "notifications" as const },
  { key: "Profile", label: "Profile", icon: "person" as const },
];

const INDICATOR_ANIMATION = { duration: 60 };

export function BreedBuddyTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { scrollDirection, setScrollDirection } = useScrollDirection();
  const [wrapWidth, setWrapWidth] = useState(0);
  const indicatorLeft = useSharedValue(0);
  const prevIndexRef = useRef(state.index);
  // Scroll-based hide: animate translateY when scrolling down
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withTiming(scrollDirection === "down" ? 120 : 0, {
      duration: 220,
    });
  }, [scrollDirection]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    setScrollDirection("up");
  }, [state.index]);

  useEffect(() => {
    if (wrapWidth > 0) {
      const tabWidth = wrapWidth / 5;
      const indicatorWidth = tabWidth * 0.8;
      const targetLeft = state.index * tabWidth + (tabWidth - indicatorWidth) / 2;
      const isTabChange = prevIndexRef.current !== state.index;
      prevIndexRef.current = state.index;

      if (isTabChange) {
        indicatorLeft.value = withTiming(targetLeft, INDICATOR_ANIMATION);
      } else {
        indicatorLeft.value = targetLeft;
      }
    }
  }, [state.index, wrapWidth]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorLeft.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom - 45, spacing.xxs) + 8 },
        animatedBarStyle,
      ]}
    >
      <View
        style={styles.wrap}
        onLayout={(e) => setWrapWidth(e.nativeEvent.layout.width)}
      >
        {state.index !== 2 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: wrapWidth > 0 ? (wrapWidth / 5) * 0.8 : 0,
              },
              indicatorAnimatedStyle,
            ]}
          />
        )}
        {TAB_CONFIG.map((item, idx) => {
          const isCenter = idx === 2;
          const isActive = state.routeNames[state.index] === item.key;

          if (isCenter) {
            return (
              <View key={item.key} style={styles.centerWrap}>
                <Pressable
                  onPress={() => navigation.navigate("Create")}
                  style={styles.centerButton}
                >
                  <DogPawIcon size={28} color="#FFFFFF" />
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate(item.key)}
              style={styles.item}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    bottom: -12,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  item: {
    alignItems: "center",
    flex: 1,
    marginTop: -spacing.sm,
    marginBottom: 1,
    paddingTop: spacing.sm,
    transform: [{ translateY: 1 }],
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 0,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  labelInactive: {
    color: colors.textMuted,
  },
  centerWrap: {
    flex: 1,
    position: "relative",
  },
  centerButton: {
    position: "absolute",
    bottom: 4,
    left: "50%",
    marginLeft: -26.5,
    width: 53,
    height: 53,
    borderRadius: 26.5,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
