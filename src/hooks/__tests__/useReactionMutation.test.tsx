import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReactionMutation } from '../useReactionMutation';

jest.mock('@/api/reactions', () => ({
  setReaction: jest.fn(),
}));

import { setReaction } from '@/api/reactions';

const mockSetReaction = setReaction as jest.Mock;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  };
}

describe('useReactionMutation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls setReaction with correct arguments', async () => {
    mockSetReaction.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useReactionMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ postId: 'p1', userId: 'u1', reaction: 'LIKE' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSetReaction).toHaveBeenCalledWith('p1', 'u1', 'LIKE');
  });

  it('can pass null reaction to clear a reaction', async () => {
    mockSetReaction.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useReactionMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ postId: 'p1', userId: 'u1', reaction: null });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSetReaction).toHaveBeenCalledWith('p1', 'u1', null);
  });

  it('surfaces errors when setReaction rejects', async () => {
    mockSetReaction.mockRejectedValue(new Error('network error'));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useReactionMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ postId: 'p1', userId: 'u1', reaction: 'LOVE' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('network error'));
  });

  it('invalidates post, feed, and search queries on success', async () => {
    mockSetReaction.mockResolvedValue(undefined);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReactionMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ postId: 'p1', userId: 'u1', reaction: 'HAHA' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['post', 'p1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['feed'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['search'] });
  });
});
