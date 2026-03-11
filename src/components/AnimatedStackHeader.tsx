import React, { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getHeaderTitle, Header } from "@react-navigation/elements";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { colors } from "@/theme";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";

const HEADER_HIDE_OFFSET = 120;
const HEADER_ANIM_DURATION = 220;

type Props = NativeStackHeaderProps & { animateOnScroll?: boolean };

export function AnimatedStackHeader({
  animateOnScroll = false,
  options,
  route,
  navigation,
  back,
}: Props) {
  const { width, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = 39 + insets.top; // 39 = 5px shorter than default (44)
  const { scrollDirection } = useScrollDirection();
  const translateY = useSharedValue(0);

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

  const title = getHeaderTitle(options, route.name);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Header
        layout={{ width, height: screenHeight }}
        title={title}
        headerTitle={options.headerTitle}
        headerLeft={options.headerLeft}
        headerRight={options.headerRight}
        headerTransparent={false}
        headerTintColor={options.headerTintColor}
        headerStyle={[
          options.headerStyle,
          { backgroundColor: colors.background, height: headerHeight },
        ]}
        headerShadowVisible={options.headerShadowVisible}
        headerTitleAlign={options.headerTitleAlign}
        back={back}
      />
    </Animated.View>
  );
}
