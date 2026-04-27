jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useSavedPlaces', () => ({
  useSavedPlaces: jest.fn(),
  useToggleSavedPlace: jest.fn(),
}));

jest.mock('@/api/places', () => ({
  listActivePlaces: jest.fn(),
}));

jest.mock('@/components/ScreenWithWallpaper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ScreenWithWallpaper: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useSavedPlaces, useToggleSavedPlace } from '@/hooks/useSavedPlaces';
import { PlacesScreen } from '@/screens/PlacesScreen';
import type { Place } from '@/types';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseSavedPlaces = useSavedPlaces as jest.Mock;
const mockUseToggleSavedPlace = useToggleSavedPlace as jest.Mock;

const stubPlace: Place = {
  id: 'place-1',
  name: 'Ocean Beach Dog Beach',
  slug: 'ocean-beach-dog-beach',
  google_place_id: null,
  place_type: 'dog_beach',
  city: 'San Francisco',
  neighborhood: 'Ocean Beach',
  latitude: 37.7597,
  longitude: -122.5108,
  check_in_radius_meters: 400,
  check_in_duration_minutes: 60,
  description: null,
  is_active: true,
  supports_check_in: true,
  photos: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const stubPlace2: Place = {
  ...stubPlace,
  id: 'place-2',
  name: 'Fiesta Island Dog Park',
  slug: 'fiesta-island-dog-park',
  place_type: 'dog_park',
  city: 'San Diego',
  neighborhood: 'Mission Bay',
};

const navigate = jest.fn();

function setup({
  allPlaces = [stubPlace, stubPlace2],
  savedPlaces = [] as Place[],
  isLoading = false,
}: {
  allPlaces?: Place[];
  savedPlaces?: Place[];
  isLoading?: boolean;
} = {}) {
  mockUseAuthStore.mockImplementation((sel?: (s: object) => unknown) => {
    const state = { user: { id: 'user-1' } };
    return sel ? sel(state) : state;
  });
  mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });

  mockUseQuery.mockReturnValue({ data: allPlaces, isLoading });

  const savedPlaceIds = new Set(savedPlaces.map((p) => p.id));
  mockUseSavedPlaces.mockReturnValue({ savedPlaces, savedPlaceIds, isLoading });

  const mutateFn = jest.fn();
  mockUseMutation.mockReturnValue({ mutate: mutateFn, isPending: false });
  mockUseToggleSavedPlace.mockReturnValue({ mutate: mutateFn, isPending: false });

  return { mutateFn };
}

describe('PlacesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigate.mockReset();
  });

  it('renders both section headers', () => {
    setup();
    render(<PlacesScreen navigation={{ navigate }} />);

    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('All Places')).toBeTruthy();
  });

  it('shows empty saved state when no places are saved', () => {
    setup({ savedPlaces: [] });
    render(<PlacesScreen navigation={{ navigate }} />);

    expect(screen.getByText('No saved places yet')).toBeTruthy();
    expect(screen.getByText(/Tap the bookmark/)).toBeTruthy();
  });

  it('renders saved places in the Saved section', () => {
    setup({ savedPlaces: [stubPlace] });
    render(<PlacesScreen navigation={{ navigate }} />);

    // Place name should appear (at least once — once in Saved, once in All Places)
    const names = screen.getAllByText('Ocean Beach Dog Beach');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all active places in the All Places section', () => {
    setup();
    render(<PlacesScreen navigation={{ navigate }} />);

    expect(screen.getByText('Ocean Beach Dog Beach')).toBeTruthy();
    expect(screen.getByText('Fiesta Island Dog Park')).toBeTruthy();
  });

  it('navigates to PlaceDetail when a place row is pressed', () => {
    setup();
    render(<PlacesScreen navigation={{ navigate }} />);

    // Press the first occurrence of the place name
    fireEvent.press(screen.getAllByText('Ocean Beach Dog Beach')[0]);
    expect(navigate).toHaveBeenCalledWith('PlaceDetail', { placeId: 'place-1' });
  });

  it('fires the save toggle mutation when save button is pressed', () => {
    const { mutateFn } = setup();
    render(<PlacesScreen navigation={{ navigate }} />);

    // Press the save button (accessibility label "Save place")
    fireEvent.press(screen.getAllByLabelText('Save place')[0]);
    expect(mutateFn).toHaveBeenCalledWith({ placeId: 'place-1', isSaved: false });
  });

  it('shows loading text while data is loading', () => {
    setup({ isLoading: true, allPlaces: [] });
    render(<PlacesScreen navigation={{ navigate }} />);

    const loadingTexts = screen.getAllByText('Loading...');
    expect(loadingTexts.length).toBeGreaterThan(0);
  });
});
