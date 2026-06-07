import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useUIStore } from './uiStore';

export type NotificationPromptAttemptCount = 0 | 1 | 2 | 'accepted';

const COMMUNITY_COUNT_KEY = 'notificationCommunityJoinCount';

interface NotificationPromptState {
  hasHydrated: boolean;
  /** Tracks how many times the user has interacted with the notification pre-prompt. */
  attemptCount: NotificationPromptAttemptCount;
  setHasHydrated: (v: boolean) => void;
  setAttemptCount: (v: NotificationPromptAttemptCount) => void;
}

export const useNotificationPromptStore = create<NotificationPromptState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      attemptCount: 0,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setAttemptCount: (attemptCount) => set({ attemptCount }),
    }),
    {
      name: 'notification-prompt-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ attemptCount: state.attemptCount }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

async function getCommunityJoinCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(COMMUNITY_COUNT_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

async function incrementCommunityJoinCount(): Promise<number> {
  const current = await getCommunityJoinCount();
  const next = current + 1;
  await AsyncStorage.setItem(COMMUNITY_COUNT_KEY, String(next));
  return next;
}

/**
 * Call from any community join success callback (breed joins, place saves, place interests).
 * Shows the notification pre-permission prompt when the user joins their 2nd community.
 */
export async function onCommunityJoined(): Promise<void> {
  if (!Device.isDevice || Platform.OS === 'web') return;
  const newCount = await incrementCommunityJoinCount();
  if (newCount < 2) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return;
  const { attemptCount } = useNotificationPromptStore.getState();
  if (attemptCount !== 0) return;
  useUIStore.getState().showNotificationPrompt();
}

/**
 * Call from CreatePostScreen onSuccess.
 * Shows the notification pre-permission prompt on the first post after the user declined once.
 */
export async function onPostCreated(): Promise<void> {
  if (!Device.isDevice || Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return;
  const { attemptCount } = useNotificationPromptStore.getState();
  if (attemptCount !== 1) return;
  useUIStore.getState().showNotificationPrompt();
}
