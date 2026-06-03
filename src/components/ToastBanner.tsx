import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { colors } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const BG: Record<string, string> = {
  success: colors.primary,
  error: '#D9534F',
  info: '#3B82F6',
};

const AUTO_HIDE_MS = 3000;

export function ToastBanner() {
  const { toast, hideToast } = useUIStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const everShownRef = useRef(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (toast.visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
      timerRef.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }).start(() => hideToast());
      }, AUTO_HIDE_MS);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.visible, toast.message]);

  const insets = useSafeAreaInsets();

  if (toast.visible) everShownRef.current = true;
  if (!toast.visible && !everShownRef.current) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: BG[toast.type] ?? BG.success, top: insets.top + 12 },
        { transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Ionicons
        name={ICON[toast.type] ?? ICON.success}
        size={18}
        color="#fff"
        style={styles.icon}
      />
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  icon: { marginRight: 8 },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
  },
});
