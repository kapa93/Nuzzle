import React, { useEffect, useMemo } from "react";
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getHeaderTitle, Header } from "@react-navigation/elements";
import { Search } from "lucide-react-native/icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { colors, spacing } from "@/theme";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";

const HEADER_HIDE_OFFSET = 120;
const HEADER_ANIM_DURATION = 220;
/** Matches header notifications bell / tab bar Lucide stroke weight */
const HEADER_LUCIDE_STROKE = 2.25;
const SEARCH_ENABLED_ROUTES = new Set([
  "HomeFeed",
  "ExploreList",
  "BreedFeed",
  "NotificationsMain",
  "ProfileMain",
  "SavedPlacesFeed",
]);

type Props = NativeStackHeaderProps & {
  animateOnScroll?: boolean;
  includeTopInset?: boolean;
  baseHeaderHeight?: number;
  titleImageMarginTop?: number;
  /** When true, no hairline under the header bar (e.g. Explore main list). */
  hideBottomBorder?: boolean;
};

export function AnimatedStackHeader({
  animateOnScroll = false,
  includeTopInset = true,
  baseHeaderHeight = 44,
  titleImageMarginTop = -9,
  hideBottomBorder = false,
  options,
  route,
  navigation,
  back,
}: Props) {
  const { width, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topInset = includeTopInset ? insets.top : 0;
  const headerHeight = baseHeaderHeight + topInset;
  const { scrollDirection } = useScrollDirection();
  const translateY = useSharedValue(0);
  const showSearchAction = SEARCH_ENABLED_ROUTES.has(route.name);

  useEffect(() => {
    const shouldHide = animateOnScroll && scrollDirection === "down";
    translateY.value = withTiming(shouldHide ? -HEADER_HIDE_OFFSET : 0, {
      duration: HEADER_ANIM_DURATION,
    });
  }, [scrollDirection, animateOnScroll]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [-HEADER_HIDE_OFFSET, 0],
      [0, 1]
    );
    return {
      opacity,
      transform: [{ translateY: translateY.value }],
    };
  });

  const defaultHeaderTitle = () => (
    <Image
      source={require("../../assets/breeds/nuzzle-logo.png")}
      style={{ width: 178.79, height: 41.58, marginTop: titleImageMarginTop }}
      resizeMode="contain"
    />
  );

  const mergedHeaderRight = useMemo(
    () =>
      (props: any) => {
        const customHeaderRight = options.headerRight?.(props) ?? null;
        if (!showSearchAction && !customHeaderRight) return null;

        const openSearch = () => {
          const rootNavigation =
            (navigation as any).getParent?.()?.getParent?.() ??
            (navigation as any).getParent?.() ??
            navigation;
          if (rootNavigation?.navigate) {
            rootNavigation.navigate("SearchModal", { launchKey: Date.now() });
            return;
          }
          (navigation as any).navigate("SearchMain", { launchKey: Date.now() });
        };

        return (
          <View style={styles.headerRightWrap}>
            {showSearchAction ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search posts"
                hitSlop={8}
                onPress={openSearch}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.searchButtonPressed,
                ]}
              >
                <Search
                  size={24}
                  color={colors.textPrimary}
                  strokeWidth={HEADER_LUCIDE_STROKE}
                />
              </Pressable>
            ) : null}
            {customHeaderRight}
          </View>
        );
      },
    [navigation, options.headerRight, showSearchAction]
  );

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
      pointerEvents="box-none"
    >
      {/* Stays visible when the header hides on scroll so the notch / status bar stay on a solid surface */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: topInset,
          backgroundColor: colors.surface,
          zIndex: 0,
        }}
      />
      <Animated.View style={[{ zIndex: 1 }, animatedStyle]} pointerEvents="box-none">
        <Header
          layout={{ width, height: screenHeight }}
          title={getHeaderTitle(options, route.name)}
          headerTitle={options.headerTitle ?? defaultHeaderTitle}
          headerLeft={options.headerLeft}
          headerRight={mergedHeaderRight}
          headerTransparent={false}
          headerTintColor={options.headerTintColor ?? "#000000"}
          headerBackButtonDisplayMode={options.headerBackButtonDisplayMode ?? "minimal"}
          headerStatusBarHeight={topInset}
          headerStyle={[
            options.headerStyle,
            {
              backgroundColor: colors.surface,
              height: headerHeight,
              borderBottomWidth: hideBottomBorder ? 0 : StyleSheet.hairlineWidth,
              borderBottomColor: hideBottomBorder ? "transparent" : "#000000",
              elevation: 0,
              shadowOpacity: 0,
              shadowRadius: 0,
            },
          ]}
          headerShadowVisible={false}
          headerTitleAlign={options.headerTitleAlign}
          back={back}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  searchButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    bottom: 2,
    right: 6,
    transform: [{ translateX: -1 }],
  },
  searchButtonPressed: {
    opacity: 0.82,
  },
});
