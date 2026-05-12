jest.mock('@/api/posts', () => ({
  getFeed: jest.fn(),
  deletePost: jest.fn(),
}));

jest.mock('@/api/reactions', () => ({
  setReaction: jest.fn(),
}));

jest.mock('@/api/meetups', () => ({
  rsvpMeetup: jest.fn(),
  unrsvpMeetup: jest.fn(),
}));

jest.mock('@/components/FeedItem', () => ({
  FeedItem: () => null,
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useFeedData } from '../useFeedData';
import { getFeed, deletePost } from '@/api/posts';
import { setReaction } from '@/api/reactions';
import { rsvpMeetup, unrsvpMeetup } from '@/api/meetups';
import type { PostWithDetails } from '@/types';

const mockGetFeed = getFeed as jest.Mock;
const mockDeletePost = deletePost as jest.Mock;
const mockSetReaction = setReaction as jest.Mock;
const mockRsvpMeetup = rsvpMeetup as jest.Mock;
const mockUnrsvpMeetup = unrsvpMeetup as jest.Mock;
const mockAlert = Alert.alert as jest.Mock;

// ─── helpers ─────────────────────────────────────────────────────────────────

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

const MOCK_POST: PostWithDetails = {
  id: 'post-1',
  author_id: 'user-1',
  author_name: 'Alice',
  author_dog_name: 'Buddy',
  author_dog_image_url: null,
  breed: 'GOLDEN_RETRIEVER',
  type: 'QUESTION',
  tag: 'TRAINING',
  content_text: 'Training tips?',
  title: null,
  created_at: '2024-01-01T00:00:00Z',
  comment_count: 0,
  reaction_counts: {},
  user_reaction: null,
  images: [],
  place_id: null,
  place_name: null,
  user_rsvped: null,
  attendee_count: null,
} as unknown as PostWithDetails;

const DEFAULT_PARAMS = {
  breed: 'GOLDEN_RETRIEVER' as const,
  feedFilter: 'newest',
  typeFilter: null,
  user: { id: 'user-1' },
  navigation: { navigate: jest.fn() },
};

// ─── feedQueryKey ─────────────────────────────────────────────────────────────

describe('useFeedData — feedQueryKey', () => {
  it('builds the query key from breed, feedFilter, and userId', () => {
    mockGetFeed.mockResolvedValue([]);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    expect(result.current.feedQueryKey).toEqual([
      'feed',
      'GOLDEN_RETRIEVER',
      'newest',
      'user-1',
    ]);
  });

  it('includes null for userId when user is null', () => {
    mockGetFeed.mockResolvedValue([]);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => useFeedData({ ...DEFAULT_PARAMS, user: null }),
      { wrapper }
    );
    expect(result.current.feedQueryKey).toEqual([
      'feed',
      'GOLDEN_RETRIEVER',
      'newest',
      undefined,
    ]);
  });
});

// ─── posts loading ────────────────────────────────────────────────────────────

describe('useFeedData — posts', () => {
  it('starts empty while loading', () => {
    mockGetFeed.mockReturnValue(new Promise(() => {}));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    expect(result.current.posts).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('flattens pages into posts array', async () => {
    mockGetFeed.mockResolvedValue([MOCK_POST]);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].id).toBe('post-1');
  });
});

// ─── handleEndReached ─────────────────────────────────────────────────────────

describe('useFeedData — handleEndReached', () => {
  it('does not throw and does not fetch next page when hasNextPage is false', async () => {
    // An empty page (length < PAGE_SIZE) means no next page
    mockGetFeed.mockResolvedValue([]);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // hasNextPage should be false (empty page returned)
    const callCountBefore = mockGetFeed.mock.calls.length;
    act(() => {
      result.current.handleEndReached();
    });
    // No additional fetch triggered
    expect(mockGetFeed.mock.calls.length).toBe(callCountBefore);
  });
});

// ─── handleDeletePost ─────────────────────────────────────────────────────────

describe('useFeedData — handleDeletePost', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an Alert when handleDeletePost is called', async () => {
    mockGetFeed.mockResolvedValue([MOCK_POST]);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleDeletePost('post-1');
    });

    expect(mockAlert).toHaveBeenCalledWith(
      'Delete post',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete' }),
      ])
    );
  });

  it('calls deletePost when the destructive button is pressed', async () => {
    mockGetFeed.mockResolvedValue([MOCK_POST]);
    mockDeletePost.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleDeletePost('post-1');
    });

    // Simulate pressing the destructive "Delete" button
    const alertButtons = mockAlert.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    const deleteButton = alertButtons.find((b) => b.text === 'Delete');
    act(() => {
      deleteButton?.onPress?.();
    });

    await waitFor(() => expect(mockDeletePost).toHaveBeenCalledWith('post-1', 'user-1'));
  });
});

// ─── handleReactionSelect ─────────────────────────────────────────────────────

describe('useFeedData — handleReactionSelect', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls setReaction with correct arguments', async () => {
    mockGetFeed.mockResolvedValue([MOCK_POST]);
    mockSetReaction.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.handleReactionSelect('post-1', 'LIKE');
    });

    expect(mockSetReaction).toHaveBeenCalledWith('post-1', 'user-1', 'LIKE');
  });
});

// ─── handleRsvpToggle ─────────────────────────────────────────────────────────

describe('useFeedData — handleRsvpToggle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls unrsvpMeetup when rsvped is true', async () => {
    mockGetFeed.mockResolvedValue([MOCK_POST]);
    mockUnrsvpMeetup.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.handleRsvpToggle('post-1', true);
    });

    expect(mockUnrsvpMeetup).toHaveBeenCalledWith('post-1', 'user-1');
  });

  it('calls rsvpMeetup when rsvped is false', async () => {
    mockGetFeed.mockResolvedValue([MOCK_POST]);
    mockRsvpMeetup.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useFeedData(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.handleRsvpToggle('post-1', false);
    });

    expect(mockRsvpMeetup).toHaveBeenCalledWith('post-1', 'user-1');
  });
});

// ─── navigation handlers ──────────────────────────────────────────────────────

describe('useFeedData — navigation handlers', () => {
  it('handlePostPress navigates to PostDetail', async () => {
    mockGetFeed.mockResolvedValue([]);
    const navigation = { navigate: jest.fn() };
    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => useFeedData({ ...DEFAULT_PARAMS, navigation }),
      { wrapper }
    );

    act(() => {
      result.current.handlePostPress('post-1');
    });
    expect(navigation.navigate).toHaveBeenCalledWith('PostDetail', { postId: 'post-1' });
  });

  it('handleAuthorPress navigates to UserProfile', async () => {
    mockGetFeed.mockResolvedValue([]);
    const navigation = { navigate: jest.fn() };
    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => useFeedData({ ...DEFAULT_PARAMS, navigation }),
      { wrapper }
    );

    act(() => {
      result.current.handleAuthorPress('user-2');
    });
    expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', { userId: 'user-2' });
  });
});
