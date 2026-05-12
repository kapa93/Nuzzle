jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@/api/auth', () => ({
  getProfile: jest.fn(),
}));

jest.mock('@/api/dogs', () => ({
  getDogById: jest.fn(),
  getDogsByOwner: jest.fn(),
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

jest.mock('@/components/ProfileDogCard', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    ProfileDogCard: ({
      dog,
      footer,
      headerAction,
    }: {
      dog: { name: string };
      footer?: React.ReactNode;
      headerAction?: React.ReactNode;
    }) => (
      <View>
        <Text>{dog.name}</Text>
        {headerAction}
        {footer}
      </View>
    ),
  };
});

jest.mock('@/components/MetThisDogButton', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    MetThisDogButton: ({
      viewerUserId,
      viewerDogs,
      targetDog,
    }: {
      viewerUserId?: string | null;
      viewerDogs: Array<{ id: string }>;
      targetDog: { id: string };
    }) => (
      <View>
        <Text>{`viewer:${viewerUserId ?? 'none'}`}</Text>
        <Text>{`viewerDogs:${viewerDogs.length}`}</Text>
        <Text>{`targetDog:${targetDog.id}`}</Text>
      </View>
    ),
  };
});

jest.mock('@/components/DogsMetSection', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    DogsMetSection: ({
      dogId,
      title,
      onOpenDogProfile,
    }: {
      dogId: string;
      title?: string;
      onOpenDogProfile?: (dogId: string) => void;
    }) => (
      <View>
        <Text>{title}</Text>
        <Text>{`dogsMetFor:${dogId}`}</Text>
        <Pressable onPress={() => onOpenDogProfile?.('dog-friend')}>
          <Text>Open Friend</Text>
        </Pressable>
      </View>
    ),
  };
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import { DogProfileScreen } from '@/screens/DogProfileScreen';
import { useAuthStore } from '@/store/authStore';
import type { Dog, Profile } from '@/types';

function makeDog(overrides: Partial<Dog> = {}): Dog {
  return {
    id: overrides.id ?? 'dog-scout',
    owner_id: overrides.owner_id ?? 'owner-ben',
    name: overrides.name ?? 'Scout',
    breed: overrides.breed ?? 'LABRADOR_RETRIEVER',
    age_group: overrides.age_group ?? 'ADULT',
    energy_level: overrides.energy_level ?? 'HIGH',
    dog_friendliness: overrides.dog_friendliness ?? 5,
    play_style: overrides.play_style ?? 'mixed',
    good_with_puppies: overrides.good_with_puppies ?? 'yes',
    good_with_large_dogs: overrides.good_with_large_dogs ?? 'yes',
    good_with_small_dogs: overrides.good_with_small_dogs ?? 'yes',
    temperament_notes: overrides.temperament_notes ?? 'Very social',
    dog_image_url: overrides.dog_image_url ?? null,
    created_at: overrides.created_at ?? '2026-03-18T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-03-18T00:00:00.000Z',
  };
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: overrides.id ?? 'owner-ben',
    name: overrides.name ?? 'Ben Dogtester',
    email: overrides.email ?? 'ben@example.com',
    city: overrides.city ?? 'San Francisco',
    profile_image_url: overrides.profile_image_url ?? null,
    is_admin: overrides.is_admin ?? false,
    created_at: overrides.created_at ?? '2026-03-18T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-03-18T00:00:00.000Z',
  };
}

describe('DogProfileScreen', () => {
  const useQueryMock = useQuery as jest.Mock;
  const useAuthStoreMock = useAuthStore as unknown as jest.Mock;
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStoreMock.mockImplementation((selector?: (state: { user: { id: string } }) => unknown) => {
      const state = { user: { id: 'viewer-alice' } };
      return selector ? selector(state) : state;
    });
  });

  it('renders a loading state while the dog query is loading', () => {
    useQueryMock
      .mockReturnValueOnce({ data: null, isLoading: true, error: null })
      .mockReturnValueOnce({ data: null, isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });

    render(
      <DogProfileScreen
        route={{ params: { dogId: 'dog-scout' } }}
        navigation={{ navigate }}
      />
    );

    expect(screen.getByText('Loading dog profile...')).toBeTruthy();
  });

  it('renders the not-found state when the dog does not exist', () => {
    useQueryMock
      .mockReturnValueOnce({ data: null, isLoading: false, error: null })
      .mockReturnValueOnce({ data: null, isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });

    render(
      <DogProfileScreen
        route={{ params: { dogId: 'missing-dog' } }}
        navigation={{ navigate }}
      />
    );

    expect(screen.getByText('Dog not found')).toBeTruthy();
  });

  it('renders the dog profile flow and navigates to owner and met dogs', () => {
    const dog = makeDog();
    const owner = makeProfile();
    const viewerDogs = [makeDog({ id: 'dog-mochi', owner_id: 'viewer-alice', name: 'Mochi' })];

    useQueryMock
      .mockReturnValueOnce({ data: dog, isLoading: false, error: null })
      .mockReturnValueOnce({ data: owner, isLoading: false, error: null })
      .mockReturnValueOnce({ data: viewerDogs, isLoading: false, error: null });

    render(
      <DogProfileScreen
        route={{ params: { dogId: dog.id } }}
        navigation={{ navigate }}
      />
    );

    expect(screen.getByText('Scout')).toBeTruthy();
    expect(screen.getByText('Ben Dogtester')).toBeTruthy();
    expect(screen.getByText('Friends')).toBeTruthy();
    expect(screen.getByText('viewer:viewer-alice')).toBeTruthy();
    expect(screen.getByText('viewerDogs:1')).toBeTruthy();
    expect(screen.getByText('targetDog:dog-scout')).toBeTruthy();
    expect(screen.getByText('dogsMetFor:dog-scout')).toBeTruthy();

    fireEvent.press(screen.getByText('Ben Dogtester'));
    expect(navigate).toHaveBeenCalledWith('UserProfile', { userId: owner.id });

    fireEvent.press(screen.getByText('Open Friend'));
    expect(navigate).toHaveBeenCalledWith('DogProfile', { dogId: 'dog-friend' });
  });
});
