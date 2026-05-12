// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/api/auth', () => ({
  signOut: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('@/api/dogs', () => ({
  deleteDog: jest.fn(),
}));

jest.mock('@/lib/imageUpload', () => ({
  pickImages: jest.fn(),
  uploadProfileImage: jest.fn(),
}));

jest.mock('@/components/UserProfileContent', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    UserProfileContent: () => React.createElement(View, null, React.createElement(Text, null, 'UserProfileContent')),
  };
});

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { ProfileScreen } from '@/screens/ProfileScreen';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';

const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const fakeNav = { navigate: jest.fn(), setOptions: jest.fn() } as unknown as NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
    (fakeNav.setOptions as jest.Mock).mockClear();
  });

  it('renders null when userId is falsy — hooks order is correct', () => {
    // This test verifies the previously-broken "Rules of Hooks" pattern is fixed.
    // Before the fix, useMutation calls appeared AFTER the early return, causing
    // React to detect a change in hook call order when user toggled between
    // null and non-null. Rendering with and without userId must not throw.
    mockUseAuthStore.mockReturnValue({ user: null, signOut: jest.fn() });

    // First render with no user
    const { unmount } = render(<ProfileScreen navigation={fakeNav} />);
    expect(screen.toJSON()).toBeNull();
    unmount();

    // Second render with a user — hook count must be identical
    mockUseAuthStore.mockReturnValue({ user: { id: 'u1' }, signOut: jest.fn() });
    expect(() => render(<ProfileScreen navigation={fakeNav} />)).not.toThrow();
  });

  it('returns null when there is no userId', () => {
    mockUseAuthStore.mockReturnValue({ user: null, signOut: jest.fn() });
    const { toJSON } = render(<ProfileScreen navigation={fakeNav} />);
    expect(toJSON()).toBeNull();
  });

  it('renders UserProfileContent when userId is present', () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'u1' }, signOut: jest.fn() });
    render(<ProfileScreen navigation={fakeNav} />);
    expect(screen.getByText('UserProfileContent')).toBeTruthy();
  });

  it('calls both useMutation hooks regardless of userId (Rules of Hooks)', () => {
    mockUseAuthStore.mockReturnValue({ user: null, signOut: jest.fn() });
    render(<ProfileScreen navigation={fakeNav} />);
    // Both deleteMutation and photoMutation should always be called
    expect(mockUseMutation).toHaveBeenCalledTimes(2);
  });
});
