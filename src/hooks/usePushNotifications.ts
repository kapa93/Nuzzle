import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { captureHandledError } from '@/lib/sentry';
import { upsertPushToken, deletePushToken } from '@/api/notifications';

/**
 * Requests push notification permission, registers the Expo push token with
 * Supabase, and cleans it up on unmount (e.g. after sign-out).
 *
 * Must be called only when a user session is active.
 */
export function usePushNotifications(userId: string) {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function register() {
      // Don't prompt until the user is signed in
      if (!userId) return;
      // Push tokens only work on physical devices
      if (!Device.isDevice) return;
      // Web is unsupported
      if (Platform.OS === 'web') return;

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        // projectId is required for bare / EAS builds
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: '9952a53a-55f7-4e7e-8a30-c7569e805021',
        });

        if (cancelled) return;
        tokenRef.current = token;
        await upsertPushToken(userId, token);
      } catch (err) {
        captureHandledError(err instanceof Error ? err : new Error(String(err)), {
          area: 'push-notifications.register',
        });
      }
    }

    const timer = setTimeout(register, 5000);

    return () => {
      clearTimeout(timer);
      cancelled = true;
      // Remove the token from Supabase when the user signs out
      if (tokenRef.current) {
        deletePushToken(tokenRef.current).catch((err) =>
          captureHandledError(err instanceof Error ? err : new Error(String(err)), {
            area: 'push-notifications.unregister',
          })
        );
        tokenRef.current = null;
      }
    };
  }, [userId]);
}
