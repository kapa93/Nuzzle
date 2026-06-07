import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('@/lib/sentry', () => ({ captureHandledError: jest.fn() }));

jest.mock('@/api/notifications', () => ({
  upsertPushToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: 'user-123' } })),
}));

jest.mock('@/store/notificationPromptStore');
jest.mock('@/store/uiStore');

import { useNotificationPromptStore } from '@/store/notificationPromptStore';
import { useUIStore } from '@/store/uiStore';
import { upsertPushToken } from '@/api/notifications';
import { NotificationPrePrompt } from '@/components/NotificationPrePrompt';

const mockSetAttemptCount = jest.fn();
const mockHideNotificationPrompt = jest.fn();

function setupMocks({
  visible = true,
  attemptCount = 0,
}: {
  visible?: boolean;
  attemptCount?: 0 | 1 | 2 | 'accepted';
} = {}) {
  (useUIStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: object) => unknown) =>
      selector({
        notificationPromptVisible: visible,
        hideNotificationPrompt: mockHideNotificationPrompt,
      })
  );

  (useNotificationPromptStore as unknown as jest.Mock).mockReturnValue({
    attemptCount,
    setAttemptCount: mockSetAttemptCount,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
    data: 'ExponentPushToken[test-token]',
  });
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('NotificationPrePrompt rendering', () => {
  it('shows the title, body, and both action buttons when visible', () => {
    render(<NotificationPrePrompt />);

    expect(screen.getByText('Stay in the Loop')).toBeTruthy();
    expect(screen.getByText(/Get notified/i)).toBeTruthy();
    expect(screen.getByText('Turn On Notifications')).toBeTruthy();
    expect(screen.getByText('Not Now')).toBeTruthy();
  });

  it('does not show content when notificationPromptVisible is false', () => {
    setupMocks({ visible: false });
    render(<NotificationPrePrompt />);

    expect(screen.queryByText('Stay in the Loop')).toBeNull();
  });
});

// ─── "Turn On Notifications" — permission granted ─────────────────────────────

describe('"Turn On Notifications" button — permission granted', () => {
  it('sets attemptCount to "accepted"', async () => {
    render(<NotificationPrePrompt />);

    await act(async () => {
      fireEvent.press(screen.getByText('Turn On Notifications'));
    });

    expect(mockSetAttemptCount).toHaveBeenCalledWith('accepted');
  });

  it('calls requestPermissionsAsync', async () => {
    render(<NotificationPrePrompt />);

    await act(async () => {
      fireEvent.press(screen.getByText('Turn On Notifications'));
    });

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('closes the modal', async () => {
    render(<NotificationPrePrompt />);

    await act(async () => {
      fireEvent.press(screen.getByText('Turn On Notifications'));
    });

    expect(mockHideNotificationPrompt).toHaveBeenCalledTimes(1);
  });
});

// ─── "Turn On Notifications" — permission denied by iOS dialog ────────────────

describe('"Turn On Notifications" button — permission denied', () => {
  beforeEach(() => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  });

  it('still sets attemptCount to "accepted" (iOS dialog was shown)', async () => {
    render(<NotificationPrePrompt />);

    await act(async () => {
      fireEvent.press(screen.getByText('Turn On Notifications'));
    });

    expect(mockSetAttemptCount).toHaveBeenCalledWith('accepted');
  });

  it('does not call upsertPushToken', async () => {
    render(<NotificationPrePrompt />);

    await act(async () => {
      fireEvent.press(screen.getByText('Turn On Notifications'));
    });

    expect(upsertPushToken).not.toHaveBeenCalled();
  });

  it('still closes the modal', async () => {
    render(<NotificationPrePrompt />);

    await act(async () => {
      fireEvent.press(screen.getByText('Turn On Notifications'));
    });

    expect(mockHideNotificationPrompt).toHaveBeenCalledTimes(1);
  });
});

// ─── "Not Now" — first dismissal (attemptCount 0 → 1) ────────────────────────

describe('"Not Now" button — first dismissal', () => {
  it('sets attemptCount to 1', () => {
    setupMocks({ attemptCount: 0 });
    render(<NotificationPrePrompt />);

    fireEvent.press(screen.getByText('Not Now'));

    expect(mockSetAttemptCount).toHaveBeenCalledWith(1);
  });

  it('closes the modal', () => {
    render(<NotificationPrePrompt />);

    fireEvent.press(screen.getByText('Not Now'));

    expect(mockHideNotificationPrompt).toHaveBeenCalledTimes(1);
  });

  it('does not call requestPermissionsAsync', () => {
    render(<NotificationPrePrompt />);

    fireEvent.press(screen.getByText('Not Now'));

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

// ─── "Not Now" — second dismissal (attemptCount 1 → 2) ───────────────────────

describe('"Not Now" button — second dismissal', () => {
  it('sets attemptCount to 2 (never show again)', () => {
    setupMocks({ attemptCount: 1 });
    render(<NotificationPrePrompt />);

    fireEvent.press(screen.getByText('Not Now'));

    expect(mockSetAttemptCount).toHaveBeenCalledWith(2);
  });

  it('closes the modal', () => {
    setupMocks({ attemptCount: 1 });
    render(<NotificationPrePrompt />);

    fireEvent.press(screen.getByText('Not Now'));

    expect(mockHideNotificationPrompt).toHaveBeenCalledTimes(1);
  });
});
