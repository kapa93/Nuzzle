// ─── Mocks (must be at top, before any imports) ──────────────────────────────

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockIcon = () => React.createElement(View, null);
  return { Ionicons: MockIcon, FontAwesome6: MockIcon };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 0),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: jest.fn(() => 49),
}));

jest.mock('@/navigation/NuzzleTabBar', () => ({
  NUZZLE_TAB_BAR_LAYOUT_EXTENDS_BELOW_SCREEN: 34,
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useSavedPlaces', () => ({
  useSavedPlaces: jest.fn(),
  useToggleSavedPlace: jest.fn(),
}));

jest.mock('@/api/places', () => ({
  getPlaceById: jest.fn(),
  getActivePlaceCheckins: jest.fn(),
}));

jest.mock('@/api/posts', () => ({
  getPlaceMeetupPosts: jest.fn(),
  getPlacePosts: jest.fn(),
}));

jest.mock('@/api/meetups', () => ({
  rsvpMeetup: jest.fn(),
  unrsvpMeetup: jest.fn(),
}));

jest.mock('@/api/reactions', () => ({
  setReaction: jest.fn(),
}));

jest.mock('@/components/PostCard', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    PostCard: ({ post, onPress }: { post: { content_text: string; id: string }; onPress: () => void }) =>
      React.createElement(
        TouchableOpacity,
        { onPress, accessibilityLabel: `post-${post.id}` },
        React.createElement(Text, null, post.content_text),
      ),
  };
});

jest.mock('@/api/dogs', () => ({
  getDogsByOwner: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@/components/MetThisDogButton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MetThisDogButton: () => React.createElement(View, null),
  };
});

jest.mock('@/components/DogAvatar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    DogAvatar: () => React.createElement(View, null),
  };
});

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useSavedPlaces, useToggleSavedPlace } from '@/hooks/useSavedPlaces';
import { PlaceDetailScreen } from '@/screens/PlaceDetailScreen';
import type { ActivePlaceCheckin, MeetupKind, Place, PostWithDetails } from '@/types';

// ─── Typed mock helpers ───────────────────────────────────────────────────────

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseSavedPlaces = useSavedPlaces as jest.Mock;
const mockUseToggleSavedPlace = useToggleSavedPlace as jest.Mock;

// ─── Stub data ────────────────────────────────────────────────────────────────

const stubPlace: Place = {
  id: 'place-1',
  name: 'Ocean Beach Dog Beach',
  slug: 'ocean-beach-dog-beach',
  google_place_id: null,
  place_type: 'dog_beach',
  city: 'San Diego',
  neighborhood: 'Ocean Beach',
  latitude: 32.74,
  longitude: -117.25,
  check_in_radius_meters: 400,
  check_in_duration_minutes: 60,
  description: null,
  is_active: true,
  supports_check_in: true,
  photos: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const stubCheckin: ActivePlaceCheckin = {
  id: 'checkin-1',
  user_id: 'user-1',
  dog_id: 'dog-1',
  place_id: 'place-1',
  location_key: 'ocean-beach-dog-beach',
  location_name: 'Ocean Beach Dog Beach',
  created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
  expires_at: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
  ended_at: null,
  dog_name: 'Biscuit',
  dog_breed: 'GOLDEN_RETRIEVER',
  dog_play_style: 'chase',
  dog_image_url: null,
  owner_name: 'Alex',
};

const navigate = jest.fn();
const setOptions = jest.fn();

// ─── Stub feed post data ─────────────────────────────────────────────────────

const stubFeedPost: PostWithDetails = {
  id: 'post-feed-1',
  author_id: 'user-3',
  breed: 'GOLDEN_RETRIEVER',
  type: 'UPDATE_STORY',
  tag: 'PLAYDATE',
  title: 'Great day at the beach!',
  content_text: 'Such a fun afternoon at OB.',
  place_id: 'place-1',
  created_at: '2026-04-10T12:00:00Z',
  updated_at: '2026-04-10T12:00:00Z',
  author_name: 'Jordan',
  author_dog_image_url: null,
  author_dog_name: 'Sunny',
  images: [],
  reaction_counts: {},
  user_reaction: null,
  comment_count: 2,
};

// ─── Stub meetup data ─────────────────────────────────────────────────────────

const stubMeetupPost: PostWithDetails = {
  id: 'post-meetup-1',
  author_id: 'user-2',
  breed: 'GOLDEN_RETRIEVER',
  type: 'MEETUP',
  tag: 'PLAYDATE',
  title: 'Golden Retriever Meetup',
  content_text: 'Bring your goldens!',
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
  author_name: 'Sam',
  author_dog_image_url: null,
  author_dog_name: null,
  images: [],
  reaction_counts: {},
  user_reaction: null,
  comment_count: 0,
  attendee_count: 3,
  user_rsvped: false,
  meetup_details: {
    post_id: 'post-meetup-1',
    place_id: 'place-1',
    location_name: 'Ocean Beach Dog Beach',
    start_time: '2026-05-15T09:00:00Z',
    end_time: null,
    meetup_kind: 'beach' as MeetupKind,
    spots_available: 10,
    host_notes: null,
    is_recurring_seeded: false,
    created_at: '2026-05-01T10:00:00Z',
    updated_at: '2026-05-01T10:00:00Z',
  },
};

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup({
  place = stubPlace as Place | null | undefined,
  placeLoading = false,
  checkins = [] as ActivePlaceCheckin[],
  checkinsLoading = false,
  meetups = [] as PostWithDetails[],
  meetupsLoading = false,
  feedPosts = [] as PostWithDetails[],
  feedLoading = false,
  savedIds = new Set<string>(),
}: {
  place?: Place | null | undefined;
  placeLoading?: boolean;
  checkins?: ActivePlaceCheckin[];
  checkinsLoading?: boolean;
  meetups?: PostWithDetails[];
  meetupsLoading?: boolean;
  feedPosts?: PostWithDetails[];
  feedLoading?: boolean;
  savedIds?: Set<string>;
} = {}) {
  mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
  mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });

  const mutateFn = jest.fn();
  mockUseMutation.mockReturnValue({ mutate: mutateFn, isPending: false });
  mockUseToggleSavedPlace.mockReturnValue({ mutate: mutateFn, isPending: false });
  mockUseSavedPlaces.mockReturnValue({
    savedPlaces: [],
    savedPlaceIds: savedIds,
    isLoading: false,
  });

  // Use mockImplementation so re-renders don't exhaust the mock queue.
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    if (key === 'place') return { data: place ?? undefined, isLoading: placeLoading };
    if (key === 'placeActiveCheckins') return { data: checkins, isLoading: checkinsLoading };
    if (key === 'placeMeetups') return { data: meetups, isLoading: meetupsLoading };
    if (key === 'placePosts') return { data: feedPosts, isLoading: feedLoading };
    return { data: [], isLoading: false }; // myDogs / others
  });

  return { mutateFn };
}

