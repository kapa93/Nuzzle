jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@/api/dogs', () => ({
  getDogsByOwner: jest.fn(),
}));

jest.mock('@/api/places', () => ({
  checkIntoPlace: jest.fn(),
  endPlaceCheckins: jest.fn(),
  getActivePlaceCheckins: jest.fn(),
  getPlaceBreedCounts: jest.fn((checkins: Array<{ dog_breed: string }>) =>
    checkins.length > 0 ? [{ breed: checkins[0].dog_breed, count: checkins.length }] : []
  ),
  getMyActivePlaceCheckins: jest.fn(),
  getPlaceById: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/components/ScreenWithWallpaper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ScreenWithWallpaper: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('@/components/DogAvatar', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    DogAvatar: ({ name }: { name?: string }) => <Text>{`avatar:${name ?? 'unknown'}`}</Text>,
  };
});

jest.mock('@/components/MetThisDogButton', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MetThisDogButton: ({
      viewerUserId,
      viewerDogs,
      targetDog,
      sourceType,
      locationName,
    }: {
      viewerUserId?: string | null;
      viewerDogs: Array<{ id: string }>;
      targetDog: { id: string };
      sourceType?: string;
      locationName?: string | null;
    }) => (
      <Text>{`metButton:${viewerUserId ?? 'none'}:${viewerDogs.length}:${targetDog.id}:${sourceType ?? 'manual'}:${locationName ?? 'none'}`}</Text>
    ),
  };
});

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlaceCheckinScreen } from '@/screens/PlaceCheckinScreen';
import { useAuthStore } from '@/store/authStore';
import type { ActivePlaceCheckin, Dog, DogLocationCheckin } from '@/types';

const PLACE_ID = 'place-ob-uuid';
const PLACE_NAME = 'Ocean Beach Dog Beach';

function makeDog(overrides: Partial<Dog> = {}): Dog {
  return {
    id: overrides.id ?? 'dog-1',
    owner_id: overrides.owner_id ?? 'owner-1',
    name: overrides.name ?? 'Mochi',
    breed: overrides.breed ?? 'HUSKY',
    age_group: overrides.age_group ?? 'ADULT',
    energy_level: overrides.energy_level ?? 'HIGH',
    dog_friendliness: overrides.dog_friendliness ?? null,
    play_style: overrides.play_style ?? null,
    good_with_puppies: overrides.good_with_puppies ?? null,
    good_with_large_dogs: overrides.good_with_large_dogs ?? null,
    good_with_small_dogs: overrides.good_with_small_dogs ?? null,
    temperament_notes: overrides.temperament_notes ?? null,
    dog_image_url: overrides.dog_image_url ?? null,
    created_at: overrides.created_at ?? '2026-03-18T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-03-18T00:00:00.000Z',
  };
}

function makeActiveCheckin(overrides: Partial<ActivePlaceCheckin> = {}): ActivePlaceCheckin {
  return {
    id: overrides.id ?? 'checkin-1',
    user_id: overrides.user_id ?? 'owner-ben',
    dog_id: overrides.dog_id ?? 'dog-scout',
    place_id: overrides.place_id ?? PLACE_ID,
    location_key: overrides.location_key ?? 'ocean-beach-dog-beach',
    location_name: overrides.location_name ?? PLACE_NAME,
    created_at: overrides.created_at ?? '2026-03-18T00:00:00.000Z',
    expires_at: overrides.expires_at ?? '2026-03-18T01:00:00.000Z',
    ended_at: overrides.ended_at ?? null,
    dog_name: overrides.dog_name ?? 'Scout',
    dog_breed: overrides.dog_breed ?? 'LABRADOR_RETRIEVER',
    dog_play_style: overrides.dog_play_style ?? 'mixed',
    dog_image_url: overrides.dog_image_url ?? null,
    owner_name: overrides.owner_name ?? 'Ben Dogtester',
  };
}

function makeMyCheckin(overrides: Partial<DogLocationCheckin> = {}): DogLocationCheckin {
  return {
    id: overrides.id ?? 'my-checkin-1',
    user_id: overrides.user_id ?? 'viewer-alice',
    dog_id: overrides.dog_id ?? 'dog-mochi',
    place_id: overrides.place_id ?? PLACE_ID,
    location_key: overrides.location_key ?? 'ocean-beach-dog-beach',
    location_name: overrides.location_name ?? PLACE_NAME,
    created_at: overrides.created_at ?? '2026-03-18T00:00:00.000Z',
    expires_at: overrides.expires_at ?? '2026-03-18T01:00:00.000Z',
    ended_at: overrides.ended_at ?? null,
  };
}

