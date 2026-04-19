// ─── Mock all heavy dependencies before imports ───────────────────────────────

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useInfiniteQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: jest.fn(() => 49),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 56),
}));

jest.mock('@/hooks/useFeedData', () => ({
  useFeedData: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/store/onboardingStore', () => ({
  useOnboardingStore: jest.fn(),
}));

jest.mock('@/store/uiStore', () => ({
  useUIStore: jest.fn(),
}));

jest.mock('@/context/ScrollDirectionContext', () => ({
  useScrollDirection: jest.fn(() => 'up'),
  useScrollDirectionUpdater: jest.fn(() => jest.fn()),
}));

jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(), getCurrentPositionAsync: jest.fn() }));
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    default: { createAnimatedComponent: (c: unknown) => c, View },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    createAnimatedComponent: (c: unknown) => c,
    View,
  };
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
jest.mock('@sentry/react-native', () => ({ withScope: jest.fn(), captureException: jest.fn() }));
jest.mock('@/lib/sentry', () => ({ captureHandledError: jest.fn() }));

jest.mock('@/components/ScreenWithWallpaper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { ScreenWithWallpaper: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});
jest.mock('@/components/OnboardingCompleteCard', () => ({ OnboardingCompleteCard: () => null }));
jest.mock('@/components/CreatePostPromptCard', () => ({ CreatePostPromptCard: () => null }));
jest.mock('@/components/MeetupPromptCard', () => ({ MeetupPromptCard: () => null }));
jest.mock('@/components/PlaceNearbyAlert', () => ({ PlaceNearbyAlert: () => null }));
jest.mock('@/components/PlaceNowAlert', () => ({ PlaceNowAlert: () => null }));
jest.mock('@/ui/BreedHero', () => ({ BreedHero: () => null }));
jest.mock('@/ui/SwipeableBreedBanner', () => ({ SwipeableBreedBanner: () => null }));
jest.mock('@/ui/SegmentTabs', () => ({ SegmentTabs: () => null }));
jest.mock('@/api/dogs', () => ({ getDogsByOwner: jest.fn() }));
jest.mock('@/api/breedJoins', () => ({ getJoinedBreeds: jest.fn(), joinBreedFeed: jest.fn(), leaveBreedFeed: jest.fn() }));
jest.mock('@/api/places', () => ({
  checkIntoPlace: jest.fn(),
  getActivePlaceCheckins: jest.fn(),
  getMyActivePlaceCheckins: jest.fn(),
  getPlaceBySlug: jest.fn(),
}));
jest.mock('@/config/places', () => ({ OB_DOG_BEACH_SLUG: 'ocean-beach-dog-beach', DEBUG_FORCE_NEARBY: false }));
jest.mock('@/utils/location', () => ({ getDistanceMeters: jest.fn(() => 9999) }));
jest.mock('@/utils/breedAssets', () => ({
  getBreedHeroImageSource: jest.fn(() => null),
  getBreedHeroImageStyle: jest.fn(() => ({})),
  getBreedHeroTitle: jest.fn(() => 'Golden Retriever'),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useUIStore } from '@/store/uiStore';
import { useFeedData } from '@/hooks/useFeedData';
import { HomeScreen } from '@/screens/HomeScreen';

const mockUseFeedData = useFeedData as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;
const mockUseInfiniteQuery = useInfiniteQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;
const mockUseUIStore = useUIStore as unknown as jest.Mock;

// ─── Default mock values ──────────────────────────────────────────────────────

function setupDefaultMocks({ user = { id: 'u1' }, dogs = [{ id: 'd1', breed: 'GOLDEN_RETRIEVER', owner_id: 'u1' }] } = {}) {
  mockUseAuthStore.mockImplementation((sel?: (s: object) => unknown) => {
    const state = { user };
    return sel ? sel(state) : state;
  });

  mockUseOnboardingStore.mockReturnValue({
    onboardingDog: null,
    dismissOnboardingCard: jest.fn(),
  });

  mockUseUIStore.mockReturnValue({
    feedFilter: 'all',
    setFeedFilter: jest.fn(),
    showPostPrompt: false,
    dismissPostPrompt: jest.fn(),
    showMeetupPrompt: false,
    dismissMeetupPrompt: jest.fn(),
  });

  mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn(), cancelQueries: jest.fn() });

  mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });

  // Dogs query
  mockUseQuery.mockReturnValue({ data: dogs, isLoading: false, refetch: jest.fn() });

  // Feed data
  mockUseFeedData.mockReturnValue({
    feedQueryKey: ['feed', 'GOLDEN_RETRIEVER', 'all', 'u1'],
    posts: [],
    isLoading: false,
    isFetchingNextPage: false,
    isPullRefreshing: false,
    reactionMenuOpen: false,
    handleRefresh: jest.fn(),
    handlePostPress: jest.fn(),
    handleEditPost: jest.fn(),
    handleAuthorPress: jest.fn(),
    handleDeletePost: jest.fn(),
    handleReactionSelect: jest.fn(),
    handleRsvpToggle: jest.fn(),
    handleEndReached: jest.fn(),
    renderFeedItem: () => null,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it('renders without crashing when user is logged in', () => {
    expect(() => render(
      <HomeScreen navigation={{ navigate: jest.fn() } as never} />
    )).not.toThrow();
  });

  it('shows "Sign in to see your feed" when user is null', () => {
    setupDefaultMocks({ user: null as never });
    render(<HomeScreen navigation={{ navigate: jest.fn() } as never} />);
    expect(screen.getByText('Sign in to see your feed')).toBeTruthy();
  });

  it('shows "Add a dog profile" message when user has no dogs and no onboarding dog', () => {
    setupDefaultMocks({ dogs: [] });
    render(<HomeScreen navigation={{ navigate: jest.fn() } as never} />);
    expect(screen.getByText(/Add a dog profile/)).toBeTruthy();
  });

  it('shows loading spinner when feed is loading', () => {
    mockUseFeedData.mockReturnValue({
      feedQueryKey: ['feed', 'GOLDEN_RETRIEVER', 'all', 'u1'],
      posts: [],
      isLoading: true,
      isFetchingNextPage: false,
      isPullRefreshing: false,
      reactionMenuOpen: false,
      handleRefresh: jest.fn(),
      handlePostPress: jest.fn(),
      handleEditPost: jest.fn(),
      handleAuthorPress: jest.fn(),
      handleDeletePost: jest.fn(),
      handleReactionSelect: jest.fn(),
      handleRsvpToggle: jest.fn(),
      handleEndReached: jest.fn(),
      renderFeedItem: () => null,
    });

    render(<HomeScreen navigation={{ navigate: jest.fn() } as never} />);
    const indicators = screen.UNSAFE_getAllByType(require('react-native').ActivityIndicator);
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('does not render the feed list when user is null (no hook ordering crash)', () => {
    setupDefaultMocks({ user: null as never });
    // If there were a hooks ordering violation, this render would throw
    expect(() => render(
      <HomeScreen navigation={{ navigate: jest.fn() } as never} />
    )).not.toThrow();
  });
});
