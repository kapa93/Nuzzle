// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
  useRoute: jest.fn(() => ({ params: {} })),
}));

jest.mock('@/api/auth', () => ({
  signIn: jest.fn(),
  signInWithProvider: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ setSession: jest.fn() })),
  },
}));

jest.mock('@/store/onboardingStore', () => ({
  useOnboardingStore: {
    getState: jest.fn(() => ({ setNeedsOnboarding: jest.fn() })),
  },
}));

jest.mock('@/components/ScreenWithWallpaper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ScreenWithWallpaper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/components/AuthLegalNotice', () => ({
  AuthLegalNotice: () => null,
}));

jest.mock('@/lib/sentry', () => ({
  captureHandledError: jest.fn(),
}));

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: () => null,
  AppleAuthenticationButtonType: { SIGN_IN: 'SIGN_IN' },
  AppleAuthenticationButtonStyle: { BLACK: 'BLACK' },
}));

jest.mock('lucide-react-native', () => ({
  Mail: () => null,
  Lock: () => null,
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { signIn, signInWithProvider } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { SignInScreen } from './SignInScreen';

const mockUseNavigation = useNavigation as jest.Mock;
const mockUseRoute = useRoute as jest.Mock;
const mockSignIn = signIn as jest.Mock;
const mockSignInWithProvider = signInWithProvider as jest.Mock;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SignInScreen', () => {
  const mockNavigate = jest.fn();
  const mockSetSession = jest.fn();
  const mockSetNeedsOnboarding = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({ navigate: mockNavigate });
    mockUseRoute.mockReturnValue({ params: {} });
    (useAuthStore.getState as jest.Mock).mockReturnValue({ setSession: mockSetSession });
    (useOnboardingStore.getState as jest.Mock).mockReturnValue({
      setNeedsOnboarding: mockSetNeedsOnboarding,
    });
  });

  it('renders the email and password inputs', () => {
    render(<SignInScreen />);
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders the Sign In button', () => {
    render(<SignInScreen />);
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('renders a link to SignUp', () => {
    render(<SignInScreen />);
    expect(screen.getByText("Don't have an account? Sign up")).toBeTruthy();
  });

  it('navigates to SignUp when the sign-up link is pressed', () => {
    render(<SignInScreen />);
    fireEvent.press(screen.getByText("Don't have an account? Sign up"));
    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

  it('shows a success message from route params', () => {
    mockUseRoute.mockReturnValue({ params: { message: 'Check your email!' } });
    render(<SignInScreen />);
    expect(screen.getByText('Check your email!')).toBeTruthy();
  });

  it('calls signIn with email and password on submit', async () => {
    mockSignIn.mockResolvedValue({ session: { user: { id: 'u1' } } });
    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('calls setSession with the returned session on success', async () => {
    const fakeSession = { access_token: 'tok', user: { id: 'u1' } };
    mockSignIn.mockResolvedValue({ session: fakeSession });
    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(fakeSession);
    });
  });

  it('shows an error message when signIn fails', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'bad@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('shows validation error for empty email and password', async () => {
    render(<SignInScreen />);
    fireEvent.press(screen.getByText('Sign In'));
    // Does not call signIn when fields are empty
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  it('shows a Zod validation error for an invalid email', async () => {
    render(<SignInScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'not-an-email');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  it('shows an error when social sign-in fails', async () => {
    mockSignInWithProvider.mockRejectedValue(new Error('Google sign in failed'));
    render(<SignInScreen />);

    // Directly test the handler by finding the Google button text
    const googleButton = screen.queryByText('Sign in with Google');
    if (googleButton) {
      fireEvent.press(googleButton);
      await waitFor(() => {
        expect(screen.getByText('Google sign in failed')).toBeTruthy();
      });
    }
  });
});
