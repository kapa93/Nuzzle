jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('@/store/authStore', () => {
  const setNeedsOnboarding = jest.fn();
  const useAuthStore = jest.fn(() => ({}));
  useAuthStore.getState = jest.fn(() => ({ setNeedsOnboarding }));
  return { useAuthStore };
});

jest.mock('@/components/ScreenWithWallpaper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ScreenWithWallpaper: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { useAuthStore } from '@/store/authStore';

describe('OnboardingScreen', () => {
  const navigate = jest.fn();
  const setNeedsOnboarding = (useAuthStore.getState as jest.Mock)().setNeedsOnboarding as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({ navigate });
    (useAuthStore.getState as jest.Mock).mockReturnValue({ setNeedsOnboarding });
  });

  it('renders the welcome heading and supporting copy', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Welcome to BreedBuddy!')).toBeTruthy();
    expect(screen.getByText(/Connect with dogs of the same breed/)).toBeTruthy();
  });

  it('renders both action buttons', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Add Dog Profile')).toBeTruthy();
    expect(screen.getByText('Skip for now')).toBeTruthy();
  });

  it('"Add Dog Profile" navigates to EditDog with fromOnboarding: true', () => {
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByText('Add Dog Profile'));

    expect(navigate).toHaveBeenCalledWith('EditDog', { fromOnboarding: true });
  });

  it('"Skip for now" calls setNeedsOnboarding(false)', () => {
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByText('Skip for now'));

    expect(setNeedsOnboarding).toHaveBeenCalledWith(false);
  });
});
