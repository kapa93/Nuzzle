import { create } from 'zustand';
import type { BreedEnum, PostWithDetails } from '../types';

export type FeedSort = 'newest' | 'trending';

interface UIState {
  feedSort: FeedSort;
  setFeedSort: (sort: FeedSort) => void;
  reactionPickerPost: PostWithDetails | null;
  setReactionPickerPost: (post: PostWithDetails | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  feedSort: 'newest',
  setFeedSort: (feedSort) => set({ feedSort }),
  reactionPickerPost: null,
  setReactionPickerPost: (reactionPickerPost) => set({ reactionPickerPost }),
}));
