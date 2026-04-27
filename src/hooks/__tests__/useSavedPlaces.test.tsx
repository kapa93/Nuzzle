import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSavedPlaces, useToggleSavedPlace } from '../useSavedPlaces';

jest.mock('@/api/savedPlaces', () => ({
  getSavedPlaces: jest.fn(),
  savePlace: jest.fn(),
  unsavePlace: jest.fn(),
}));

jest.mock('@/api/places', () => ({
  getActivePlaceCheckinCounts: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

import { getSavedPlaces, savePlace, unsavePlace } from '@/api/savedPlaces';

const mockGetSavedPlaces = getSavedPlaces as jest.Mock;
const mockSavePlace = savePlace as jest.Mock;
const mockUnsavePlace = unsavePlace as jest.Mock;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const stubPlace = {
  id: 'place-1',
  name: 'Ocean Beach Dog Beach',
  slug: 'ocean-beach-dog-beach',
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
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('useSavedPlaces', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns saved places and a set of saved IDs', async () => {
    mockGetSavedPlaces.mockResolvedValue([stubPlace]);

    const { result } = renderHook(() => useSavedPlaces('user-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.savedPlaces).toEqual([stubPlace]);
    expect(result.current.savedPlaceIds.has('place-1')).toBe(true);
  });

  it('returns empty state when user has no saves', async () => {
    mockGetSavedPlaces.mockResolvedValue([]);

    const { result } = renderHook(() => useSavedPlaces('user-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.savedPlaces).toEqual([]);
    expect(result.current.savedPlaceIds.size).toBe(0);
  });

  it('is disabled and returns defaults when userId is undefined', () => {
    const { result } = renderHook(() => useSavedPlaces(undefined), { wrapper: makeWrapper() });

    expect(result.current.savedPlaces).toEqual([]);
    expect(mockGetSavedPlaces).not.toHaveBeenCalled();
  });
});

describe('useToggleSavedPlace', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls unsavePlace when isSaved is true', async () => {
    mockUnsavePlace.mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleSavedPlace(), { wrapper: makeWrapper() });

    result.current.mutate({ placeId: 'place-1', isSaved: true });

    await waitFor(() => expect(mockUnsavePlace).toHaveBeenCalledWith('user-1', 'place-1'));
  });

  it('calls savePlace when isSaved is false', async () => {
    mockSavePlace.mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleSavedPlace(), { wrapper: makeWrapper() });

    result.current.mutate({ placeId: 'place-1', isSaved: false });

    await waitFor(() => expect(mockSavePlace).toHaveBeenCalledWith('user-1', 'place-1'));
  });
});
