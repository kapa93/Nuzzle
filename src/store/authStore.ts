import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export interface OnboardingDog {
  name: string;
  breed: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  needsOnboarding: boolean;
  onboardingDog: OnboardingDog | null;
  showPostPrompt: boolean;
  showMeetupPrompt: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setNeedsOnboarding: (value: boolean) => void;
  completeOnboarding: (name: string, breed: string) => void;
  dismissOnboardingCard: () => void;
  dismissPostPrompt: () => void;
  dismissMeetupPrompt: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  needsOnboarding: false,
  onboardingDog: null,
  showPostPrompt: false,
  showMeetupPrompt: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setUser: (user) => set({ user }),
  setNeedsOnboarding: (value) => set({ needsOnboarding: value }),
  completeOnboarding: (name, breed) =>
    set({ needsOnboarding: false, onboardingDog: { name, breed } }),
  dismissOnboardingCard: () => set({ onboardingDog: null, showPostPrompt: true }),
  dismissPostPrompt: () => set({ showPostPrompt: false, showMeetupPrompt: true }),
  dismissMeetupPrompt: () => set({ showMeetupPrompt: false }),
  signOut: () =>
    set({
      session: null,
      user: null,
      needsOnboarding: false,
      onboardingDog: null,
      showPostPrompt: false,
      showMeetupPrompt: false,
    }),
}));
