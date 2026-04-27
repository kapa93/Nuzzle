jest.mock('@/hooks/useDogInteractionMutation', () => ({
  useDogInteractionMutation: jest.fn(),
}));

jest.mock('@/hooks/useRecentDogMeetingStatus', () => ({
  useRecentDogMeetingStatus: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>{`icon:${name}`}</Text>;
  },
}));

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MetThisDogButton } from '@/components/MetThisDogButton';
import { useDogInteractionMutation } from '@/hooks/useDogInteractionMutation';
import { useRecentDogMeetingStatus } from '@/hooks/useRecentDogMeetingStatus';
import type { Dog } from '@/types';

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

describe('MetThisDogButton', () => {
  const mutate = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    (useRecentDogMeetingStatus as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useDogInteractionMutation as jest.Mock).mockReturnValue({
      mutate,
      isPending: false,
    });
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('does not render for your own dog', () => {
    render(
      <MetThisDogButton
        viewerUserId="user-1"
        viewerDogs={[makeDog({ id: 'dog-self' })]}
        targetDog={{ id: 'dog-self', name: 'Mochi' }}
      />
    );

    expect(screen.queryByText('Met this dog?')).toBeNull();
  });

  it('shows an add-dog alert when the viewer has no dogs', () => {
    render(
      <MetThisDogButton
        viewerUserId="user-1"
        viewerDogs={[]}
        targetDog={{ id: 'dog-target', name: 'Scout' }}
      />
    );

    fireEvent.press(screen.getByText('Met this dog?'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'No dog profile',
      'Add a dog profile before tracking dogs met.'
    );
  });

  it('creates an interaction immediately when the viewer has one dog', () => {
    render(
      <MetThisDogButton
        viewerUserId="user-1"
        viewerDogs={[makeDog({ id: 'dog-mochi', name: 'Mochi' })]}
        targetDog={{ id: 'dog-scout', name: 'Scout' }}
        sourceType="dog_beach"
        locationName="Ocean Beach Dog Beach"
      />
    );

    fireEvent.press(screen.getByText('Met this dog?'));

    expect(mutate).toHaveBeenCalledWith({
      dogIds: ['dog-mochi'],
      metDogId: 'dog-scout',
      createdByUserId: 'user-1',
      sourceType: 'dog_beach',
      locationName: 'Ocean Beach Dog Beach',
    }, expect.objectContaining({
      onSuccess: expect.any(Function),
    }));
  });

  it('prompts for which dog when the viewer has multiple dogs', () => {
    render(
      <MetThisDogButton
        viewerUserId="user-1"
        viewerDogs={[
          makeDog({ id: 'dog-mochi', name: 'Mochi' }),
          makeDog({ id: 'dog-poppy', name: 'Poppy' }),
        ]}
        targetDog={{ id: 'dog-scout', name: 'Scout' }}
      />
    );

    fireEvent.press(screen.getByText('Met this dog?'));

    const options = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => void;
    }>;

    expect(options.map((option) => option.text)).toEqual(['Both dogs', 'Mochi', 'Poppy', 'Cancel']);

    options[0].onPress?.();

    expect(mutate).toHaveBeenCalledWith({
      dogIds: ['dog-mochi', 'dog-poppy'],
      metDogId: 'dog-scout',
      createdByUserId: 'user-1',
      sourceType: 'manual',
      locationName: null,
    }, expect.objectContaining({
      onSuccess: expect.any(Function),
    }));
  });

  it('shows a completed state when all available dogs met the target recently', () => {
    (useRecentDogMeetingStatus as jest.Mock).mockReturnValue({
      data: ['dog-mochi', 'dog-poppy'],
      isLoading: false,
    });

    render(
      <MetThisDogButton
        viewerUserId="user-1"
        viewerDogs={[
          makeDog({ id: 'dog-mochi', name: 'Mochi' }),
          makeDog({ id: 'dog-poppy', name: 'Poppy' }),
        ]}
        targetDog={{ id: 'dog-scout', name: 'Scout' }}
      />
    );

    expect(screen.getByLabelText('Already met')).toBeTruthy();
    expect(screen.getByText('icon:checkmark-sharp')).toBeTruthy();
    expect(screen.queryByText('Met this dog?')).toBeNull();
  });

  it('shows a checkmark after a successful interaction save', () => {
    (useDogInteractionMutation as jest.Mock).mockReturnValue({
      mutate: (_variables: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
      isPending: false,
    });

    render(
      <MetThisDogButton
        viewerUserId="user-1"
        viewerDogs={[makeDog({ id: 'dog-mochi', name: 'Mochi' })]}
        targetDog={{ id: 'dog-scout', name: 'Scout' }}
      />
    );

    fireEvent.press(screen.getByText('Met this dog?'));

    expect(screen.getByLabelText('Interaction saved')).toBeTruthy();
    expect(screen.getByText('icon:checkmark-sharp')).toBeTruthy();
  });
});
