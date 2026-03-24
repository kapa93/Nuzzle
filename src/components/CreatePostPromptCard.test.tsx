import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CreatePostPromptCard } from '@/components/CreatePostPromptCard';

const baseProps = {
  breed: 'AUSTRALIAN_SHEPHERD',
  onCreatePost: jest.fn(),
  onDismiss: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreatePostPromptCard', () => {
  it('renders the pack name in the heading', () => {
    render(<CreatePostPromptCard {...baseProps} />);

    expect(screen.getByText('🐶 Welcome to the Aussie Pack')).toBeTruthy();
  });

  it('renders the correct pack name for each breed', () => {
    const cases: Array<{ breed: string; packName: string }> = [
      { breed: 'AUSTRALIAN_SHEPHERD', packName: 'Aussie' },
      { breed: 'HUSKY', packName: 'Husky' },
      { breed: 'GOLDEN_RETRIEVER', packName: 'Golden' },
      { breed: 'FRENCH_BULLDOG', packName: 'Frenchie' },
      { breed: 'PIT_BULL', packName: 'Pit Bull' },
      { breed: 'LABRADOR_RETRIEVER', packName: 'Lab' },
    ];

    for (const { breed, packName } of cases) {
      const { unmount } = render(<CreatePostPromptCard {...baseProps} breed={breed} />);
      expect(screen.getByText(`🐶 Welcome to the ${packName} Pack`)).toBeTruthy();
      unmount();
    }
  });

  it('renders the supporting copy and both action buttons', () => {
    render(<CreatePostPromptCard {...baseProps} />);

    expect(screen.getByText('Ask a question or share a tip to get started')).toBeTruthy();
    expect(screen.getByText('Create your first post')).toBeTruthy();
    expect(screen.getByText('Not now')).toBeTruthy();
  });

  it('"Create your first post" calls onCreatePost', () => {
    const onCreatePost = jest.fn();
    render(<CreatePostPromptCard {...baseProps} onCreatePost={onCreatePost} />);

    fireEvent.press(screen.getByText('Create your first post'));

    expect(onCreatePost).toHaveBeenCalledTimes(1);
  });

  it('"Not now" calls onDismiss', () => {
    const onDismiss = jest.fn();
    render(<CreatePostPromptCard {...baseProps} onDismiss={onDismiss} />);

    fireEvent.press(screen.getByText('Not now'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
