import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OnboardingCompleteCard } from '@/components/OnboardingCompleteCard';

const baseProps = {
  visible: true,
  dogName: 'Buddy',
  breed: 'AUSTRALIAN_SHEPHERD',
  onGoToFeed: jest.fn(),
  onExplore: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OnboardingCompleteCard', () => {
  it('renders the dog name and pack name in the title', () => {
    render(<OnboardingCompleteCard {...baseProps} />);

    expect(screen.getByText('Buddy has joined the Aussie pack')).toBeTruthy();
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
      const { unmount } = render(
        <OnboardingCompleteCard {...baseProps} breed={breed} />
      );
      expect(screen.getByText(`Buddy has joined the ${packName} pack`)).toBeTruthy();
      unmount();
    }
  });

  it('renders the bullet points and both action buttons', () => {
    render(<OnboardingCompleteCard {...baseProps} />);

    expect(screen.getByText('You can now:')).toBeTruthy();
    expect(screen.getByText('• Ask questions')).toBeTruthy();
    expect(screen.getByText('• Share updates')).toBeTruthy();
    expect(screen.getByText('• Meet other Aussies nearby')).toBeTruthy();
    expect(screen.getByText('Go to Feed')).toBeTruthy();
    expect(screen.getByText('Explore other breeds')).toBeTruthy();
  });

  it('"Go to Feed" calls onGoToFeed', () => {
    const onGoToFeed = jest.fn();
    render(<OnboardingCompleteCard {...baseProps} onGoToFeed={onGoToFeed} />);

    fireEvent.press(screen.getByText('Go to Feed'));

    expect(onGoToFeed).toHaveBeenCalledTimes(1);
  });

  it('"Explore other breeds" calls onExplore', () => {
    const onExplore = jest.fn();
    render(<OnboardingCompleteCard {...baseProps} onExplore={onExplore} />);

    fireEvent.press(screen.getByText('Explore other breeds'));

    expect(onExplore).toHaveBeenCalledTimes(1);
  });
});
