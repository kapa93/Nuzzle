jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => insets,
  };
});

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 1, High: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@/hooks/useDogSpotVibes', () => ({
  useListDogSpotVibes: jest.fn(() => ({ vibesByPlace: new Map() })),
}));

jest.mock('@/store/uiStore', () => ({
  useUIStore: jest.fn((selector: (s: { showLocationModal: () => void }) => unknown) =>
    selector({ showLocationModal: jest.fn() })
  ),
}));

jest.mock('@/store/locationStore', () => {
  const mockGetState = jest.fn(() => ({
    manualLocation: null,
    hasSeenLocationModal: false,
    locationSetupVersion: 0,
  }));
  return {
    useLocationStore: Object.assign(
      jest.fn((selector: (s: { locationSetupVersion: number }) => unknown) =>
        selector({ locationSetupVersion: 0 })
      ),
      { getState: mockGetState }
    ),
    __mockGetState: mockGetState,
  };
});

jest.mock('@/components/NotificationBell', () => ({
  NotificationBell: () => null,
}));

jest.mock('@/api/places', () => ({
  getDogSpotsNearby: jest.fn(),
  getGooglePlacePhotoUrl: jest.fn(() => 'https://example.com/photo.jpg'),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { DogFriendlyPlacesScreen } from '@/screens/DogFriendlyPlacesScreen';
import type { GooglePlaceCandidate } from '@/types';

const mockUseQuery = useQuery as jest.Mock;
const mockLocationPerms = Location.getForegroundPermissionsAsync as jest.Mock;
const mockLocationPosition = Location.getCurrentPositionAsync as jest.Mock;
const mockLocationLastKnown = Location.getLastKnownPositionAsync as jest.Mock;

const MOCK_NAVIGATION = { navigate: jest.fn(), setOptions: jest.fn() };

const MOCK_CANDIDATE: GooglePlaceCandidate = {
  googlePlaceId: 'google-1',
  name: 'Balboa Park',
  formattedAddress: 'San Diego, CA',
  shortFormattedAddress: 'San Diego, CA',
  latitude: 32.73,
  longitude: -117.14,
  city: 'San Diego',
  neighborhood: null,
  placeType: 'park',
  types: ['park'],
  rating: 4.5,
  ratingCount: 100,
  photos: [],
  attributions: [],
};

function setupGranted(candidates: GooglePlaceCandidate[] = []) {
  mockLocationPerms.mockResolvedValue({ status: 'granted', canAskAgain: true });
  mockLocationPosition.mockResolvedValue({
    coords: { latitude: 32.72, longitude: -117.16 },
  });

  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts.queryKey[0];
    if (key === 'dogSpots') return { data: candidates, isLoading: false, isError: false };
    return { data: undefined, isLoading: false, isError: false };
  });
}

function setupDenied() {
  mockLocationPerms.mockResolvedValue({ status: 'denied', canAskAgain: false });

  mockUseQuery.mockImplementation(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }));
}

describe('DogFriendlyPlacesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (MOCK_NAVIGATION.navigate as jest.Mock).mockClear();
    (MOCK_NAVIGATION.setOptions as jest.Mock).mockClear();
  });

  it('shows loading spinner on initial render', () => {
    mockLocationPerms.mockReturnValue(new Promise(() => {}));
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<DogFriendlyPlacesScreen navigation={MOCK_NAVIGATION} />);
    expect(screen.getByText('Finding dog-friendly spots…')).toBeTruthy();
  });

  it('shows dog-friendly spots section when location is granted', async () => {
    setupGranted();
    render(<DogFriendlyPlacesScreen navigation={MOCK_NAVIGATION} />);

    await waitFor(() => {
      expect(screen.getByText('Dog-Friendly Spots Nearby')).toBeTruthy();
    });
  });

  it('shows filter chips when location is granted', async () => {
    setupGranted();
    render(<DogFriendlyPlacesScreen navigation={MOCK_NAVIGATION} />);

    await waitFor(() => {
      expect(screen.getByText('All')).toBeTruthy();
    });
    expect(screen.getByText('Cafes')).toBeTruthy();
    expect(screen.getByText('Bars')).toBeTruthy();
    expect(screen.getByText('Breweries')).toBeTruthy();
  });

  it('shows the location empty state when location is denied and no manual location', async () => {
    setupDenied();
    render(<DogFriendlyPlacesScreen navigation={MOCK_NAVIGATION} />);

    await waitFor(() => {
      expect(screen.getByText('Set a location to find dog-friendly spots')).toBeTruthy();
    });
    expect(screen.getByText('Set Location')).toBeTruthy();
  });

  it('renders candidate spot names when results are available', async () => {
    setupGranted([MOCK_CANDIDATE]);
    render(<DogFriendlyPlacesScreen navigation={MOCK_NAVIGATION} />);

    await waitFor(() => {
      expect(screen.getByText('Balboa Park')).toBeTruthy();
    });
  });

  it('does not show loading spinner after location resolves', async () => {
    setupGranted();
    render(<DogFriendlyPlacesScreen navigation={MOCK_NAVIGATION} />);

    await waitFor(() => {
      expect(screen.queryByText('Finding dog-friendly spots…')).toBeNull();
    });
  });

  it('falls back to last known position when getCurrentPositionAsync fails', async () => {
    mockLocationPerms.mockResolvedValue({ status: 'granted', canAskAgain: true });
    mockLocationPosition.mockRejectedValue(new Error('GPS timeout'));
    mockLocationLastKnown.mockResolvedValue({
      coords: { latitude: 32.70, longitude: -117.15 },
    });
    mockUseQuery.mockImplementation(() => ({
      data: [],
      isLoading: false,
      isError: false,
    }));

    render(<DogFriendlyPlacesScreen navigation={MOCK_NAVIGATION} />);

    await waitFor(() => {
      expect(screen.getByText('Dog-Friendly Spots Nearby')).toBeTruthy();
    });
  });
});
