import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationPromptStore } from '@/store/notificationPromptStore';
import { upsertPushToken } from '@/api/notifications';
import { captureHandledError } from '@/lib/sentry';
import { colors, radius, spacing, typography } from '@/theme';

const EXPO_PROJECT_ID = '9952a53a-55f7-4e7e-8a30-c7569e805021';

export function NotificationPrePrompt() {
  const visible = useUIStore((s) => s.notificationPromptVisible);
  const hideNotificationPrompt = useUIStore((s) => s.hideNotificationPrompt);
  const user = useAuthStore((s) => s.user);
  const { attemptCount, setAttemptCount } = useNotificationPromptStore();

  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      animVal.setValue(0);
      Animated.timing(animVal, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleAllow = async () => {
    setAttemptCount('accepted');
    hideNotificationPrompt();

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted' || !user?.id || !Device.isDevice) return;

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });
      await upsertPushToken(user.id, token);
    } catch (err) {
      captureHandledError(err instanceof Error ? err : new Error(String(err)), {
        area: 'notification-pre-prompt.allow',
      });
    }
  };

  const handleNotNow = () => {
    const next = attemptCount === 0 ? 1 : 2;
    setAttemptCount(next as 1 | 2);
    hideNotificationPrompt();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleNotNow}
    >
      <Animated.View style={[styles.overlay, { opacity: animVal }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleNotNow} />
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: animVal,
              transform: [
                {
                  scale: animVal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={32} color={colors.primary} />
          </View>

          <Text style={styles.title}>Stay in the Loop</Text>
          <Text style={styles.body}>
            Get notified when someone replies to your posts, reacts to your content, or when new meetups are posted in your communities.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={handleAllow}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Turn On Notifications</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
            onPress={handleNotNow}
            accessibilityRole="button"
          >
            <Text style={styles.dismissText}>Not Now</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.titleMD,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    minHeight: 46,
  },
  primaryBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryBtnText: {
    ...typography.body,
    color: colors.surface,
  },
  dismissBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  dismissBtnPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  dismissText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