const defaultRoute = { params: { placeId: 'place-1' } };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PlaceDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigate.mockReset();
    setOptions.mockReset();
  });

  // ── Header / place summary ──────────────────────────────────────────────────

  it('calls setOptions with the place name as title', () => {
    setup();
    render(
      <PlaceDetailScreen
        route={defaultRoute}
        navigation={{ navigate, setOptions }}
      />,
    );
    expect(setOptions).toHaveBeenCalledWith(expect.objectContaining({ title: 'Ocean Beach Dog Beach' }));
  });

  it('renders the place type chip', () => {
    setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('Dog Beach')).toBeTruthy();
  });

  it('renders the neighborhood and city', () => {
    setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('Ocean Beach, San Diego')).toBeTruthy();
  });

  it('renders the Check In button when supports_check_in is true', () => {
    setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByLabelText('Check in at this place')).toBeTruthy();
  });

  it('does not render Check In button when supports_check_in is false', () => {
    setup({ place: { ...stubPlace, supports_check_in: false } });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.queryByLabelText('Check in at this place')).toBeNull();
  });

  it('shows loading state while place is loading', () => {
    setup({ place: null, placeLoading: true });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows not found when place is undefined and not loading', () => {
    setup({ place: null, placeLoading: false });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('Place not found.')).toBeTruthy();
  });

  // ── Tab bar ─────────────────────────────────────────────────────────────────

  it('renders all three tabs', () => {
    setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('Feed')).toBeTruthy();
    expect(screen.getByText('Dogs')).toBeTruthy();
    expect(screen.getByText('Meetups')).toBeTruthy();
  });

  it('shows Feed tab content by default', () => {
    setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('No posts here yet')).toBeTruthy();
  });

  it('switches to Dogs tab when tapped', () => {
    setup({ checkins: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Dogs'));
    expect(screen.getByText('No dogs here right now')).toBeTruthy();
  });

  it('switches to Meetups tab when tapped', () => {
    setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Meetups'));
    expect(screen.getByText('No meetups scheduled here')).toBeTruthy();
  });

  // ── Dogs tab ─────────────────────────────────────────────────────────────────

  it('renders checked-in dogs in the Dogs tab', () => {
    setup({ checkins: [stubCheckin] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Dogs'));
    expect(screen.getByText('Biscuit')).toBeTruthy();
    expect(screen.getByText(/Golden Retriever/i)).toBeTruthy();
  });

  it('shows owner name in dog meta', () => {
    setup({ checkins: [stubCheckin] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Dogs'));
    expect(screen.getByText(/Alex/)).toBeTruthy();
  });

  it('navigates to DogProfile when a dog row is pressed', () => {
    setup({ checkins: [stubCheckin] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Dogs'));
    fireEvent.press(screen.getByText('Biscuit'));
    expect(navigate).toHaveBeenCalledWith('DogProfile', { dogId: 'dog-1' });
  });

  it('shows loading while check-ins are loading', () => {
    setup({ checkinsLoading: true, checkins: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Dogs'));
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  // ── Save / unsave ────────────────────────────────────────────────────────────

  it('fires the toggle mutation when the save button is pressed', () => {
    const { mutateFn } = setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByLabelText('Save place'));
    expect(mutateFn).toHaveBeenCalledWith({ placeId: 'place-1', isSaved: false });
  });

  it('shows Unsave label when place is already saved', () => {
    setup({ savedIds: new Set(['place-1']) });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByLabelText('Unsave place')).toBeTruthy();
  });

  // ── Check In navigation ──────────────────────────────────────────────────────

  it('navigates to PlaceNow when Check In is pressed', () => {
    setup();
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByLabelText('Check in at this place'));
    expect(navigate).toHaveBeenCalledWith('PlaceNow', { placeId: 'place-1' });
  });

  // ── Meetups tab ──────────────────────────────────────────────────────────────

  it('shows Meetups empty state when there are no meetups for the place', () => {
    setup({ meetups: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Meetups'));
    expect(screen.getByText('No meetups scheduled here')).toBeTruthy();
  });

  it('renders a meetup item in the Meetups tab', () => {
    setup({ meetups: [stubMeetupPost] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Meetups'));
    expect(screen.getByText('Golden Retriever Meetup')).toBeTruthy();
  });

  it('shows meetup kind badge in the Meetups tab', () => {
    setup({ meetups: [stubMeetupPost] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Meetups'));
    expect(screen.getByText('Beach')).toBeTruthy();
  });

  it('shows attendee count in the Meetups tab', () => {
    setup({ meetups: [stubMeetupPost] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Meetups'));
    expect(screen.getByText(/3 going/)).toBeTruthy();
  });

  it('navigates to PostDetail when a meetup item is tapped', () => {
    setup({ meetups: [stubMeetupPost] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Meetups'));
    fireEvent.press(screen.getByText('Golden Retriever Meetup'));
    expect(navigate).toHaveBeenCalledWith('PostDetail', { postId: 'post-meetup-1' });
  });

  it('shows loading indicator while meetups are loading', () => {
    setup({ meetupsLoading: true, meetups: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Meetups'));
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  // ── Feed tab ─────────────────────────────────────────────────────────────────

  it('shows Feed empty state when no place-linked posts exist', () => {
    setup({ feedPosts: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('No posts here yet')).toBeTruthy();
  });

  it('Feed empty state includes a "Post here" CTA', () => {
    setup({ feedPosts: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    // Both the header button and the empty-state CTA share this label
    expect(screen.getAllByLabelText('Post here').length).toBeGreaterThanOrEqual(1);
  });

  it('Feed empty state CTA navigates to CreatePost with place context', () => {
    setup({ feedPosts: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    // Press the first "Post here" (any will navigate with the same place context)
    fireEvent.press(screen.getAllByLabelText('Post here')[0]);
    expect(navigate).toHaveBeenCalledWith('CreatePost', {
      initialPlaceId: 'place-1',
      initialPlaceName: 'Ocean Beach Dog Beach',
    });
  });

  it('renders place-linked posts in the Feed tab', () => {
    setup({ feedPosts: [stubFeedPost] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('Such a fun afternoon at OB.')).toBeTruthy();
  });

  it('navigates to PostDetail when a feed post is pressed', () => {
    setup({ feedPosts: [stubFeedPost] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    fireEvent.press(screen.getByText('Such a fun afternoon at OB.'));
    expect(navigate).toHaveBeenCalledWith('PostDetail', { postId: 'post-feed-1' });
  });

  it('shows loading indicator in Feed tab while posts are loading', () => {
    setup({ feedLoading: true, feedPosts: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  // ── "Post here" header button ─────────────────────────────────────────────────

  it('renders the "Post here" button in the place summary', () => {
    setup({ feedPosts: [stubFeedPost] }); // posts present → no empty-state CTA, only header btn
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    expect(screen.getByLabelText('Post here')).toBeTruthy();
  });

  it('"Post here" summary button navigates to CreatePost with place context', () => {
    setup({ feedPosts: [] });
    render(
      <PlaceDetailScreen route={defaultRoute} navigation={{ navigate, setOptions }} />,
    );
    // Press the header-level "Post here" (not the empty-state CTA)
    const buttons = screen.getAllByLabelText('Post here');
    fireEvent.press(buttons[0]);
    expect(navigate).toHaveBeenCalledWith('CreatePost', {
      initialPlaceId: 'place-1',
      initialPlaceName: 'Ocean Beach Dog Beach',
    });
  });
});
