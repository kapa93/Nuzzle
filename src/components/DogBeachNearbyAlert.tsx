import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type Props = {
  onCheckIn: () => void;
  disabled?: boolean;
};

export function DogBeachNearbyAlert({ onCheckIn, disabled }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const animatedStyle = {
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
    ],
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.95],
    }),
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.banner}>
        <View style={styles.left}>
          <Ionicons name="location" size={22} color="#FFFFFF" />
          <View style={styles.textWrap}>
            <Text style={styles.title}>Dog Beach nearby</Text>
            <Text style={styles.subtitle}>Check in with your dog?</Text>
          </View>
        </View>
        <Pressable
          onPress={disabled ? undefined : onCheckIn}
          style={({ pressed }) => [styles.cta, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={styles.ctaText}>Check In</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyMuted,
    color: '#F3F4F6',
    marginTop: 1,
  },
  cta: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  ctaText: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
});