const defaultPlace = {
  id: PLACE_ID,
  name: PLACE_NAME,
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

const defaultRoute = { params: { placeId: PLACE_ID } };

describe('PlaceCheckinScreen', () => {
  const useQueryMock = useQuery as jest.Mock;
  const useMutationMock = useMutation as jest.Mock;
  const useQueryClientMock = useQueryClient as jest.Mock;
  const useAuthStoreMock = useAuthStore as unknown as jest.Mock;
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  const navigate = jest.fn();
  const invalidateQueries = jest.fn();
  const createMutate = jest.fn();
  const endMutate = jest.fn();
  let dogsQueryData: Dog[] = [];
  let activeCheckinsQueryData: ActivePlaceCheckin[] = [];
  let myActiveCheckinsQueryData: DogLocationCheckin[] = [];
  let activeCheckinsLoading = false;
  let activeCheckinsError = false;
  let refetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    useQueryClientMock.mockReset();
    createMutate.mockReset();
    endMutate.mockReset();
    invalidateQueries.mockReset();
    refetchMock = jest.fn();
    dogsQueryData = [];
    activeCheckinsQueryData = [];
    myActiveCheckinsQueryData = [];
    activeCheckinsLoading = false;
    activeCheckinsError = false;
    useAuthStoreMock.mockImplementation((selector?: (state: { user: { id: string } }) => unknown) => {
      const state = { user: { id: 'viewer-alice' } };
      return selector ? selector(state) : state;
    });
    useQueryClientMock.mockReturnValue({ invalidateQueries });
    let mutationHookCallCount = 0;
    useMutationMock.mockImplementation(() => {
      mutationHookCallCount += 1;
      return mutationHookCallCount % 2 === 1
        ? { mutate: createMutate, isPending: false }
        : { mutate: endMutate, isPending: false };
    });
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
      const [key, second] = queryKey;

      if (key === 'place' && second === PLACE_ID) {
        return { data: defaultPlace, isLoading: false };
      }

      if (key === 'dogs') {
        return { data: dogsQueryData, isLoading: false };
      }

      if (key === 'placeActiveCheckins') {
        return {
          data: activeCheckinsQueryData,
          isLoading: activeCheckinsLoading,
          isError: activeCheckinsError,
          refetch: refetchMock,
        };
      }

      if (key === 'placeMyCheckins') {
        return {
          data: myActiveCheckinsQueryData,
          isLoading: false,
        };
      }

      throw new Error(`Unhandled query key: ${String(key)}`);
    });
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('renders the loading state while active check-ins are loading', () => {
    activeCheckinsLoading = true;

    render(<PlaceCheckinScreen route={defaultRoute} navigation={{ navigate }} />);

    expect(screen.getByText('Loading check-ins...')).toBeTruthy();
  });

  it('shows an alert if the viewer tries to check in without a dog profile', () => {
    render(<PlaceCheckinScreen route={defaultRoute} navigation={{ navigate }} />);

    fireEvent.press(screen.getByText('Check In'));

    expect(Alert.alert).toHaveBeenCalledWith('No dog profile', 'Add a dog profile before checking in.');
  });

  it('prompts for which dog to check in when the viewer has multiple dogs', () => {
    dogsQueryData = [
      makeDog({ id: 'dog-mochi', name: 'Mochi' }),
      makeDog({ id: 'dog-poppy', name: 'Poppy', breed: 'GOLDEN_RETRIEVER' }),
    ];

    render(<PlaceCheckinScreen route={defaultRoute} navigation={{ navigate }} />);

    fireEvent.press(screen.getByText('Check In'));

    const options = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => void;
    }>;

    expect(options.map((option) => option.text)).toEqual(['Both dogs', 'Mochi', 'Poppy', 'Cancel']);

    options[0].onPress?.();

    expect(createMutate).toHaveBeenCalledWith(['dog-mochi', 'dog-poppy']);
  });

  it('renders active attendees, wires MetThisDogButton, and navigates to dog profiles', () => {
    dogsQueryData = [makeDog({ id: 'dog-mochi', name: 'Mochi' })];
    activeCheckinsQueryData = [makeActiveCheckin()];
    myActiveCheckinsQueryData = [makeMyCheckin()];

    render(<PlaceCheckinScreen route={defaultRoute} navigation={{ navigate }} />);

    expect(screen.getByText(`Dogs at ${PLACE_NAME} right now`)).toBeTruthy();
    expect(screen.getByText('1 active check-ins')).toBeTruthy();
    expect(screen.getByText('You currently have 1 dog checked in.')).toBeTruthy();
    expect(screen.getByText('Scout')).toBeTruthy();
    expect(screen.getByText(`metButton:viewer-alice:1:dog-scout:dog_beach:${PLACE_NAME}`)).toBeTruthy();

    fireEvent.press(screen.getByText('Scout'));
    expect(navigate).toHaveBeenCalledWith('DogProfile', { dogId: 'dog-scout' });

    fireEvent.press(screen.getByText('End Check-In'));
    expect(endMutate).toHaveBeenCalledWith(['my-checkin-1']);
  });
});
