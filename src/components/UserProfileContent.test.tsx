jest.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: jest.fn(),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
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

jest.mock('@/components/ProfileDogCard', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    ProfileDogCard: ({
      dog,
      onPress,
      footer,
      headerAction,
    }: {
      dog: { id: string; name: string };
      onPress?: () => void;
      footer?: React.ReactNode;
      headerAction?: React.ReactNode;
    }) => (
      <View>
        <Pressable onPress={onPress}>
          <Text>{dog.name}</Text>
        </Pressable>
        {headerAction}
        {footer}
      </View>
    ),
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
    }: {
      viewerUserId?: string | null;
      viewerDogs: Array<{ id: string }>;
      targetDog: { id: string };
    }) => (
      <Text>{`metButton:${viewerUserId ?? 'none'}:${viewerDogs.length}:${targetDog.id}`}</Text>
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
        <Text>{`friendsFor:${dogId}`}</Text>
        <Pressable onPress={() => onOpenDogProfile?.('dog-friend')}>
          <Text>Open Friend From Section</Text>
        </Pressable>
      </View>
    ),
  };
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UserProfileContent } from '@/components/UserProfileContent';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { Dog, Post, Profile } from '@/types';

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
    created_at: overrides.created_at ?? '2026-03-18T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-03-18T00:00:00.000Z',
  };
}

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: overrides.id ?? 'post-1',
    author_id: overrides.author_id ?? 'owner-ben',
    breed: overrides.breed ?? 'LABRADOR_RETRIEVER',
    type: overrides.type ?? 'UPDATE_STORY',
    tag: overrides.tag ?? 'PLAYDATE',
    title: overrides.title ?? 'Beach day',
    content_text: overrides.content_text ?? 'Scout had a great day.',
    created_at: overrides.created_at ?? '2026-03-18T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-03-18T00:00:00.000Z',
  };
}

function makeUseUserProfileResult(overrides: Partial<ReturnType<typeof useUserProfile>> = {}) {
  return {
    isOwnProfile: false,
    profileQuery: {} as ReturnType<typeof useUserProfile>['profileQuery'],
    dogsQuery: {} as ReturnType<typeof useUserProfile>['dogsQuery'],
    postsQuery: {} as ReturnType<typeof useUserProfile>['postsQuery'],
    joinedBreedsQuery: {} as ReturnType<typeof useUserProfile>['joinedBreedsQuery'],
    profile: makeProfile(),
    dogs: [makeDog()],
    viewerDogs: [makeDog({ id: 'dog-mochi', owner_id: 'viewer-alice', name: 'Mochi' })],
    posts: [makePost()],
    joinedBreeds: [],
    profileLoading: false,
    dogsLoading: false,
    viewerDogsLoading: false,
    postsLoading: false,
    joinedBreedsLoading: false,
    isLoading: false,
    error: null,
    refetchAll: jest.fn(),
    ...overrides,
  };
}

describe('UserProfileContent', () => {
  const useUserProfileMock = useUserProfile as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading state before profile data is ready', () => {
    useUserProfileMock.mockReturnValue(
      makeUseUserProfileResult({
        profile: null,
        dogs: [],
        posts: [],
        isLoading: true,
      })
    );

    render(<UserProfileContent profileUserId="owner-ben" viewerUserId="viewer-alice" />);

    expect(screen.getByText('Loading profile...')).toBeTruthy();
  });

  it('renders the error state and retries', () => {
    const refetchAll = jest.fn();

    useUserProfileMock.mockReturnValue(
      makeUseUserProfileResult({
        error: new Error('Profile request failed'),
        refetchAll,
      })
    );

    render(<UserProfileContent profileUserId="owner-ben" viewerUserId="viewer-alice" />);

    expect(screen.getByText("Couldn't load this profile")).toBeTruthy();

    fireEvent.press(screen.getByText('Try Again'));

    expect(refetchAll).toHaveBeenCalled();
  });

  it('renders dog cards with the met button and friends section wired up', () => {
    const onOpenDogProfile = jest.fn();
    const onOpenPost = jest.fn();

    useUserProfileMock.mockReturnValue(
      makeUseUserProfileResult({
        dogs: [
          makeDog({ id: 'dog-scout', name: 'Scout' }),
          makeDog({ id: 'dog-daisy', name: 'Daisy', breed: 'GOLDEN_RETRIEVER' }),
        ],
      })
    );

    render(
      <UserProfileContent
        profileUserId="owner-ben"
        viewerUserId="viewer-alice"
        onOpenDogProfile={onOpenDogProfile}
        onOpenPost={onOpenPost}
      />
    );

    expect(screen.getByText('Ben Dogtester')).toBeTruthy();
    expect(screen.getByText('Dogs')).toBeTruthy();
    expect(screen.getByText('Recent Posts')).toBeTruthy();
    expect(screen.getByText('Scout')).toBeTruthy();
    expect(screen.getByText('Daisy')).toBeTruthy();
    expect(screen.getAllByText('Friends')).toHaveLength(2);
    expect(screen.getByText('metButton:viewer-alice:1:dog-scout')).toBeTruthy();
    expect(screen.getByText('friendsFor:dog-scout')).toBeTruthy();
    expect(screen.getByText('Beach day')).toBeTruthy();

    fireEvent.press(screen.getByText('Scout'));
    expect(onOpenDogProfile).toHaveBeenCalledWith('dog-scout');

    fireEvent.press(screen.getAllByText('Open Friend From Section')[0]);
    expect(onOpenDogProfile).toHaveBeenCalledWith('dog-friend');

    fireEvent.press(screen.getByText('Beach day'));
    expect(onOpenPost).toHaveBeenCalledWith('post-1');
  });
});
