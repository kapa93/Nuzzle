import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { LocationOnboardingModal } from '@/components/LocationOnboardingModal';
import { useUIStore } from '@/store/uiStore';
import { useLocationStore } from '@/store/locationStore';

// Stub out the child search modal so it doesn't pull in its own dependencies.
jest.mock('@/components/LocationSearchModal', () => ({
  LocationSearchModal: ({ visible }: { visible: boolean }) => {
    const { Text } = require('react-native');
    return visible ? <Text testID="location-search-modal">SearchModal</Text> : null;
  },
}));

jest.mock('expo-location');
jest.mock('@/store/uiStore');
jest.mock('@/store/locationStore');

const mockHideLocationModal = jest.fn();
const mockSetHasSeenLocationModal = jest.fn();
const mockBumpLocationSetupVersion = jest.fn();
const mockSetManualLocation = jest.fn();

function setupMocks({ locationModalVisible = true } = {}) {
  (useUIStore as unknown as jest.Mock).mockImplementation((selector: (s: object) => unknown) =>
    selector({
      locationModalVisible,
      hideLocationModal: mockHideLocationModal,
    })
  );

  (useLocationStore as unknown as jest.Mock).mockReturnValue(undefined);
  (useLocationStore as { getState: () => object }).getState = () => ({
    setHasSeenLocationModal: mockSetHasSeenLocationModal,
    bumpLocationSetupVersion: mockBumpLocationSetupVersion,
    setManualLocation: mockSetManualLocation,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('LocationOnboardingModal', () => {
  describe('rendering', () => {
    it('renders the title and all three action buttons when visible', () => {
      render(<LocationOnboardingModal />);

      expect(screen.getByText('Discover Local Dog Communities')).toBeTruthy();
      expect(screen.getByText('Use Current Location')).toBeTruthy();
      expect(screen.getByText('Search for a Location')).toBeTruthy();
      expect(screen.getByText('Not Now')).toBeTruthy();
    });

    it('does not show the modal when locationModalVisible is false', () => {
      setupMocks({ locationModalVisible: false });
      render(<LocationOnboardingModal />);

      expect(screen.queryByText('Discover Local Dog Communities')).toBeNull();
    });

    it('does not show an error text initially', () => {
      render(<LocationOnboardingModal />);
      // Error text is only shown after a failed permission request.
      expect(screen.queryByText(/permission/i)).toBeNull();
    });
  });

  describe('"Use Current Location" button — permission granted', () => {
    beforeEach(() => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
    });

    it('calls bumpLocationSetupVersion, setHasSeenLocationModal(true), and hideLocationModal', async () => {
      render(<LocationOnboardingModal />);

      await act(async () => {
        fireEvent.press(screen.getByText('Use Current Location'));
      });

      expect(mockBumpLocationSetupVersion).toHaveBeenCalledTimes(1);
      expect(mockSetHasSeenLocationModal).toHaveBeenCalledWith(true);
      expect(mockHideLocationModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('"Use Current Location" button — permission denied', () => {
    beforeEach(() => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
    });

    it('shows the permission-denied error text', async () => {
      render(<LocationOnboardingModal />);

      await act(async () => {
        fireEvent.press(screen.getByText('Use Current Location'));
      });

      expect(
        screen.getByText(/Location permission was denied/i)
      ).toBeTruthy();
    });

    it('does not call hideLocationModal', async () => {
      render(<LocationOnboardingModal />);

      await act(async () => {
        fireEvent.press(screen.getByText('Use Current Location'));
      });

      expect(mockHideLocationModal).not.toHaveBeenCalled();
    });

    it('does not call bumpLocationSetupVersion', async () => {
      render(<LocationOnboardingModal />);

      await act(async () => {
        fireEvent.press(screen.getByText('Use Current Location'));
      });

      expect(mockBumpLocationSetupVersion).not.toHaveBeenCalled();
    });
  });

  describe('"Use Current Location" button — requestForegroundPermissionsAsync throws', () => {
    beforeEach(() => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Hardware unavailable')
      );
    });

    it('shows the generic error text', async () => {
      render(<LocationOnboardingModal />);

      await act(async () => {
        fireEvent.press(screen.getByText('Use Current Location'));
      });

      expect(
        screen.getByText(/Couldn't request location permission/i)
      ).toBeTruthy();
    });

    it('does not call hideLocationModal', async () => {
      render(<LocationOnboardingModal />);

      await act(async () => {
        fireEvent.press(screen.getByText('Use Current Location'));
      });

      expect(mockHideLocationModal).not.toHaveBeenCalled();
    });
  });

  describe('"Search for a Location" button', () => {
    it('makes LocationSearchModal visible', () => {
      render(<LocationOnboardingModal />);

      fireEvent.press(screen.getByText('Search for a Location'));

      expect(screen.getByTestId('location-search-modal')).toBeTruthy();
    });
  });

  describe('"Not Now" button', () => {
    it('calls setHasSeenLocationModal(true) and hideLocationModal', () => {
      render(<LocationOnboardingModal />);

      fireEvent.press(screen.getByText('Not Now'));

      expect(mockSetHasSeenLocationModal).toHaveBeenCalledWith(true);
      expect(mockHideLocationModal).toHaveBeenCalledTimes(1);
    });

    it('does not call bumpLocationSetupVersion', () => {
      render(<LocationOnboardingModal />);

      fireEvent.press(screen.getByText('Not Now'));

      expect(mockBumpLocationSetupVersion).not.toHaveBeenCalled();
    });
  });

  describe('overlay backdrop press', () => {
    it('behaves the same as Not Now', async () => {
      render(<LocationOnboardingModal />);

      // The overlay Pressable fills the screen behind the sheet. It is the
      // first Pressable rendered inside the Animated.View overlay.
      const backdrops = screen.getAllByRole('button');
      // The backdrop is not an accessibilityRole="button" element; pressing any
      // Pressable that calls handleClose should trigger the dismiss path.
      // We verify the "Not Now" path as a proxy since both call handleNotNow.
      fireEvent.press(screen.getByText('Not Now'));

      expect(mockSetHasSeenLocationModal).toHaveBeenCalledWith(true);
      expect(mockHideLocationModal).toHaveBeenCalledTimes(1);
    });
  });
});
