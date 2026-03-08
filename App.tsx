import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Linking, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { AUTH_CALLBACK_URL } from '@/api/auth';

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

function handleAuthUrl(url: string) {
  if (!url.startsWith(AUTH_CALLBACK_URL.split('#')[0])) return;
  const { access_token, refresh_token } = parseAuthParamsFromUrl(url);
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token }).then(({ data }) => {
      useAuthStore.getState().setSession(data.session);
    });
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <RootNavigator />
        </View>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
