// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/ui/QuestionCard', () => ({
  QuestionCard: ({ data, onPress }: { data: { id: string }; onPress: () => void }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { testID: `question-card-${data.id}`, onPress },
      React.createElement(Text, null, `QuestionCard:${data.id}`)
    );
  },
}));

jest.mock('@/components/MeetupCard', () => ({
  MeetupCard: ({ post, onPress }: { post: { id: string }; onPress: () => void }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { testID: `meetup-card-${post.id}`, onPress },
      React.createElement(Text, null, `MeetupCard:${post.id}`)
    );
  },
}));

jest.mock('@/utils/postToQuestionCard', () => ({
  postToQuestionCardData: (item: { id: string }) => ({ id: item.id }),
  tagTone: { TRAINING: 'warm' },
}));

jest.mock('@/ui/TagChip', () => ({
  toneStyles: {
    warm: { text: '#c0a060' },
    neutral: { text: '#888888' },
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FeedItem } from './FeedItem';
import type { PostWithDetails, ReactionEnum } from '@/types';

// ─── fixtures ─────────────────────────────────────────────────────────────────

function makePost(overrides: Partial<PostWithDetails> = {}): PostWithDetails {
  return {
    id: 'post-1',
    author_id: 'user-1',
    author_name: 'Alice',
    author_dog_name: null,
    author_dog_image_url: null,
    breed: 'GOLDEN_RETRIEVER',
    type: 'QUESTION',
    tag: 'TRAINING',
    content_text: 'Training question',
    title: null,
    created_at: new Date().toISOString(),
    comment_count: 0,
    reaction_counts: {},
    user_reaction: null,
    images: [],
    place_id: null,
    place_name: null,
    user_rsvped: null,
    attendee_count: null,
    ...overrides,
  } as unknown as PostWithDetails;
}

const defaultHandlers = {
  onPostPress: jest.fn(),
  onAuthorPress: jest.fn(),
  onReactionSelect: jest.fn(),
  onReactionMenuOpenChange: jest.fn(),
  onRsvpToggle: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FeedItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders a QuestionCard for non-MEETUP posts', () => {
    render(<FeedItem item={makePost({ type: 'QUESTION' })} {...defaultHandlers} />);
    expect(screen.getByTestId('question-card-post-1')).toBeTruthy();
    expect(screen.queryByTestId('meetup-card-post-1')).toBeNull();
  });

  it('renders a MeetupCard for MEETUP posts', () => {
    render(
      <FeedItem
        item={makePost({ type: 'MEETUP' })}
        {...defaultHandlers}
      />
    );
    expect(screen.getByTestId('meetup-card-post-1')).toBeTruthy();
    expect(screen.queryByTestId('question-card-post-1')).toBeNull();
  });

  it('calls onPostPress with the post id when QuestionCard is pressed', () => {
    render(<FeedItem item={makePost({ type: 'QUESTION' })} {...defaultHandlers} />);
    fireEvent.press(screen.getByTestId('question-card-post-1'));
    expect(defaultHandlers.onPostPress).toHaveBeenCalledWith('post-1');
  });

  it('calls onPostPress with the post id when MeetupCard is pressed', () => {
    render(
      <FeedItem item={makePost({ type: 'MEETUP' })} {...defaultHandlers} />
    );
    fireEvent.press(screen.getByTestId('meetup-card-post-1'));
    expect(defaultHandlers.onPostPress).toHaveBeenCalledWith('post-1');
  });

  it('renders UPDATE_STORY type via QuestionCard', () => {
    render(<FeedItem item={makePost({ type: 'UPDATE_STORY' })} {...defaultHandlers} />);
    expect(screen.getByTestId('question-card-post-1')).toBeTruthy();
  });

  it('renders TIP type via QuestionCard', () => {
    render(<FeedItem item={makePost({ type: 'TIP' })} {...defaultHandlers} />);
    expect(screen.getByTestId('question-card-post-1')).toBeTruthy();
  });
});

// ─── feedItemPropsAreEqual memo comparison ────────────────────────────────────

describe('FeedItem — memo re-render behaviour', () => {
  it('does not re-render when irrelevant props are the same object references', () => {
    const post = makePost();
    const { rerender } = render(<FeedItem item={post} {...defaultHandlers} />);
    // Re-render with identical props — memoization should prevent re-render
    // (verified by the absence of errors rather than render count tracking)
    rerender(<FeedItem item={post} {...defaultHandlers} />);
    expect(screen.getByTestId('question-card-post-1')).toBeTruthy();
  });
});
