jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('lucide-react-native', () => ({
  MapPinned: () => null,
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View: (props: React.ComponentProps<typeof View>) => React.createElement(View, props) },
    interpolate: () => 1,
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (cb: () => object) => cb(),
    withTiming: (value: unknown) => value,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 1 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@/utils/breedAssets', () => ({
  getPackItems: jest.fn(() => []),
}));

jest.mock('@/hooks/useSavedPlaces', () => ({
  useSavedPlaces: jest.fn(),
  useToggleSavedPlace: jest.fn(),
  useSavedPlacesWithActivity: jest.fn(),
}));

jest.mock('@/api/places', () => ({
  listActivePlaces: jest.fn(),
  getPlacePopularitySignals: jest.fn(),
  searchGooglePlacesWithOptions: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/components/MyPlacesSheet', () => ({
  MyPlacesSheet: () => null,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useSavedPlaces, useToggleSavedPlace, useSavedPlacesWithActivity } from '@/hooks/useSavedPlaces';
import { useAuthStore } from '@/store/authStore';
import { ExploreScreen } from '@/screens/ExploreScreen';
import type { Place } from '@/types';

const mockUseQuery = useQuery as jest.Mock;
const mockLocationPerms = Location.getForegroundPermissionsAsync as jest.Mock;
const mockLocationRequest = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockLocationPosition = Location.getCurrentPositionAsync as jest.Mock;
const mockUseSavedPlaces = useSavedPlaces as jest.Mock;
const mockUseToggleSavedPlace = useToggleSavedPlace as jest.Mock;
const mockUseSavedPlacesWithActivity = useSavedPlacesWithActivity as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const places: Place[] = [
  {
    id: 'saved-1',
    name: 'Saved Dog Park',
    slug: 'saved-dog-park',
    google_place_id: null,
    place_type: 'dog_park',
    city: 'San Diego',
    neighborhood: 'North Park',
    latitude: 32.73,
    longitude: -117.13,
    check_in_radius_meters: 250,
    check_in_duration_minutes: 60,
    description: null,
    is_active: true,
    supports_check_in: true,
    photos: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'place-2',
    name: 'Ocean Trail',
    slug: 'ocean-trail',
    google_place_id: null,
    place_type: 'trail',
    city: 'San Diego',
    neighborhood: 'La Jolla',
    latitude: 32.84,
    longitude: -117.28,
    check_in_radius_meters: 250,
    check_in_duration_minutes: 60,
    description: null,
    is_active: true,
    supports_check_in: true,
    photos: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function setup({
  searchResults = [],
  locationGranted = true,
  permissionStatus,
  canAskAgain,
  requestedStatus = 'granted',
}: {
  searchResults?: Array<{
    googlePlaceId: string;
    name: string;
    formattedAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    neighborhood: string | null;
    placeType: 'dog_beach' | 'dog_park' | 'trail' | 'park' | 'other';
    types: string[];
  }>;
  locationGranted?: boolean;
  permissionStatus?: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
  requestedStatus?: 'granted' | 'denied';
} = {}) {
  mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
  mockUseSavedPlaces.mockReturnValue({ savedPlaceIds: new Set(['saved-1']) });
  mockUseSavedPlacesWithActivity.mockReturnValue({ savedPlaces: [], dogCounts: {}, isLoading: false });
  mockUseToggleSavedPlace.mockReturnValue({ mutate: jest.fn(), isPending: false });

  const status = permissionStatus ?? (locationGranted ? 'granted' : 'denied');
  mockLocationPerms.mockResolvedValue({
    status,
    canAskAgain: canAskAgain ?? status === 'undetermined',
  });
  mockLocationRequest.mockResolvedValue({ status: requestedStatus, canAskAgain: requestedStatus !== 'denied' });
  mockLocationPosition.mockResolvedValue({
    coords: { latitude: 32.72, longitude: -117.16 },
  });

  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts.queryKey[0];
    if (key === 'places') return { data: places, isLoading: false };
    if (key === 'placePopularitySignals') {
      return {
        data: {
          'saved-1': { savedCount: 6, checkinCount: 2 },
          'place-2': { savedCount: 3, checkinCount: 10 },
        },
        isLoading: false,
      };
    }
    if (key === 'googlePlaces') return { data: searchResults, isFetching: false, isError: false, error: null };
    return { data: [], isLoading: false };
  });

  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
  const route = { params: { initialTab: 'places' as const } };
  render(<ExploreScreen navigation={navigation} route={route} />);
}

describe('ExploreScreen places behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sectioned default places UI when search is empty', async () => {
    setup();
    expect(await screen.findByText('On Nuzzle')).toBeTruthy();
    expect(screen.getByText('Nearby')).toBeTruthy();
    expect(screen.getAllByText('Saved Dog Park')).toHaveLength(1);
  });

  it('omits Nearby section when location is unavailable', async () => {
    setup({ locationGranted: false, requestedStatus: 'denied' });
    expect(await screen.findByText('On Nuzzle')).toBeTruthy();
    expect(screen.queryByText('Nearby')).toBeNull();
    expect(screen.getByText('Enable location in Settings to show nearby places.')).toBeTruthy();
  });

  it('shows grouped search results and hides sectioned browsing while searching', async () => {
    setup({
      searchResults: [
        {
          googlePlaceId: 'google-1',
          name: 'Fiesta Island Dog Park',
          formattedAddress: 'San Diego, CA',
          latitude: 32.77,
          longitude: -117.22,
          city: 'San Diego',
          neighborhood: null,
          placeType: 'dog_park',
          types: ['dog_park'],
        },
      ],
    });

    fireEvent.changeText(screen.getByPlaceholderText('Search places'), 'dog park');

    expect(await screen.findByText('In Nuzzle')).toBeTruthy();
    expect(screen.getByText('More Places')).toBeTruthy();
    expect(screen.queryByText('On Nuzzle')).toBeNull();
    expect(screen.queryByText('Nearby')).toBeNull();
  });

  it('requests location permission when Places tab is active and status is undetermined', async () => {
    setup({ permissionStatus: 'undetermined', requestedStatus: 'granted' });

    await waitFor(() => {
      expect(mockLocationRequest).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Nearby')).toBeTruthy();
  });

  it('requests location permission when not granted but askable', async () => {
    setup({ permissionStatus: 'denied', canAskAgain: true, requestedStatus: 'granted' });

    await waitFor(() => {
      expect(mockLocationRequest).toHaveBeenCalledTimes(1);
    });
  });
});
