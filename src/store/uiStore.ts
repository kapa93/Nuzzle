import { create } from 'zustand';
import type { BreedEnum, PostWithDetails, PostTypeEnum } from '../types';

export type FeedSort = 'newest' | 'trending';

export type FeedFilter = 'all' | PostTypeEnum;

interface UIState {
  feedFilter: FeedFilter;
  setFeedFilter: (filter: FeedFilter) => void;
  reactionPickerPost: PostWithDetails | null;
  setReactionPickerPost: (post: PostWithDetails | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  feedFilter: 'all',
  setFeedFilter: (feedFilter) => set({ feedFilter }),
  reactionPickerPost: null,
  setReactionPickerPost: (reactionPickerPost) => set({ reactionPickerPost }),
}));
