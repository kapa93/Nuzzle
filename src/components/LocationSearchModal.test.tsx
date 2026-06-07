import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LocationSearchModal } from '@/components/LocationSearchModal';
import { searchLocationCandidates } from '@/api/places';
import type { LocationCandidate } from '@/api/places';

jest.mock('@/api/places');

const mockSearchLocationCandidates = searchLocationCandidates as jest.Mock;

const SAMPLE_RESULTS: LocationCandidate[] = [
  { name: 'Seattle, WA', formattedAddress: 'Seattle, Washington, USA', latitude: 47.6062, longitude: -122.3321 },
  { name: 'Portland, OR', formattedAddress: 'Portland, Oregon, USA', latitude: 45.5051, longitude: -122.675 },
];

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  onSelect: jest.fn(),
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderModal(props: Partial<typeof baseProps> = {}) {
  const client = makeQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <LocationSearchModal {...baseProps} {...props} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockSearchLocationCandidates.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LocationSearchModal', () => {
  describe('initial / hint state', () => {
    it('shows the hint text when no query has been typed', () => {
      renderModal();
      expect(
        screen.getByText(/Type a city, neighborhood, or landmark/i)
      ).toBeTruthy();
    });

    it('does not call searchLocationCandidates on mount', () => {
      renderModal();
      expect(mockSearchLocationCandidates).not.toHaveBeenCalled();
    });

    it('renders the header title and back button', () => {
      renderModal();
      expect(screen.getByText('Set Your Location')).toBeTruthy();
      expect(screen.getByLabelText('Back')).toBeTruthy();
    });
  });

  describe('query shorter than 2 characters', () => {
    it('still shows the hint text', () => {
      renderModal();
      fireEvent.changeText(
        screen.getByPlaceholderText(/City, neighborhood, landmark/i),
        'S'
      );
      act(() => { jest.advanceTimersByTime(400); });
      expect(screen.getByText(/Type a city, neighborhood, or landmark/i)).toBeTruthy();
      expect(mockSearchLocationCandidates).not.toHaveBeenCalled();
    });
  });

  describe('query of 2+ characters', () => {
    it('calls searchLocationCandidates with the debounced value', async () => {
      mockSearchLocationCandidates.mockResolvedValue(SAMPLE_RESULTS);
      renderModal();

      fireEvent.changeText(
        screen.getByPlaceholderText(/City, neighborhood, landmark/i),
        'Se'
      );

      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(mockSearchLocationCandidates).toHaveBeenCalledWith('Se');
      });
    });

    it('renders each result name in the list', async () => {
      mockSearchLocationCandidates.mockResolvedValue(SAMPLE_RESULTS);
      renderModal();

      fireEvent.changeText(
        screen.getByPlaceholderText(/City, neighborhood, landmark/i),
        'Seattle'
      );

      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(screen.getByText('Seattle, WA')).toBeTruthy();
        expect(screen.getByText('Portland, OR')).toBeTruthy();
      });
    });

    it('renders the formatted address under the result name', async () => {
      mockSearchLocationCandidates.mockResolvedValue(SAMPLE_RESULTS);
      renderModal();

      fireEvent.changeText(
        screen.getByPlaceholderText(/City, neighborhood, landmark/i),
        'Seattle'
      );

      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(screen.getByText('Seattle, Washington, USA')).toBeTruthy();
      });
    });

    it('shows the empty state when no results are returned', async () => {
      mockSearchLocationCandidates.mockResolvedValue([]);
      renderModal();

      fireEvent.changeText(
        screen.getByPlaceholderText(/City, neighborhood, landmark/i),
        'Xyzzy'
      );

      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(screen.getByText(/No results found/i)).toBeTruthy();
      });
    });
  });

  describe('selecting a result', () => {
    it('calls onSelect with the full candidate object', async () => {
      const onSelect = jest.fn();
      mockSearchLocationCandidates.mockResolvedValue(SAMPLE_RESULTS);
      renderModal({ onSelect });

      fireEvent.changeText(
        screen.getByPlaceholderText(/City, neighborhood, landmark/i),
        'Seattle'
      );

      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(screen.getByText('Seattle, WA')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Seattle, WA'));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(SAMPLE_RESULTS[0]);
    });
  });

  describe('back button', () => {
    it('calls onClose when pressed', () => {
      const onClose = jest.fn();
      renderModal({ onClose });

      fireEvent.press(screen.getByLabelText('Back'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('closing and reopening resets state', () => {
    it('shows hint text again after visible toggles false then true', async () => {
      mockSearchLocationCandidates.mockResolvedValue(SAMPLE_RESULTS);
      const client = makeQueryClient();

      const { rerender } = render(
        <QueryClientProvider client={client}>
          <LocationSearchModal {...baseProps} visible={true} />
        </QueryClientProvider>
      );

      fireEvent.changeText(
        screen.getByPlaceholderText(/City, neighborhood, landmark/i),
        'Seattle'
      );
      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(screen.getByText('Seattle, WA')).toBeTruthy();
      });

      // Close the modal
      rerender(
        <QueryClientProvider client={client}>
          <LocationSearchModal {...baseProps} visible={false} />
        </QueryClientProvider>
      );

      // Reopen it
      rerender(
        <QueryClientProvider client={client}>
          <LocationSearchModal {...baseProps} visible={true} />
        </QueryClientProvider>
      );

      act(() => { jest.advanceTimersByTime(350); });

      expect(screen.getByText(/Type a city, neighborhood, or landmark/i)).toBeTruthy();
    });
  });
});
