import { useOnboardingStore } from '@/store/onboardingStore';

const INITIAL_STATE = {
  needsOnboarding: false,
  onboardingDog: null,
  showPostPrompt: false,
  showMeetupPrompt: false,
};

beforeEach(() => {
  useOnboardingStore.setState(INITIAL_STATE);
});

describe('onboardingStore — progressive prompts flow', () => {
  describe('setNeedsOnboarding', () => {
    it('sets the flag to true', () => {
      useOnboardingStore.getState().setNeedsOnboarding(true);
      expect(useOnboardingStore.getState().needsOnboarding).toBe(true);
    });

    it('sets the flag to false', () => {
      useOnboardingStore.setState({ needsOnboarding: true });
      useOnboardingStore.getState().setNeedsOnboarding(false);
      expect(useOnboardingStore.getState().needsOnboarding).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('clears needsOnboarding and stores the dog info atomically', () => {
      useOnboardingStore.setState({ needsOnboarding: true });
      useOnboardingStore.getState().completeOnboarding('Buddy', 'AUSTRALIAN_SHEPHERD');

      const state = useOnboardingStore.getState();
      expect(state.needsOnboarding).toBe(false);
      expect(state.onboardingDog).toEqual({ name: 'Buddy', breed: 'AUSTRALIAN_SHEPHERD' });
    });

    it('does not touch showPostPrompt or showMeetupPrompt', () => {
      useOnboardingStore.getState().completeOnboarding('Buddy', 'HUSKY');

      const state = useOnboardingStore.getState();
      expect(state.showPostPrompt).toBe(false);
      expect(state.showMeetupPrompt).toBe(false);
    });
  });

  describe('dismissOnboardingCard', () => {
    it('clears onboardingDog and chains to showPostPrompt', () => {
      useOnboardingStore.getState().completeOnboarding('Buddy', 'GOLDEN_RETRIEVER');
      useOnboardingStore.getState().dismissOnboardingCard();

      const state = useOnboardingStore.getState();
      expect(state.onboardingDog).toBeNull();
      expect(state.showPostPrompt).toBe(true);
    });

    it('does not set showMeetupPrompt yet', () => {
      useOnboardingStore.getState().completeOnboarding('Buddy', 'GOLDEN_RETRIEVER');
      useOnboardingStore.getState().dismissOnboardingCard();

      expect(useOnboardingStore.getState().showMeetupPrompt).toBe(false);
    });
  });

  describe('dismissPostPrompt', () => {
    it('clears showPostPrompt and chains to showMeetupPrompt', () => {
      useOnboardingStore.setState({ showPostPrompt: true });
      useOnboardingStore.getState().dismissPostPrompt();

      const state = useOnboardingStore.getState();
      expect(state.showPostPrompt).toBe(false);
      expect(state.showMeetupPrompt).toBe(true);
    });
  });

  describe('dismissMeetupPrompt', () => {
    it('clears showMeetupPrompt', () => {
      useOnboardingStore.setState({ showMeetupPrompt: true });
      useOnboardingStore.getState().dismissMeetupPrompt();

      expect(useOnboardingStore.getState().showMeetupPrompt).toBe(false);
    });

    it('does not affect other flags', () => {
      useOnboardingStore.setState({ showMeetupPrompt: true, showPostPrompt: false });
      useOnboardingStore.getState().dismissMeetupPrompt();

      expect(useOnboardingStore.getState().showPostPrompt).toBe(false);
    });
  });

  describe('full onboarding chain', () => {
    it('progresses through all steps in order', () => {
      useOnboardingStore.getState().setNeedsOnboarding(true);
      expect(useOnboardingStore.getState().needsOnboarding).toBe(true);

      useOnboardingStore.getState().completeOnboarding('Scout', 'LABRADOR_RETRIEVER');
      expect(useOnboardingStore.getState().needsOnboarding).toBe(false);
      expect(useOnboardingStore.getState().onboardingDog).toEqual({ name: 'Scout', breed: 'LABRADOR_RETRIEVER' });

      useOnboardingStore.getState().dismissOnboardingCard();
      expect(useOnboardingStore.getState().onboardingDog).toBeNull();
      expect(useOnboardingStore.getState().showPostPrompt).toBe(true);

      useOnboardingStore.getState().dismissPostPrompt();
      expect(useOnboardingStore.getState().showPostPrompt).toBe(false);
      expect(useOnboardingStore.getState().showMeetupPrompt).toBe(true);

      useOnboardingStore.getState().dismissMeetupPrompt();
      expect(useOnboardingStore.getState().showMeetupPrompt).toBe(false);
    });
  });
});
