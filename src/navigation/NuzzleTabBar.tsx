import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { FontAwesome6 } from "@expo/vector-icons";
import { DogPawIcon } from "@/assets/DogPawIcon";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { colors, spacing, typography } from "@/theme";

const TAB_CONFIG = [
  { key: "Home", label: "Home", icon: "house" as const },
  { key: "Explore", label: "Explore", icon: "compass" as const },
  { key: "Create", label: "Create", icon: "pen" as const },
  { key: "Notifications", label: "Alerts", icon: "bell" as const },
  { key: "Profile", label: "Profile", icon: "user" as const },
];

const INDICATOR_ANIMATION = { duration: 60 };
const WRAP_PADDING_H = spacing.md;
const TAB_BAR_HIDE_OFFSET = 120;

export function NuzzleTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { scrollDirection, setScrollDirection } = useScrollDirection();
  const [wrapWidth, setWrapWidth] = useState(0);
  const indicatorLeft = useSharedValue(0);
  const prevIndexRef = useRef(state.index);
  // Scroll-based hide: animate translateY when scrolling down (always visible on Explore)
  const translateY = useSharedValue(0);
  const isExplore = state.routeNames[state.index] === "Explore";
  useEffect(() => {
    const shouldHide = !isExplore && scrollDirection === "down";
    translateY.value = withTiming(shouldHide ? TAB_BAR_HIDE_OFFSET : 0, {
      duration: 220,
    });
  }, [scrollDirection, isExplore]);

  const animatedBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, TAB_BAR_HIDE_OFFSET],
      [1, 0]
    );
    return {
      opacity,
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    setScrollDirection("up");
  }, [state.index]);

  useEffect(() => {
    if (wrapWidth > 0) {
      const contentWidth = wrapWidth - WRAP_PADDING_H * 2;
      const tabWidth = contentWidth / 5;
      const indicatorWidth = tabWidth * 0.8;
      const targetLeft = WRAP_PADDING_H + state.index * tabWidth + (tabWidth - indicatorWidth) / 2;
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
                width: wrapWidth > 0 ? ((wrapWidth - WRAP_PADDING_H * 2) / 5) * 0.8 : 0,
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
              <FontAwesome6
                name={item.icon}
                size={22}
                color={isActive ? colors.primary : colors.textMuted}
                solid={isActive}
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
    paddingHorizontal: WRAP_PADDING_H,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
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
    bottom: 7,
    left: "50%",
    marginLeft: -27.5,
    width: 55,
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
