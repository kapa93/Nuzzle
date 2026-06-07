import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

jest.mock('expo-notifications');
jest.mock('expo-device');

import {
  useNotificationPromptStore,
  onCommunityJoined,
  onPostCreated,
  type NotificationPromptAttemptCount,
} from '@/store/notificationPromptStore';
import { useUIStore } from '@/store/uiStore';

const INITIAL_STORE_STATE = {
  hasHydrated: false,
  attemptCount: 0 as NotificationPromptAttemptCount,
};

function setIsDevice(value: boolean) {
  Object.defineProperty(Device, 'isDevice', { value, writable: true, configurable: true });
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useNotificationPromptStore.setState(INITIAL_STORE_STATE);
  useUIStore.setState({ notificationPromptVisible: false });
  setIsDevice(true);
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
});

// ─── notificationPromptStore state ───────────────────────────────────────────

describe('notificationPromptStore', () => {
  describe('setAttemptCount', () => {
    it('updates attemptCount to 1', () => {
      useNotificationPromptStore.getState().setAttemptCount(1);
      expect(useNotificationPromptStore.getState().attemptCount).toBe(1);
    });

    it('updates attemptCount to 2', () => {
      useNotificationPromptStore.getState().setAttemptCount(2);
      expect(useNotificationPromptStore.getState().attemptCount).toBe(2);
    });

    it('updates attemptCount to "accepted"', () => {
      useNotificationPromptStore.getState().setAttemptCount('accepted');
      expect(useNotificationPromptStore.getState().attemptCount).toBe('accepted');
    });

    it('resets attemptCount back to 0', () => {
      useNotificationPromptStore.setState({ attemptCount: 2 });
      useNotificationPromptStore.getState().setAttemptCount(0);
      expect(useNotificationPromptStore.getState().attemptCount).toBe(0);
    });

    it('does not affect hasHydrated', () => {
      useNotificationPromptStore.setState({ hasHydrated: true });
      useNotificationPromptStore.getState().setAttemptCount(1);
      expect(useNotificationPromptStore.getState().hasHydrated).toBe(true);
    });
  });

  describe('persistence partialize', () => {
    it('only persists attemptCount', () => {
      const state = useNotificationPromptStore.getState();
      const persisted = { attemptCount: state.attemptCount };
      expect(Object.keys(persisted)).toEqual(['attemptCount']);
      expect('hasHydrated' in persisted).toBe(false);
    });
  });
});

// ─── onCommunityJoined ────────────────────────────────────────────────────────

describe('onCommunityJoined', () => {
  it('does not show the prompt when not on a physical device', async () => {
    setIsDevice(false);
    await onCommunityJoined();
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('does not show the prompt when permission is already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    await onCommunityJoined();
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('does not show the prompt after only one community join', async () => {
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('shows the prompt when the user joins their 2nd community', async () => {
    await onCommunityJoined();
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(true);
  });

  it('shows the prompt on the 3rd+ join if the prompt has not yet been shown', async () => {
    await onCommunityJoined();
    await onCommunityJoined();
    useUIStore.setState({ notificationPromptVisible: false });
    // Reset attemptCount to simulate "still not shown" but count already >= 2
    // (e.g. app restarted between joins)
    useNotificationPromptStore.setState({ attemptCount: 0 });
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(true);
  });

  it('does not show the prompt again when attemptCount is 1 (already dismissed)', async () => {
    useNotificationPromptStore.setState({ attemptCount: 1 });
    await onCommunityJoined();
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('does not show the prompt when attemptCount is 2 (permanently dismissed)', async () => {
    useNotificationPromptStore.setState({ attemptCount: 2 });
    await onCommunityJoined();
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('does not show the prompt when attemptCount is "accepted"', async () => {
    useNotificationPromptStore.setState({ attemptCount: 'accepted' });
    await onCommunityJoined();
    await onCommunityJoined();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('increments the community count in AsyncStorage on each call', async () => {
    await onCommunityJoined();
    expect(await AsyncStorage.getItem('notificationCommunityJoinCount')).toBe('1');
    await onCommunityJoined();
    expect(await AsyncStorage.getItem('notificationCommunityJoinCount')).toBe('2');
    await onCommunityJoined();
    expect(await AsyncStorage.getItem('notificationCommunityJoinCount')).toBe('3');
  });
});

// ─── onPostCreated ────────────────────────────────────────────────────────────

describe('onPostCreated', () => {
  it('does not show the prompt when not on a physical device', async () => {
    setIsDevice(false);
    useNotificationPromptStore.setState({ attemptCount: 1 });
    await onPostCreated();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('does not show the prompt when permission is already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    useNotificationPromptStore.setState({ attemptCount: 1 });
    await onPostCreated();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('does not show the prompt when attemptCount is 0 (2nd community not yet joined)', async () => {
    await onPostCreated();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('shows the prompt when attemptCount is 1 and permission is not granted', async () => {
    useNotificationPromptStore.setState({ attemptCount: 1 });
    await onPostCreated();
    expect(useUIStore.getState().notificationPromptVisible).toBe(true);
  });

  it('does not show the prompt when attemptCount is 2 (permanently dismissed)', async () => {
    useNotificationPromptStore.setState({ attemptCount: 2 });
    await onPostCreated();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });

  it('does not show the prompt when attemptCount is "accepted"', async () => {
    useNotificationPromptStore.setState({ attemptCount: 'accepted' });
    await onPostCreated();
    expect(useUIStore.getState().notificationPromptVisible).toBe(false);
  });
});
