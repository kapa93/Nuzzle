import { create } from 'zustand';
import type { BreedEnum, PostWithDetails, PostTypeEnum } from '../types';

export type FeedSort = 'newest' | 'trending';

export type FeedFilter = 'all' | PostTypeEnum;

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface UIState {
  feedFilter: FeedFilter;
  setFeedFilter: (filter: FeedFilter) => void;
  reactionPickerPost: PostWithDetails | null;
  setReactionPickerPost: (post: PostWithDetails | null) => void;
  /** Breed of the BreedFeed screen currently in focus, or null when not on a breed feed. */
  activeFeedBreed: BreedEnum | null;
  setActiveFeedBreed: (breed: BreedEnum | null) => void;
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  notificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  guestPromptVisible: boolean;
  showGuestPrompt: () => void;
  hideGuestPrompt: () => void;
  locationModalVisible: boolean;
  showLocationModal: () => void;
  hideLocationModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  feedFilter: 'all',
  setFeedFilter: (feedFilter) => set({ feedFilter }),
  reactionPickerPost: null,
  setReactionPickerPost: (reactionPickerPost) => set({ reactionPickerPost }),
  activeFeedBreed: null,
  setActiveFeedBreed: (activeFeedBreed) => set({ activeFeedBreed }),
  toast: { visible: false, message: '', type: 'success' },
  showToast: (message, type = 'success') =>
    set({ toast: { visible: true, message, type } }),
  hideToast: () =>
    set((s) => ({ toast: { ...s.toast, visible: false } })),
  notificationsOpen: false,
  openNotifications: () => set({ notificationsOpen: true }),
  closeNotifications: () => set({ notificationsOpen: false }),
  guestPromptVisible: false,
  showGuestPrompt: () => set({ guestPromptVisible: true }),
  hideGuestPrompt: () => set({ guestPromptVisible: false }),
  locationModalVisible: false,
  showLocationModal: () => set({ locationModalVisible: true }),
  hideLocationModal: () => set({ locationModalVisible: false }),
}));
