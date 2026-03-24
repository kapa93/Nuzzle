import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MeetupPromptCard } from '@/components/MeetupPromptCard';

const baseProps = {
  onCreateMeetup: jest.fn(),
  onExploreMeetups: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MeetupPromptCard', () => {
  it('renders the heading and supporting copy', () => {
    render(<MeetupPromptCard {...baseProps} />);

    expect(screen.getByText('🐾 Meet dogs nearby')).toBeTruthy();
    expect(screen.getByText('Set up a meetup or join one in your area')).toBeTruthy();
  });

  it('renders both action buttons', () => {
    render(<MeetupPromptCard {...baseProps} />);

    expect(screen.getByText('Create a meetup')).toBeTruthy();
    expect(screen.getByText('Explore meetups')).toBeTruthy();
  });

  it('"Create a meetup" calls onCreateMeetup', () => {
    const onCreateMeetup = jest.fn();
    render(<MeetupPromptCard {...baseProps} onCreateMeetup={onCreateMeetup} />);

    fireEvent.press(screen.getByText('Create a meetup'));

    expect(onCreateMeetup).toHaveBeenCalledTimes(1);
  });

  it('"Explore meetups" calls onExploreMeetups', () => {
    const onExploreMeetups = jest.fn();
    render(<MeetupPromptCard {...baseProps} onExploreMeetups={onExploreMeetups} />);

    fireEvent.press(screen.getByText('Explore meetups'));

    expect(onExploreMeetups).toHaveBeenCalledTimes(1);
  });
});
