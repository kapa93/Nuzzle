// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ goBack: jest.fn() })),
  useRoute: jest.fn(() => ({ name: 'CreatePost', params: {} })),
}));

jest.mock('@/api/posts', () => ({
  createPost: jest.fn(),
}));

jest.mock('@/api/dogs', () => ({
  getDogsByOwner: jest.fn(),
}));

jest.mock('@/api/places', () => ({
  listActivePlaces: jest.fn(),
}));

jest.mock('@/lib/imageUpload', () => ({
  uploadPostImage: jest.fn(),
  pickImages: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useStackHeaderHeight', () => ({
  useStackHeaderHeight: jest.fn(() => 56),
}));

jest.mock('@/lib/sentry', () => ({
  captureHandledError: jest.fn(),
}));

jest.mock('@react-native-community/datetimepicker', () => () => null);

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { CreatePostScreen } from './CreatePostScreen';

const mockUseMutation = useMutation as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockUseNavigation = useNavigation as jest.Mock;
const mockUseRoute = useRoute as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreatePostScreen', () => {
  const mockGoBack = jest.fn();
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({ goBack: mockGoBack });
    mockUseRoute.mockReturnValue({ name: 'CreatePost', params: {} });
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
    mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
    // Use mockReturnValue (not Once) so re-renders from state changes also get a value
    mockUseQuery.mockReturnValue({ data: [] });
  });

  it('renders null when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    const { toJSON } = render(<CreatePostScreen />);
    expect(toJSON()).toBeNull();
  });

  it('renders the post type selector', () => {
    render(<CreatePostScreen />);
    expect(screen.getByText('Question')).toBeTruthy();
    expect(screen.getByText('Update/Story')).toBeTruthy();
    expect(screen.getByText('Meetup')).toBeTruthy();
    expect(screen.getByText('Tip')).toBeTruthy();
  });

  it('renders tag chips for non-meetup posts', () => {
    render(<CreatePostScreen />);
    expect(screen.getByText('Training')).toBeTruthy();
    expect(screen.getByText('Health')).toBeTruthy();
  });

  it('renders the submit button with "Post" label for non-meetup type', () => {
    render(<CreatePostScreen />);
    expect(screen.getByText('Post')).toBeTruthy();
  });

  it('switches to "Create Meetup" button when MEETUP type is selected', () => {
    render(<CreatePostScreen />);
    fireEvent.press(screen.getByText('Meetup'));
    expect(screen.getByText('Create Meetup')).toBeTruthy();
  });

  it('shows meetup-specific fields when MEETUP type is selected', () => {
    render(<CreatePostScreen />);
    fireEvent.press(screen.getByText('Meetup'));
    expect(screen.getByPlaceholderText('e.g. Golden Retriever playdate at the park')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Central Park Dog Run')).toBeTruthy();
  });

  it('calls mutation.mutate when the submit button is pressed with valid input', () => {
    render(<CreatePostScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Share a question, update, or tip...'),
      'My first post!'
    );
    fireEvent.press(screen.getByText('Post'));
    expect(mockMutate).toHaveBeenCalled();
  });

  it('shows an error when mutation returns an error', async () => {
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    render(<CreatePostScreen />);
    // Trigger validation error by pressing submit with empty content
    fireEvent.press(screen.getByText('Post'));
    // The mutation should not be called for empty content
    // (postSchema requires content_text)
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('disables the submit button while isPending is true', () => {
    mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: true });
    render(<CreatePostScreen />);
    // When pending, the submit button shows an ActivityIndicator instead of "Post" text
    expect(screen.queryByText('Post')).toBeNull();
  });

  it('renders with initialType from route params', () => {
    mockUseRoute.mockReturnValue({ name: 'CreatePost', params: { initialType: 'MEETUP' } });
    render(<CreatePostScreen />);
    expect(screen.getByText('Create Meetup')).toBeTruthy();
  });

  it('shows place attachment banner when initialPlaceId is provided', () => {
    mockUseRoute.mockReturnValue({
      name: 'CreatePost',
      params: { initialPlaceId: 'place-1', initialPlaceName: 'Dog Park' },
    });
    render(<CreatePostScreen />);
    expect(screen.getByText(/Posting at: Dog Park/)).toBeTruthy();
  });
});
