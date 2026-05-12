// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));

jest.mock('@/api/auth', () => ({
  signUp: jest.fn(),
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

jest.mock('lucide-react-native', () => ({
  Mail: () => null,
  Lock: () => null,
  MapPin: () => null,
  User: () => null,
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { signUp } from '@/api/auth';
import { useOnboardingStore } from '@/store/onboardingStore';
import { SignUpScreen } from './SignUpScreen';

const mockUseNavigation = useNavigation as jest.Mock;
const mockSignUp = signUp as jest.Mock;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SignUpScreen', () => {
  const mockNavigate = jest.fn();
  const mockSetNeedsOnboarding = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({ navigate: mockNavigate });
    (useOnboardingStore.getState as jest.Mock).mockReturnValue({
      setNeedsOnboarding: mockSetNeedsOnboarding,
    });
  });

  it('renders all form fields', () => {
    render(<SignUpScreen />);
    expect(screen.getByPlaceholderText('Name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password (min 6 characters)')).toBeTruthy();
    expect(screen.getByPlaceholderText('City (optional)')).toBeTruthy();
  });

  it('renders the Sign Up button', () => {
    render(<SignUpScreen />);
    expect(screen.getByText('Sign Up')).toBeTruthy();
  });

  it('renders the link to sign in', () => {
    render(<SignUpScreen />);
    expect(screen.getByText('Already have an account? Sign in')).toBeTruthy();
  });

  it('navigates to SignIn when sign-in link is pressed', () => {
    render(<SignUpScreen />);
    fireEvent.press(screen.getByText('Already have an account? Sign in'));
    expect(mockNavigate).toHaveBeenCalledWith('SignIn');
  });

  it('shows validation error for empty name', async () => {
    render(<SignUpScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
      expect(screen.getByText('Name is required')).toBeTruthy();
    });
  });

  it('shows Zod validation error for invalid email', async () => {
    render(<SignUpScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'not-an-email');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  it('calls signUp with trimmed name and credentials', async () => {
    mockSignUp.mockResolvedValue({ session: null });
    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Name'), '  Alice  ');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'alice@example.com',
        'password123',
        'Alice',
        undefined
      );
    });
  });

  it('sets needsOnboarding to true before the API call', async () => {
    mockSignUp.mockResolvedValue({ session: null });
    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockSetNeedsOnboarding).toHaveBeenCalledWith(true);
    });
  });

  it('navigates to SignIn with success message when email confirmation is required', async () => {
    mockSignUp.mockResolvedValue({ session: null });
    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('SignIn', {
        message: 'Check your email to confirm your account.',
      });
    });
  });

  it('shows error and resets needsOnboarding when signUp throws', async () => {
    mockSignUp.mockRejectedValue(new Error('Email already registered'));
    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeTruthy();
      expect(mockSetNeedsOnboarding).toHaveBeenCalledWith(false);
    });
  });

  it('passes city to signUp when provided', async () => {
    mockSignUp.mockResolvedValue({ session: null });
    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123');
    fireEvent.changeText(screen.getByPlaceholderText('City (optional)'), 'San Francisco');
    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'alice@example.com',
        'password123',
        'Alice',
        'San Francisco'
      );
    });
  });
});
