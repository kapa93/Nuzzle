import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Linking, View, StyleSheet, Text, TextInput, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ScrollDirectionProvider } from '@/context/ScrollDirectionContext';
import { colors } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { isAuthCallbackUrl } from '@/api/auth';
import { captureHandledError } from '@/lib/sentry';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Show push notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type ComponentWithDefaultStyle = {
  defaultProps?: { style?: unknown };
};

const defaultFontFamily =
  Platform.OS === 'web' ? "'Inter', sans-serif" : 'Inter_400Regular';
const defaultLetterSpacing = -0.12;

function applyGlobalDefaultFont() {
  const textDefaultStyle = {
    fontFamily: defaultFontFamily,
    letterSpacing: defaultLetterSpacing,
  };
  const applyStyle = (component: ComponentWithDefaultStyle) => {
    const currentDefaultStyle = component.defaultProps?.style;
    component.defaultProps = {
      ...component.defaultProps,
      style: StyleSheet.flatten([currentDefaultStyle, textDefaultStyle]),
    };
  };

  applyStyle(Text as unknown as ComponentWithDefaultStyle);
  applyStyle(TextInput as unknown as ComponentWithDefaultStyle);
}

function parseAuthParamsFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};
  const hash = url.slice(hashIndex + 1);
  const params: Record<string, string> = {};
  hash.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) params[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return {
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  };
}

function parseQueryParam(url: string, key: string): string | null {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return null;
  const hashStart = url.indexOf('#', queryStart);
  const query = url.slice(queryStart + 1, hashStart === -1 ? undefined : hashStart);
  for (const pair of query.split('&')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    if (decodeURIComponent(pair.slice(0, eqIdx)) === key) {
      return decodeURIComponent(pair.slice(eqIdx + 1));
    }
  }
  return null;
}

async function handleAuthUrl(url: string) {
  if (!isAuthCallbackUrl(url)) return;

  // PKCE flow: Supabase redirects with ?code= after verifying the email token.
  // The app must exchange this code for a session.
  const code = parseQueryParam(url, 'code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      useAuthStore.getState().setSession(data.session);
    }
    return;
  }

  // Implicit / magic-link fallback: tokens arrive in the URL hash fragment.
  const { access_token, refresh_token } = parseAuthParamsFromUrl(url);
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token }).then(({ data }) => {
      useAuthStore.getState().setSession(data.session);
    });
  }
}

function AppErrorFallback() {
  return (
    <View style={styles.errorFallback}>
      <Text style={styles.errorFallbackTitle}>Something went wrong</Text>
      <Text style={styles.errorFallbackBody}>Please restart the app. The error has been reported.</Text>
    </View>
  );
}

/**
 * Registers the device push token and listens for notification interactions.
 * Rendered inside QueryClientProvider so it can invalidate queries on arrival.
 */
function PushNotificationManager() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  usePushNotifications(user?.id ?? '');

  // Supabase Realtime: invalidate the notifications cache whenever a new row
  // lands for this user — keeps the bell badge and sheet up to date without
  // requiring a push notification to arrive.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  useEffect(() => {
    if (!user?.id) return;

    // Invalidate the notifications query when a push arrives while foregrounded
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', user.id] });
    });

    // Navigate to PostDetail when the user taps a notification
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const postId = response.notification.request.content.data?.postId as string | undefined;
      if (postId) {
        Linking.openURL(`nuzzle://post/${postId}`).catch((err) =>
          captureHandledError(err instanceof Error ? err : new Error(String(err)), {
            area: 'push-notifications.tap',
          })
        );
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user?.id, queryClient]);

  return null;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      captureHandledError(error, {
        area: 'react-query.query',
        extra: {
          queryKey: JSON.stringify(query.queryKey),
          queryStatus: query.state.status,
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      captureHandledError(error, {
        area: 'react-query.mutation',
        extra: {
          mutationKey: JSON.stringify(mutation.options.mutationKey ?? []),
        },
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) applyGlobalDefaultFont();
  }, [fontsLoaded]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
      <PostHogProvider client={posthog} autocapture={{ captureScreens: false }}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ScrollDirectionProvider>
              <View style={styles.root}>
                <RootNavigator />
              </View>
            </ScrollDirectionProvider>
            <StatusBar style="auto" />
            <PushNotificationManager />
          </SafeAreaProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </Sentry.ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  errorFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorFallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorFallbackBody: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
