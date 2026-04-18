import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserProfile } from '../useUserProfile';

jest.mock('@/api/auth', () => ({
  getProfile: jest.fn(),
}));
jest.mock('@/api/dogs', () => ({
  getDogsByOwner: jest.fn(),
}));
jest.mock('@/api/posts', () => ({
  getRecentPostsByAuthor: jest.fn(),
}));
jest.mock('@/api/breedJoins', () => ({
  getJoinedBreeds: jest.fn(),
}));

import { getProfile } from '@/api/auth';
import { getDogsByOwner } from '@/api/dogs';
import { getRecentPostsByAuthor } from '@/api/posts';
import { getJoinedBreeds } from '@/api/breedJoins';

const mockGetProfile = getProfile as jest.Mock;
const mockGetDogsByOwner = getDogsByOwner as jest.Mock;
const mockGetRecentPosts = getRecentPostsByAuthor as jest.Mock;
const mockGetJoinedBreeds = getJoinedBreeds as jest.Mock;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUserProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns isOwnProfile=true when viewerUserId equals profileUserId', () => {
    mockGetProfile.mockResolvedValue({ id: 'u1', name: 'Alice' });
    mockGetDogsByOwner.mockResolvedValue([]);
    mockGetRecentPosts.mockResolvedValue([]);
    mockGetJoinedBreeds.mockResolvedValue([]);

    const { result } = renderHook(
      () => useUserProfile({ profileUserId: 'u1', viewerUserId: 'u1' }),
      { wrapper: makeWrapper() }
    );

    expect(result.current.isOwnProfile).toBe(true);
  });

  it('returns isOwnProfile=false when viewerUserId differs from profileUserId', () => {
    mockGetProfile.mockResolvedValue({ id: 'u1', name: 'Alice' });
    mockGetDogsByOwner.mockResolvedValue([]);
    mockGetRecentPosts.mockResolvedValue([]);

    const { result } = renderHook(
      () => useUserProfile({ profileUserId: 'u1', viewerUserId: 'u2' }),
      { wrapper: makeWrapper() }
    );

    expect(result.current.isOwnProfile).toBe(false);
  });

  it('loads profile and dogs and resolves them correctly', async () => {
    const profile = { id: 'u1', name: 'Alice', email: 'a@b.com', city: null };
    const dogs = [{ id: 'd1', name: 'Koda', owner_id: 'u1' }];
    mockGetProfile.mockResolvedValue(profile);
    mockGetDogsByOwner.mockResolvedValue(dogs);
    mockGetRecentPosts.mockResolvedValue([]);

    const { result } = renderHook(
      () => useUserProfile({ profileUserId: 'u1' }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.profileLoading).toBe(false));

    expect(result.current.profile).toEqual(profile);
    expect(result.current.dogs).toEqual(dogs);
  });

  it('defaults to empty arrays on initial load', () => {
    mockGetProfile.mockResolvedValue(null);
    mockGetDogsByOwner.mockResolvedValue([]);
    mockGetRecentPosts.mockResolvedValue([]);

    const { result } = renderHook(
      () => useUserProfile({ profileUserId: 'u1' }),
      { wrapper: makeWrapper() }
    );

    expect(result.current.dogs).toEqual([]);
    expect(result.current.posts).toEqual([]);
    expect(result.current.joinedBreeds).toEqual([]);
  });

  it('does not load joinedBreeds when includeJoinedBreeds is false', async () => {
    mockGetProfile.mockResolvedValue(null);
    mockGetDogsByOwner.mockResolvedValue([]);
    mockGetRecentPosts.mockResolvedValue([]);

    renderHook(
      () => useUserProfile({ profileUserId: 'u1', viewerUserId: 'u1', includeJoinedBreeds: false }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    expect(mockGetJoinedBreeds).not.toHaveBeenCalled();
  });

  it('loads joinedBreeds when includeJoinedBreeds and isOwnProfile', async () => {
    const breeds = ['AUSTRALIAN_SHEPHERD', 'GOLDEN_RETRIEVER'];
    mockGetProfile.mockResolvedValue({ id: 'u1', name: 'Alice' });
    mockGetDogsByOwner.mockResolvedValue([]);
    mockGetRecentPosts.mockResolvedValue([]);
    mockGetJoinedBreeds.mockResolvedValue(breeds);

    const { result } = renderHook(
      () => useUserProfile({ profileUserId: 'u1', viewerUserId: 'u1', includeJoinedBreeds: true }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.joinedBreedsLoading).toBe(false));
    expect(result.current.joinedBreeds).toEqual(breeds);
  });

  it('exposes isLoading=true while any query is loading', () => {
    // Keep queries pending
    mockGetProfile.mockReturnValue(new Promise(() => {}));
    mockGetDogsByOwner.mockReturnValue(new Promise(() => {}));
    mockGetRecentPosts.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () => useUserProfile({ profileUserId: 'u1' }),
      { wrapper: makeWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
  });
});
