import { useAuthStore } from '@/store/authStore';

const INITIAL_STATE = {
  session: null,
  user: null,
  needsOnboarding: false,
  onboardingDog: null,
  showPostPrompt: false,
  showMeetupPrompt: false,
};

beforeEach(() => {
  useAuthStore.setState(INITIAL_STATE);
});

describe('authStore — onboarding flow', () => {
  describe('setNeedsOnboarding', () => {
    it('sets the flag to true', () => {
      useAuthStore.getState().setNeedsOnboarding(true);
      expect(useAuthStore.getState().needsOnboarding).toBe(true);
    });

    it('sets the flag to false', () => {
      useAuthStore.setState({ needsOnboarding: true });
      useAuthStore.getState().setNeedsOnboarding(false);
      expect(useAuthStore.getState().needsOnboarding).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('clears needsOnboarding and stores the dog info atomically', () => {
      useAuthStore.setState({ needsOnboarding: true });
      useAuthStore.getState().completeOnboarding('Buddy', 'AUSTRALIAN_SHEPHERD');

      const state = useAuthStore.getState();
      expect(state.needsOnboarding).toBe(false);
      expect(state.onboardingDog).toEqual({ name: 'Buddy', breed: 'AUSTRALIAN_SHEPHERD' });
    });

    it('does not touch showPostPrompt or showMeetupPrompt', () => {
      useAuthStore.getState().completeOnboarding('Buddy', 'HUSKY');

      const state = useAuthStore.getState();
      expect(state.showPostPrompt).toBe(false);
      expect(state.showMeetupPrompt).toBe(false);
    });
  });

  describe('dismissOnboardingCard', () => {
    it('clears onboardingDog and chains to showPostPrompt', () => {
      useAuthStore.getState().completeOnboarding('Buddy', 'GOLDEN_RETRIEVER');
      useAuthStore.getState().dismissOnboardingCard();

      const state = useAuthStore.getState();
      expect(state.onboardingDog).toBeNull();
      expect(state.showPostPrompt).toBe(true);
    });

    it('does not set showMeetupPrompt yet', () => {
      useAuthStore.getState().completeOnboarding('Buddy', 'GOLDEN_RETRIEVER');
      useAuthStore.getState().dismissOnboardingCard();

      expect(useAuthStore.getState().showMeetupPrompt).toBe(false);
    });
  });

  describe('dismissPostPrompt', () => {
    it('clears showPostPrompt and chains to showMeetupPrompt', () => {
      useAuthStore.setState({ showPostPrompt: true });
      useAuthStore.getState().dismissPostPrompt();

      const state = useAuthStore.getState();
      expect(state.showPostPrompt).toBe(false);
      expect(state.showMeetupPrompt).toBe(true);
    });
  });

  describe('dismissMeetupPrompt', () => {
    it('clears showMeetupPrompt', () => {
      useAuthStore.setState({ showMeetupPrompt: true });
      useAuthStore.getState().dismissMeetupPrompt();

      expect(useAuthStore.getState().showMeetupPrompt).toBe(false);
    });

    it('does not affect other flags', () => {
      useAuthStore.setState({ showMeetupPrompt: true, showPostPrompt: false });
      useAuthStore.getState().dismissMeetupPrompt();

      expect(useAuthStore.getState().showPostPrompt).toBe(false);
    });
  });

  describe('full onboarding chain', () => {
    it('progresses through all steps in order', () => {
      // Step 1: signup triggers onboarding
      useAuthStore.getState().setNeedsOnboarding(true);
      expect(useAuthStore.getState().needsOnboarding).toBe(true);

      // Step 2: dog saved
      useAuthStore.getState().completeOnboarding('Scout', 'LABRADOR_RETRIEVER');
      expect(useAuthStore.getState().needsOnboarding).toBe(false);
      expect(useAuthStore.getState().onboardingDog).toEqual({ name: 'Scout', breed: 'LABRADOR_RETRIEVER' });

      // Step 3: welcome modal dismissed → post prompt shown
      useAuthStore.getState().dismissOnboardingCard();
      expect(useAuthStore.getState().onboardingDog).toBeNull();
      expect(useAuthStore.getState().showPostPrompt).toBe(true);

      // Step 4: post prompt dismissed → meetup prompt shown
      useAuthStore.getState().dismissPostPrompt();
      expect(useAuthStore.getState().showPostPrompt).toBe(false);
      expect(useAuthStore.getState().showMeetupPrompt).toBe(true);

      // Step 5: meetup prompt dismissed
      useAuthStore.getState().dismissMeetupPrompt();
      expect(useAuthStore.getState().showMeetupPrompt).toBe(false);
    });
  });

  describe('signOut', () => {
    it('resets all onboarding flags', () => {
      useAuthStore.setState({
        needsOnboarding: true,
        onboardingDog: { name: 'Scout', breed: 'HUSKY' },
        showPostPrompt: true,
        showMeetupPrompt: true,
      });

      useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.needsOnboarding).toBe(false);
      expect(state.onboardingDog).toBeNull();
      expect(state.showPostPrompt).toBe(false);
      expect(state.showMeetupPrompt).toBe(false);
    });
  });
});
