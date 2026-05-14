import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, StyleSheet, Text, Image, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomTabBarHeightCallbackContext,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { Compass, MapPinned, CircleUser } from "lucide-react-native";
import { DogPawIcon } from "@/assets/DogPawIcon";
import { colors, spacing } from "@/theme";

const TAB_CONFIG = [
  { key: "Home", label: "Dogs" },
  { key: "SavedPlaces", label: "Places" },
  { key: "Create", label: "Create" },
  { key: "Explore", label: "Explore" },
  { key: "Profile", label: "Profile" },
];

const INDICATOR_ANIMATION = { duration: 60 };
const WRAP_PADDING_H = spacing.md;
const TAB_BAR_HIDE_OFFSET = 120;

/** Pixels the tab bar root extends below the window (`outer.bottom`). Measured layout height includes this; list `paddingBottom` should subtract it for a flush scroll end. */
export const NUZZLE_TAB_BAR_LAYOUT_EXTENDS_BELOW_SCREEN = 12;
const CREATE_BUTTON_PRESS_ANIMATION = { duration: 180 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TAB_ICON_COLOR = "#000000";
/** Lucide stroke weight for Places / Explore / Profile tab icons */
const TAB_BAR_LUCIDE_STROKE = 1.7;
const TAB_BAR_LUCIDE_STROKE_ACTIVE = 2;
const HOME_ICON_INACTIVE = require("../../assets/pup-icon.png");
const HOME_ICON_SIZE = 30;

function TabBarItem({
  tabKey,
  label,
  accessibilityLabel,
  isActive,
  onPress,
  badgeCount,
}: {
  tabKey: "Home" | "SavedPlaces" | "Explore" | "Profile";
  label: string;
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
      <View style={styles.tabColumn}>
        <View style={styles.iconWrap}>
          {tabKey === "Home" ? (
            <Image
              source={HOME_ICON_INACTIVE}
              style={styles.homeIcon}
              resizeMode="contain"
            />
          ) : tabKey === "SavedPlaces" ? (
            <MapPinned
              size={24}
              color={TAB_ICON_COLOR}
              style={styles.tabIconMap}
              strokeWidth={isActive ? TAB_BAR_LUCIDE_STROKE_ACTIVE : TAB_BAR_LUCIDE_STROKE}
            />
          ) : tabKey === "Explore" ? (
            <Compass
              size={24}
              color={TAB_ICON_COLOR}
              style={styles.tabIconMap}
              strokeWidth={isActive ? TAB_BAR_LUCIDE_STROKE_ACTIVE : TAB_BAR_LUCIDE_STROKE}
            />
          ) : (
            <CircleUser
              size={24}
              color={TAB_ICON_COLOR}
              style={[styles.tabIconMap, styles.tabIconLucideUser]}
              strokeWidth={isActive ? TAB_BAR_LUCIDE_STROKE_ACTIVE : TAB_BAR_LUCIDE_STROKE}
            />
          )}
          {badgeLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            styles.tabLabelSide,
            isActive && styles.tabLabelActive,
          ]}
          pointerEvents="none"
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function NuzzleTabBar({ state, navigation }: BottomTabBarProps) {
  const onTabBarHeightChange = React.useContext(BottomTabBarHeightCallbackContext);
  const insets = useSafeAreaInsets();
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



  return (
    <Animated.View
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom - 45, spacing.xxs) + 8 },
        animatedBarStyle,
      ]}
      onLayout={(e) => onTabBarHeightChange?.(e.nativeEvent.layout.height)}
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
                  hitSlop={6}
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
                  <DogPawIcon size={22} color="#FFFFFF" />
                </AnimatedPressable>
                <Text
                  numberOfLines={1}
                  pointerEvents="none"
                  style={[
                    styles.tabLabel,
                    styles.tabLabelCenter,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          }

          return (
            <TabBarItem
              key={item.key}
              tabKey={item.key as "Home" | "SavedPlaces" | "Explore" | "Profile"}
              label={item.label}
              accessibilityLabel={item.label}
              isActive={isActive}
              onPress={() => {
                const route = state.routes.find((r) => r.name === item.key);
                const event = navigation.emit({
                  type: "tabPress",
                  target: route?.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(item.key);
                }
              }}
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
    bottom: -NUZZLE_TAB_BAR_LAYOUT_EXTENDS_BELOW_SCREEN,
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
    paddingTop: spacing.sm + 1,
    paddingBottom: spacing.lg + 20,
    overflow: "visible",
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(231, 226, 216, 0.5)',
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: -spacing.sm,
    marginBottom: 1,
    paddingVertical: spacing.sm,
    transform: [{ translateY: 1 }],
    overflow: "visible",
  },
  tabColumn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "relative",
    overflow: "visible",
    top: 1,
    marginBottom: -5,
  },
  /** Typography only; position via tabLabelSide / tabLabelCenter so footer height matches pre-label bar */
  tabLabel: {
    marginTop: 0,
    fontSize: 10,
    lineHeight: 11,
    color: TAB_ICON_COLOR,
    textAlign: "center",
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "500" as const }
      : { fontFamily: "Inter_500Medium" as const }),
  },
  tabLabelSide: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -13,
  },
  tabLabelCenter: {
    position: "absolute",
    bottom: -15,
    left: "50%",
    marginLeft: -60,
    width: 120,
  },
  tabLabelActive: {
    color: TAB_ICON_COLOR,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "700" as const }
      : { fontFamily: "Inter_700Bold" as const }),
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    top: -7,
  },
  /** Profile icon: nudge up 1px vs Explore compass (Lucide optical alignment) */
  tabIconLucideUser: {
    transform: [{ translateY: 0 }],
  },
  tabIconMap: {
    position: "relative",
    top: 4,
    transform: [{ translateY: 0 }],
  },
  homeIcon: {
    width: HOME_ICON_SIZE,
    height: HOME_ICON_SIZE,
    transform: [{ translateY: 5 }],
    marginBottom: -3,
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
    top: -1,
    left: 0,
    height: 2,
    backgroundColor: TAB_ICON_COLOR,
    borderRadius: 2,
  },
  centerWrap: {
    flex: 1,
    position: "relative",
    overflow: "visible",
  },
  centerButton: {
    position: "absolute",
    bottom: 3,
    left: "50%",
    marginLeft: -22.5,
    width: 46,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
