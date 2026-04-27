jest.mock('@/hooks/useDogsMetByDog', () => ({
  useDogsMetByDog: jest.fn(),
}));

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DogsMetSection } from '@/components/DogsMetSection';
import { useDogsMetByDog } from '@/hooks/useDogsMetByDog';
import type { DogMetSummary } from '@/types';

function makeDogMetSummary(overrides: Partial<DogMetSummary> = {}): DogMetSummary {
  return {
    id: overrides.id ?? 'dog-1',
    owner_id: overrides.owner_id ?? 'owner-1',
    name: overrides.name ?? 'Scout',
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
    latest_interaction_at: overrides.latest_interaction_at ?? '2026-03-18T00:00:00.000Z',
    interaction_count: overrides.interaction_count ?? 1,
  };
}

describe('DogsMetSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-18T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a loading state', () => {
    (useDogsMetByDog as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(<DogsMetSection dogId="dog-1" />);

    expect(screen.getByText('Loading dogs met...')).toBeTruthy();
  });

  it('renders the empty state when no dogs have been met', () => {
    (useDogsMetByDog as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<DogsMetSection dogId="dog-1" />);

    expect(screen.getByText('No dogs met yet')).toBeTruthy();
  });

  it('renders met dogs and allows navigation to a dog profile', () => {
    const onOpenDogProfile = jest.fn();

    (useDogsMetByDog as jest.Mock).mockReturnValue({
      data: [
        makeDogMetSummary({
          id: 'dog-scout',
          name: 'Scout',
          interaction_count: 2,
        }),
      ],
      isLoading: false,
    });

    render(<DogsMetSection dogId="dog-1" onOpenDogProfile={onOpenDogProfile} title="Friends" />);

    expect(screen.getByText('Friends')).toBeTruthy();
    expect(screen.getByText('Scout')).toBeTruthy();

    fireEvent.press(screen.getByText('Scout'));

    expect(onOpenDogProfile).toHaveBeenCalledWith('dog-scout');
  });
});
