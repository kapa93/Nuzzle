// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./DogAvatar', () => ({
  DogAvatar: ({ name }: { name: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'dog-avatar' }, name);
  },
}));

jest.mock('./PostImageCarousel', () => ({
  PostImageCarousel: () => null,
}));

jest.mock('./ReactionBar', () => ({
  ReactionBar: ({ onSelect }: { onSelect: (r: string | null) => void }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { testID: 'reaction-bar', onPress: () => onSelect('LIKE') },
      React.createElement(Text, null, 'React')
    );
  },
}));

jest.mock('lucide-react-native', () => ({}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PostCard } from './PostCard';
import type { PostWithDetails } from '@/types';

// ─── fixtures ─────────────────────────────────────────────────────────────────

function makePost(overrides: Partial<PostWithDetails> = {}): PostWithDetails {
  return {
    id: 'post-1',
    author_id: 'user-1',
    author_name: 'Alice',
    author_dog_name: 'Buddy',
    author_dog_image_url: null,
    breed: 'GOLDEN_RETRIEVER',
    type: 'QUESTION',
    tag: 'TRAINING',
    content_text: 'Any training tips?',
    title: null,
    created_at: new Date().toISOString(),
    comment_count: 3,
    reaction_counts: { LIKE: 2 },
    user_reaction: null,
    images: [],
    place_id: null,
    place_name: null,
    user_rsvped: null,
    attendee_count: null,
    ...overrides,
  } as unknown as PostWithDetails;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PostCard', () => {
  const mockOnPress = jest.fn();
  const mockOnReactionSelect = jest.fn();
  const mockOnAuthorPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders the author name', () => {
    render(
      <PostCard
        post={makePost()}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    expect(screen.getByText(/Alice/)).toBeTruthy();
  });

  it('renders the breed, type, and tag meta line', () => {
    render(
      <PostCard
        post={makePost()}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    // meta = "Golden Retriever · Question · Training"
    expect(screen.getByText(/Golden Retriever/)).toBeTruthy();
    expect(screen.getByText(/Question/)).toBeTruthy();
    expect(screen.getByText(/Training/)).toBeTruthy();
  });

  it('uses content_text as the title when post.title is null', () => {
    render(
      <PostCard
        post={makePost({ title: null, content_text: 'Any training tips?' })}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    expect(screen.getByText('Any training tips?')).toBeTruthy();
  });

  it('truncates content_text to 80 characters when used as title', () => {
    const longText = 'a'.repeat(100);
    render(
      <PostCard
        post={makePost({ title: null, content_text: longText })}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    expect(screen.getByText('a'.repeat(80) + '…')).toBeTruthy();
  });

  it('shows the explicit title when post.title is set', () => {
    render(
      <PostCard
        post={makePost({ title: 'My post title', content_text: 'Body text here.' })}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    expect(screen.getByText('My post title')).toBeTruthy();
  });

  it('shows content_text as preview when post.title is set', () => {
    render(
      <PostCard
        post={makePost({ title: 'My post title', content_text: 'Preview body text.' })}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    expect(screen.getByText('Preview body text.')).toBeTruthy();
  });

  it('shows the comment count', () => {
    render(
      <PostCard
        post={makePost({ comment_count: 5 })}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    expect(screen.getByText('5 comments')).toBeTruthy();
  });

  it('shows 0 comments when comment_count is null', () => {
    render(
      <PostCard
        post={makePost({ comment_count: null as unknown as number })}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    expect(screen.getByText('0 comments')).toBeTruthy();
  });

  it('calls onPress when the card is tapped', () => {
    render(
      <PostCard
        post={makePost()}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    fireEvent.press(screen.getByText('Any training tips?'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('calls onAuthorPress with the author id when the author area is pressed', () => {
    render(
      <PostCard
        post={makePost()}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
        onAuthorPress={mockOnAuthorPress}
      />
    );
    // The Pressable calls event.stopPropagation() — supply it in the event data
    fireEvent.press(screen.getByTestId('dog-avatar'), { stopPropagation: jest.fn() });
    expect(mockOnAuthorPress).toHaveBeenCalledWith('user-1');
  });

  it('passes onReactionSelect to ReactionBar', () => {
    render(
      <PostCard
        post={makePost()}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    fireEvent.press(screen.getByTestId('reaction-bar'));
    expect(mockOnReactionSelect).toHaveBeenCalledWith('LIKE');
  });

  it('does not render a preview when post.title is null', () => {
    render(
      <PostCard
        post={makePost({ title: null, content_text: 'Content as title' })}
        onPress={mockOnPress}
        onReactionSelect={mockOnReactionSelect}
      />
    );
    // text appears once (as title), not twice
    const nodes = screen.getAllByText('Content as title');
    expect(nodes).toHaveLength(1);
  });
});
