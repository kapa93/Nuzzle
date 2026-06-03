jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('lucide-react-native', () => ({
  Users: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: { access_token: 'token-1' } } })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

jest.mock('@/api/places', () => ({
  getGooglePlacePreview: jest.fn(),
  getGooglePlacePhotoUrl: jest.fn(() => 'https://example.com/photo.jpg'),
}));

jest.mock('@/api/communityInterests', () => ({
  suggestLocalCommunity: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@/store/uiStore', () => ({
  useUIStore: jest.fn(() => ({ showGuestPrompt: jest.fn() })),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GooglePlacePreviewScreen } from '@/screens/GooglePlacePreviewScreen';
import { suggestLocalCommunity } from '@/api/communityInterests';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockSuggestLocalCommunity = suggestLocalCommunity as jest.Mock;

const previewData = {
  googlePlaceId: 'google-1',
  name: 'Balboa Park',
  displayName: 'Balboa Park',
  formattedAddress: 'San Diego, CA',
  shortFormattedAddress: 'San Diego, CA',
  currentOpeningHours: { weekdayDescriptions: ['Monday: 8:00 AM - 5:00 PM'], openNow: true },
  attributions: [],
  photos: [{ name: 'places/google-1/photos/photo-1', widthPx: 100, heightPx: 100, authorAttributions: [] }],
  rating: 4.8,
  ratingCount: 1234,
  openNow: true,
  latitude: 32.7341,
  longitude: -117.1446,
  city: 'San Diego',
  neighborhood: null,
  placeType: 'park' as const,
  types: ['park'],
};

function setup() {
  const navigate = jest.fn();
  const invalidateQueries = jest.fn();
  mockUseQueryClient.mockReturnValue({ invalidateQueries });

  mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    if (opts.queryKey[0] === 'googlePlacePreview') {
      return { data: previewData, isLoading: false, isError: false, error: null };
    }
    return { data: null, isLoading: false, isError: false, error: null };
  });

  mockUseMutation.mockImplementation((opts: {
    mutationFn: (args: { googlePlaceId: string; bannerPhotoName: string | null }) => Promise<unknown>;
    onSuccess?: (data: unknown) => Promise<void>;
  }) => ({
    mutate: jest.fn(async (args: { googlePlaceId: string; bannerPhotoName: string | null }) => {
      const result = await opts.mutationFn(args);
      if (opts.onSuccess) await opts.onSuccess(result);
    }),
    isPending: false,
    isError: false,
    error: null,
  }));

  mockSuggestLocalCommunity.mockResolvedValue({
    kind: 'navigated_to_active',
    place: { id: 'place-1', name: 'Balboa Park' },
  });

  render(
    <GooglePlacePreviewScreen
      route={{ params: { googlePlaceId: 'google-1', initialName: 'Balboa Park' } }}
      navigation={{ navigate, setOptions: jest.fn(), goBack: jest.fn() }}
    />
  );

  return { navigate, invalidateQueries };
}

describe('GooglePlacePreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders key preview data with Suggest action', async () => {
    setup();
    expect(await screen.findByText('Balboa Park')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Address')).toBeTruthy();
    expect(screen.getByText('Rating')).toBeTruthy();
    expect(screen.getByLabelText('Suggest a local community for this place')).toBeTruthy();
  });

  it('calls suggestLocalCommunity on explicit Suggest tap after selecting a photo', async () => {
    const { navigate, invalidateQueries } = setup();

    // A photo must be selected before suggesting is allowed
    fireEvent.press(await screen.findByLabelText('Photo 1, tap to use as cover'));
    fireEvent.press(screen.getByLabelText('Suggest a local community for this place'));

    await waitFor(() => {
      expect(mockSuggestLocalCommunity).toHaveBeenCalledWith(
        'google-1',
        'places/google-1/photos/photo-1',
        'user-1',
      );
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['places'] });
      expect(navigate).toHaveBeenCalledWith('PlaceDetail', { placeId: 'place-1' });
    });
  });
});
