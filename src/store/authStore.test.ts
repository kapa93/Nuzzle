import { useAuthStore } from '@/store/authStore';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

const INITIAL_STATE = {
  session: null,
  user: null,
  profile: null,
};

beforeEach(() => {
  useAuthStore.setState(INITIAL_STATE);
});

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

const mockSession = {
  user: mockUser,
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
} as Session;

const mockProfile = {
  id: 'user-1',
  name: 'Test User',
  city: null,
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
} as unknown as Profile;

describe('authStore', () => {
  describe('initial state', () => {
    it('starts with null session, user, and profile', () => {
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
    });
  });

  describe('setSession', () => {
    it('sets the session and extracts the user from it', () => {
      useAuthStore.getState().setSession(mockSession);
      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(mockUser);
    });

    it('clears session and user when called with null', () => {
      useAuthStore.setState({ session: mockSession, user: mockUser });
      useAuthStore.getState().setSession(null);
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
    });

    it('does not affect the profile', () => {
      useAuthStore.setState({ profile: mockProfile });
      useAuthStore.getState().setSession(mockSession);
      expect(useAuthStore.getState().profile).toEqual(mockProfile);
    });
  });

  describe('setUser', () => {
    it('sets the user directly', () => {
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('clears the user when called with null', () => {
      useAuthStore.setState({ user: mockUser });
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('does not affect the session', () => {
      useAuthStore.setState({ session: mockSession });
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().session).toEqual(mockSession);
    });
  });

  describe('setProfile', () => {
    it('sets the profile', () => {
      useAuthStore.getState().setProfile(mockProfile);
      expect(useAuthStore.getState().profile).toEqual(mockProfile);
    });

    it('clears the profile when called with null', () => {
      useAuthStore.setState({ profile: mockProfile });
      useAuthStore.getState().setProfile(null);
      expect(useAuthStore.getState().profile).toBeNull();
    });

    it('does not affect session or user', () => {
      useAuthStore.setState({ session: mockSession, user: mockUser });
      useAuthStore.getState().setProfile(mockProfile);
      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('signOut', () => {
    it('clears session, user, and profile atomically', () => {
      useAuthStore.setState({
        session: mockSession,
        user: mockUser,
        profile: mockProfile,
      });
      useAuthStore.getState().signOut();
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
    });

    it('is idempotent — calling signOut on an already-signed-out store is safe', () => {
      expect(() => useAuthStore.getState().signOut()).not.toThrow();
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
    });
  });
});
