import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ManualLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

interface LocationState {
  hasHydrated: boolean;
  /** Persisted: whether the user has seen the location onboarding modal (in any outcome). */
  hasSeenLocationModal: boolean;
  /** Persisted: manually selected location (city / neighborhood / landmark). */
  manualLocation: ManualLocation | null;
  /**
   * NOT persisted. Incrementing this triggers screens to re-run their location
   * check after the modal completes (GPS granted or manual location selected).
   */
  locationSetupVersion: number;
  setHasHydrated: (v: boolean) => void;
  setHasSeenLocationModal: (v: boolean) => void;
  setManualLocation: (loc: ManualLocation) => void;
  clearManualLocation: () => void;
  bumpLocationSetupVersion: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasSeenLocationModal: false,
      manualLocation: null,
      locationSetupVersion: 0,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setHasSeenLocationModal: (hasSeenLocationModal) => set({ hasSeenLocationModal }),
      setManualLocation: (manualLocation) => set({ manualLocation }),
      clearManualLocation: () => set({ manualLocation: null }),
      bumpLocationSetupVersion: () =>
        set((s) => ({ locationSetupVersion: s.locationSetupVersion + 1 })),
    }),
    {
      name: 'location-preferences-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenLocationModal: state.hasSeenLocationModal,
        manualLocation: state.manualLocation,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
