import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, StyleSheet, Text, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { FontAwesome6 } from "@expo/vector-icons";
import { DogPawIcon } from "@/assets/DogPawIcon";
import { getNotifications } from "@/api/notifications";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { useAuthStore } from "@/store/authStore";
import { colors, shadow, spacing } from "@/theme";

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
const CREATE_BUTTON_PRESS_ANIMATION = { duration: 180 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TAB_ICON_COLOR = "#000000";
const HOME_ICON_ACTIVE = require("../../assets/home-black.png");
const HOME_ICON_INACTIVE = require("../../assets/home-white.png");
const HOME_ICON_SIZE = 26;

function TabBarItem({
  tabKey,
  icon,
  accessibilityLabel,
  isActive,
  onPress,
  badgeCount,
}: {
  tabKey: "Home" | "Explore" | "Notifications" | "Profile";
  icon: "house" | "compass" | "bell" | "user";
  accessibilityLabel: string;
  isActive: boolean;
  onPress: () => void;
  badgeCount?: number;
}) {
  const badgeLabel =
    badgeCount && badgeCount > 0
      ? badgeCount > 99
        ? "99+"
        : badgeCount.toString()
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={styles.item}
    >
      <View style={styles.iconWrap}>
        {tabKey === "Home" ? (
          <Image
            source={isActive ? HOME_ICON_ACTIVE : HOME_ICON_INACTIVE}
            style={styles.homeIcon}
            resizeMode="contain"
          />
        ) : (
          <FontAwesome6
            name={icon}
            size={22}
            style={styles.tabIcon}
            color={TAB_ICON_COLOR}
            solid={isActive}
          />
        )}
        {badgeLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function NuzzleTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { scrollDirection, setScrollDirection } = useScrollDirection();
  const [wrapWidth, setWrapWidth] = useState(0);
  const indicatorLeft = useSharedValue(0);
  const createButtonPress = useSharedValue(0);
  const createButtonScale = useSharedValue(1);
  const prevIndexRef = useRef(state.index);
  // Scroll-based hide: animate translateY when scrolling down
  const translateY = useSharedValue(0);
  useEffect(() => {
    const shouldHide = scrollDirection === "down";
    translateY.value = withTiming(shouldHide ? TAB_BAR_HIDE_OFFSET : 0, {
      duration: 220,
    });
  }, [scrollDirection]);

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

  const centerButtonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      createButtonPress.value,
      [0, 1],
      [colors.primary, colors.primaryDark]
    ),
    transform: [{ scale: createButtonScale.value }],
  }));

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
    select: (notifications) =>
      notifications.reduce((count, notification) => {
        return notification.read_at ? count : count + 1;
      }, 0),
  });

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
                <AnimatedPressable
                  accessibilityRole="button"
                  accessibilityLabel="Create post"
                  onPress={() => navigation.getParent()?.navigate("CreatePostModal" as never)}
                  onPressIn={() => {
                    createButtonPress.value = withTiming(
                      1,
                      CREATE_BUTTON_PRESS_ANIMATION
                    );
                    createButtonScale.value = withTiming(
                      0.94,
                      CREATE_BUTTON_PRESS_ANIMATION
                    );
                  }}
                  onPressOut={() => {
                    createButtonPress.value = withTiming(
                      0,
                      CREATE_BUTTON_PRESS_ANIMATION
                    );
                    createButtonScale.value = withTiming(
                      1,
                      CREATE_BUTTON_PRESS_ANIMATION
                    );
                  }}
                  style={[styles.centerButton, centerButtonAnimatedStyle]}
                >
                  <DogPawIcon size={28} color="#FFFFFF" />
                </AnimatedPressable>
              </View>
            );
          }

          return (
            <TabBarItem
              key={item.key}
              tabKey={item.key as "Home" | "Explore" | "Notifications" | "Profile"}
              icon={item.icon as "house" | "compass" | "bell" | "user"}
              accessibilityLabel={item.label}
              isActive={isActive}
              badgeCount={item.key === "Notifications" ? unreadCount : undefined}
              onPress={() => navigation.navigate(item.key)}
            />
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
    paddingBottom: spacing.lg + 20,
    overflow: "visible",
    ...shadow.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.11,
    shadowRadius: 2,
    elevation: 3,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: -spacing.sm,
    marginBottom: 1,
    paddingVertical: spacing.sm,
    transform: [{ translateY: 1 }],
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    transform: [{ translateY: 4 }],
  },
  homeIcon: {
    width: HOME_ICON_SIZE,
    height: HOME_ICON_SIZE,
    transform: [{ translateY: 4 }],
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -15,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: TAB_ICON_COLOR,
    borderRadius: 2,
  },
  centerWrap: {
    flex: 1,
    position: "relative",
  },
  centerButton: {
    position: "absolute",
    bottom: -7,
    left: "50%",
    marginLeft: -27.5,
    width: 55,
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 5,
  },
});
