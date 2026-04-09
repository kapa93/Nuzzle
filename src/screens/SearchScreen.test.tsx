jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
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

jest.mock('@/components/FeedItem', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    FeedItem: ({ item }: { item: { id: string } }) => (
      <View>
        <Text>{`feed-item-${item.id}`}</Text>
      </View>
    ),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{`icon-${name}`}</Text>,
  };
});

jest.mock('@/api/posts', () => ({
  searchPosts: jest.fn(),
  deletePost: jest.fn(),
}));

jest.mock('@/api/reactions', () => ({
  setReaction: jest.fn(),
}));

jest.mock('@/api/meetups', () => ({
  rsvpMeetup: jest.fn(),
  unrsvpMeetup: jest.fn(),
}));

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { SearchScreen } from '@/screens/SearchScreen';
import { BREEDS, BREED_LABELS } from '@/utils/breed';

describe('SearchScreen', () => {
  const useQueryMock = useQuery as jest.Mock;
  const useMutationMock = useMutation as jest.Mock;
  const useQueryClientMock = useQueryClient as jest.Mock;
  const useNavigationMock = useNavigation as jest.Mock;
  const useRouteMock = useRoute as jest.Mock;
  const useAuthStoreMock = useAuthStore as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    useNavigationMock.mockReturnValue({ navigate: jest.fn() });
    useRouteMock.mockReturnValue({ name: 'SearchModal', params: {} });

    useAuthStoreMock.mockImplementation((selector?: (state: { user: { id: string } }) => unknown) => {
      const state = { user: { id: 'user-1' } };
      return selector ? selector(state) : state;
    });

    useQueryClientMock.mockReturnValue({
      invalidateQueries: jest.fn(),
    });

    useMutationMock.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isFetched: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the default search placeholder state', () => {
    render(<SearchScreen />);

    expect(screen.getByText('Start typing to search posts')).toBeTruthy();
  });

  it('requires at least 3 letters after debounce before enabling query', () => {
    render(<SearchScreen />);

    const input = screen.getByPlaceholderText('Search posts...');

    fireEvent.changeText(input, 'ab');
    act(() => {
      jest.advanceTimersByTime(260);
    });

    let latestCallArg = useQueryMock.mock.calls.at(-1)?.[0];
    expect(latestCallArg?.enabled).toBe(false);

    fireEvent.changeText(input, 'abc');
    act(() => {
      jest.advanceTimersByTime(260);
    });

    latestCallArg = useQueryMock.mock.calls.at(-1)?.[0];
    expect(latestCallArg?.queryKey?.[1]).toBe('abc');
    expect(latestCallArg?.enabled).toBe(true);
  });

  it('enables query when a breed filter is selected without a text query', () => {
    render(<SearchScreen />);

    fireEvent.press(screen.getByText(BREED_LABELS[BREEDS[0]]));

    const latestCallArg = useQueryMock.mock.calls.at(-1)?.[0];
    expect(latestCallArg?.queryKey?.[2]).toBe(BREEDS[0]);
    expect(latestCallArg?.enabled).toBe(true);
  });

  it('renders search results using feed-style items', () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 'post-1',
          type: 'QUESTION',
          content_text: 'How do I socialize my pup?',
        },
      ],
      isLoading: false,
      isFetching: false,
      isFetched: true,
    });

    render(<SearchScreen />);

    expect(screen.getByText('feed-item-post-1')).toBeTruthy();
  });
});

